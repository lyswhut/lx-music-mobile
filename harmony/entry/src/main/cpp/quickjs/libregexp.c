/*
 * Regular Expression Engine
 *
 * Copyright (c) 2017-2018 Fabrice Bellard
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
#include <stdlib.h>
#include <stdio.h>
#include <stdarg.h>
#include <inttypes.h>
#include <string.h>
#include <assert.h>

#include "cutils.h"
#include "libregexp.h"
#include "libunicode.h"

/*
  TODO:

  - Add a lock step execution mode (=linear time execution guaranteed)
    when the regular expression is "simple" i.e. no backreference nor
    complicated lookahead. The opcodes are designed for this execution
    model.
*/

#if defined(TEST)
#define DUMP_REOP
#endif

typedef enum {
#define DEF(id, size) REOP_ ## id,
#include "libregexp-opcode.h"
#undef DEF
    REOP_COUNT,
} REOPCodeEnum;

#define CAPTURE_COUNT_MAX 255
#define STACK_SIZE_MAX 255
/* must be large enough to have a negligible runtime cost and small
   enough to call the interrupt callback often. */
#define INTERRUPT_COUNTER_INIT 10000

/* unicode code points */
#define CP_LS   0x2028
#define CP_PS   0x2029

#define TMP_BUF_SIZE 128

typedef struct {
    DynBuf byte_code;
    const uint8_t *buf_ptr;
    const uint8_t *buf_end;
    const uint8_t *buf_start;
    int re_flags;
    BOOL is_unicode;
    BOOL unicode_sets; /* if set, is_unicode is also set */
    BOOL ignore_case;
    BOOL multi_line;
    BOOL dotall;
    int capture_count;
    int total_capture_count; /* -1 = not computed yet */
    int has_named_captures; /* -1 = don't know, 0 = no, 1 = yes */
    void *opaque;
    DynBuf group_names;
    union {
        char error_msg[TMP_BUF_SIZE];
        char tmp_buf[TMP_BUF_SIZE];
    } u;
} REParseState;

typedef struct {
#ifdef DUMP_REOP
    const char *name;
#endif
    uint8_t size;
} REOpCode;

static const REOpCode reopcode_info[REOP_COUNT] = {
#ifdef DUMP_REOP
#define DEF(id, size) { #id, size },
#else
#define DEF(id, size) { size },
#endif
#include "libregexp-opcode.h"
#undef DEF
};

#define RE_HEADER_FLAGS         0
#define RE_HEADER_CAPTURE_COUNT 2
#define RE_HEADER_STACK_SIZE    3
#define RE_HEADER_BYTECODE_LEN  4

#define RE_HEADER_LEN 8

static inline int is_digit(int c) {
    return c >= '0' && c <= '9';
}

/* insert 'len' bytes at position 'pos'. Return < 0 if error. */
static int dbuf_insert(DynBuf *s, int pos, int len)
{
    if (dbuf_realloc(s, s->size + len))
        return -1;
    memmove(s->buf + pos + len, s->buf + pos, s->size - pos);
    s->size += len;
    return 0;
}

typedef struct REString {
    struct REString *next;
    uint32_t hash;
    uint32_t len;
    uint32_t buf[];
} REString;

typedef struct {
    /* the string list is the union of 'char_range' and of the strings
       in hash_table[]. The strings in hash_table[] have a length !=
       1. */
    CharRange cr;
    uint32_t n_strings;
    uint32_t hash_size;
    int hash_bits;
    REString **hash_table;
} REStringList;

static uint32_t re_string_hash(int len, const uint32_t *buf)
{
    int i;
    uint32_t h;
    h = 1;
    for(i = 0; i < len; i++)
        h = h * 263 + buf[i];
    return h * 0x61C88647;
}

static void re_string_list_init(REParseState *s1, REStringList *s)
{
    cr_init(&s->cr, s1->opaque, lre_realloc);
    s->n_strings = 0;
    s->hash_size = 0;
    s->hash_bits = 0;
    s->hash_table = NULL;
}

static void re_string_list_free(REStringList *s)
{
    REString *p, *p_next;
    int i;
    for(i = 0; i < s->hash_size; i++) {
        for(p = s->hash_table[i]; p != NULL; p = p_next) {
            p_next = p->next;
            lre_realloc(s->cr.mem_opaque, p, 0);
        }
    }
    lre_realloc(s->cr.mem_opaque, s->hash_table, 0);

    cr_free(&s->cr);
}

static void lre_print_char(int c, BOOL is_range)
{
    if (c == '\'' || c == '\\' ||
        (is_range && (c == '-' || c == ']'))) {
        printf("\\%c", c);
    } else if (c >= ' ' && c <= 126) {
        printf("%c", c);
    } else {
        printf("\\u{%04x}", c);
    }
}

static __maybe_unused void re_string_list_dump(const char *str, const REStringList *s)
{
    REString *p;
    const CharRange *cr;
    int i, j, k;

    printf("%s:\n", str);
    printf("  ranges: [");
    cr = &s->cr;
    for(i = 0; i < cr->len; i += 2) {
        lre_print_char(cr->points[i], TRUE);
        if (cr->points[i] != cr->points[i + 1] - 1) {
            printf("-");
            lre_print_char(cr->points[i + 1] - 1, TRUE);
        }
    }
    printf("]\n");
    
    j = 0;
    for(i = 0; i < s->hash_size; i++) {
        for(p = s->hash_table[i]; p != NULL; p = p->next) {
            printf("  %d/%d: '", j, s->n_strings);
            for(k = 0; k < p->len; k++) {
                lre_print_char(p->buf[k], FALSE);
            }
            printf("'\n");
            j++;
        }
    }
}

static int re_string_find2(REStringList *s, int len, const uint32_t *buf,
                           uint32_t h0, BOOL add_flag)
{
    uint32_t h = 0; /* avoid warning */
    REString *p;
    if (s->n_strings != 0) {
        h = h0 >> (32 - s->hash_bits);
        for(p = s->hash_table[h]; p != NULL; p = p->next) {
            if (p->hash == h0 && p->len == len &&
                !memcmp(p->buf, buf, len * sizeof(buf[0]))) {
                return 1;
            }
        }
    }
    /* not found */
    if (!add_flag)
        return 0;
    /* increase the size of the hash table if needed */
    if (unlikely((s->n_strings + 1) > s->hash_size)) {
        REString **new_hash_table, *p_next;
        int new_hash_bits, i;
        uint32_t new_hash_size;
        new_hash_bits = max_int(s->hash_bits + 1, 4);
        new_hash_size = 1 << new_hash_bits;
        new_hash_table = lre_realloc(s->cr.mem_opaque, NULL,
                                     sizeof(new_hash_table[0]) * new_hash_size);
        if (!new_hash_table)
            return -1;
        memset(new_hash_table, 0, sizeof(new_hash_table[0]) * new_hash_size);
        for(i = 0; i < s->hash_size; i++) {
            for(p = s->hash_table[i]; p != NULL; p = p_next) {
                p_next = p->next;
                h = p->hash >> (32 - new_hash_bits);
                p->next = new_hash_table[h];
                new_hash_table[h] = p;
            }
        }
        lre_realloc(s->cr.mem_opaque, s->hash_table, 0);
        s->hash_bits = new_hash_bits;
        s->hash_size = new_hash_size;
        s->hash_table = new_hash_table;
        h = h0 >> (32 - s->hash_bits);
    }

    p = lre_realloc(s->cr.mem_opaque, NULL, sizeof(REString) + len * sizeof(buf[0]));
    if (!p)
        return -1;
    p->next = s->hash_table[h];
    s->hash_table[h] = p;
    s->n_strings++;
    p->hash = h0;
    p->len = len;
    memcpy(p->buf, buf, sizeof(buf[0]) * len);
    return 1;
}

static int re_string_find(REStringList *s, int len, const uint32_t *buf,
                          BOOL add_flag)
{
    uint32_t h0;
    h0 = re_string_hash(len, buf);
    return re_string_find2(s, len, buf, h0, add_flag);
}

/* return -1 if memory error, 0 if OK */
static int re_string_add(REStringList *s, int len, const uint32_t *buf)
{
    if (len == 1) {
        return cr_union_interval(&s->cr, buf[0], buf[0]);
    }
    if (re_string_find(s, len, buf, TRUE) < 0)
        return -1;
    return 0;
}

/* a = a op b */
static int re_string_list_op(REStringList *a, REStringList *b, int op)
{
    int i, ret;
    REString *p, **pp;

    if (cr_op1(&a->cr, b->cr.points, b->cr.len, op))
        return -1;

    switch(op) {
    case CR_OP_UNION:
        if (b->n_strings != 0) {
            for(i = 0; i < b->hash_size; i++) {
                for(p = b->hash_table[i]; p != NULL; p = p->next) {
                    if (re_string_find2(a, p->len, p->buf, p->hash, TRUE) < 0)
                        return -1;
                }
            }
        }
        break;
    case CR_OP_INTER:
    case CR_OP_SUB:
        for(i = 0; i < a->hash_size; i++) {
            pp = &a->hash_table[i];
            for(;;) {
                p = *pp;
                if (p == NULL)
                    break;
                ret = re_string_find2(b, p->len, p->buf, p->hash, FALSE);
                if (op == CR_OP_SUB)
                    ret = !ret;
                if (!ret) {
                    /* remove it */
                    *pp = p->next;
                    a->n_strings--;
                    lre_realloc(a->cr.mem_opaque, p, 0);
                } else {
                    /* keep it */
                    pp = &p->next;
                }
            }
        }
        break;
    default:
        abort();
    }
    return 0;
}

static int re_string_list_canonicalize(REParseState *s1,
                                       REStringList *s, BOOL is_unicode)
{
    if (cr_regexp_canonicalize(&s->cr, is_unicode))
        return -1;
    if (s->n_strings != 0) {
        REStringList a_s, *a = &a_s;
        int i, j;
        REString *p;
        
        /* XXX: simplify */
        re_string_list_init(s1, a);

        a->n_strings = s->n_strings;
        a->hash_size = s->hash_size;
        a->hash_bits = s->hash_bits;
        a->hash_table = s->hash_table;
        
        s->n_strings = 0;
        s->hash_size = 0;
        s->hash_bits = 0;
        s->hash_table = NULL;

        for(i = 0; i < a->hash_size; i++) {
            for(p = a->hash_table[i]; p != NULL; p = p->next) {
                for(j = 0; j < p->len; j++) {
                    p->buf[j] = lre_canonicalize(p->buf[j], is_unicode);
                }
                if (re_string_add(s, p->len, p->buf)) {
                    re_string_list_free(a);
                    return -1;
                }
            }
        }
        re_string_list_free(a);
    }
    return 0;
}

static const uint16_t char_range_d[] = {
    1,
    0x0030, 0x0039 + 1,
};

/* code point ranges for Zs,Zl or Zp property */
static const uint16_t char_range_s[] = {
    10,
    0x0009, 0x000D + 1,
    0x0020, 0x0020 + 1,
    0x00A0, 0x00A0 + 1,
    0x1680, 0x1680 + 1,
    0x2000, 0x200A + 1,
    /* 2028;LINE SEPARATOR;Zl;0;WS;;;;;N;;;;; */
    /* 2029;PARAGRAPH SEPARATOR;Zp;0;B;;;;;N;;;;; */
    0x2028, 0x2029 + 1,
    0x202F, 0x202F + 1,
    0x205F, 0x205F + 1,
    0x3000, 0x3000 + 1,
    /* FEFF;ZERO WIDTH NO-BREAK SPACE;Cf;0;BN;;;;;N;BYTE ORDER MARK;;;; */
    0xFEFF, 0xFEFF + 1,
};

static const uint16_t char_range_w[] = {
    4,
    0x0030, 0x0039 + 1,
    0x0041, 0x005A + 1,
    0x005F, 0x005F + 1,
    0x0061, 0x007A + 1,
};

#define CLASS_RANGE_BASE 0x40000000

typedef enum {
    CHAR_RANGE_d,
    CHAR_RANGE_D,
    CHAR_RANGE_s,
    CHAR_RANGE_S,
    CHAR_RANGE_w,
    CHAR_RANGE_W,
} CharRangeEnum;

static const uint16_t * const char_range_table[] = {
    char_range_d,
    char_range_s,
    char_range_w,
};

static int cr_init_char_range(REParseState *s, REStringList *cr, uint32_t c)
{
    BOOL invert;
    const uint16_t *c_pt;
    int len, i;

    invert = c & 1;
    c_pt = char_range_table[c >> 1];
    len = *c_pt++;
    re_string_list_init(s, cr);
    for(i = 0; i < len * 2; i++) {
        if (cr_add_point(&cr->cr, c_pt[i]))
            goto fail;
    }
    if (invert) {
        if (cr_invert(&cr->cr))
            goto fail;
    }
    return 0;
 fail:
    re_string_list_free(cr);
    return -1;
}

#ifdef DUMP_REOP
static __maybe_unused void lre_dump_bytecode(const uint8_t *buf,
                                                     int buf_len)
{
    int pos, len, opcode, bc_len, re_flags, i;
    uint32_t val;

    assert(buf_len >= RE_HEADER_LEN);

    re_flags = lre_get_flags(buf);
    bc_len = get_u32(buf + RE_HEADER_BYTECODE_LEN);
    assert(bc_len + RE_HEADER_LEN <= buf_len);
    printf("flags: 0x%x capture_count=%d stack_size=%d\n",
           re_flags, buf[RE_HEADER_CAPTURE_COUNT], buf[RE_HEADER_STACK_SIZE]);
    if (re_flags & LRE_FLAG_NAMED_GROUPS) {
        const char *p;
        p = (char *)buf + RE_HEADER_LEN + bc_len;
        printf("named groups: ");
        for(i = 1; i < buf[RE_HEADER_CAPTURE_COUNT]; i++) {
            if (i != 1)
                printf(",");
            printf("<%s>", p);
            p += strlen(p) + 1;
        }
        printf("\n");
        assert(p == (char *)(buf + buf_len));
    }
    printf("bytecode_len=%d\n", bc_len);

    buf += RE_HEADER_LEN;
    pos = 0;
    while (pos < bc_len) {
        printf("%5u: ", pos);
        opcode = buf[pos];
        len = reopcode_info[opcode].size;
        if (opcode >= REOP_COUNT) {
            printf(" invalid opcode=0x%02x\n", opcode);
            break;
        }
        if ((pos + len) > bc_len) {
            printf(" buffer overflow (opcode=0x%02x)\n", opcode);
            break;
        }
        printf("%s", reopcode_info[opcode].name);
        switch(opcode) {
        case REOP_char:
        case REOP_char_i:
            val = get_u16(buf + pos + 1);
            if (val >= ' ' && val <= 126)
                printf(" '%c'", val);
            else
                printf(" 0x%04x", val);
            break;
        case REOP_char32:
        case REOP_char32_i:
            val = get_u32(buf + pos + 1);
            if (val >= ' ' && val <= 126)
                printf(" '%c'", val);
            else
                printf(" 0x%08x", val);
            break;
        case REOP_goto:
        case REOP_split_goto_first:
        case REOP_split_next_first:
        case REOP_loop:
        case REOP_lookahead:
        case REOP_negative_lookahead:
            val = get_u32(buf + pos + 1);
            val += (pos + 5);
            printf(" %u", val);
            break;
        case REOP_simple_greedy_quant:
            printf(" %u %u %u %u",
                   get_u32(buf + pos + 1) + (pos + 17),
                   get_u32(buf + pos + 1 + 4),
                   get_u32(buf + pos + 1 + 8),
                   get_u32(buf + pos + 1 + 12));
            break;
        case REOP_save_start:
        case REOP_save_end:
        case REOP_back_reference:
        case REOP_back_reference_i:
        case REOP_backward_back_reference:
        case REOP_backward_back_reference_i:
            printf(" %u", buf[pos + 1]);
            break;
        case REOP_save_reset:
            printf(" %u %u", buf[pos + 1], buf[pos + 2]);
            break;
        case REOP_push_i32:
            val = get_u32(buf + pos + 1);
            printf(" %d", val);
            break;
        case REOP_range:
        case REOP_range_i:
            {
                int n, i;
                n = get_u16(buf + pos + 1);
                len += n * 4;
                for(i = 0; i < n * 2; i++) {
                    val = get_u16(buf + pos + 3 + i * 2);
                    printf(" 0x%04x", val);
                }
            }
            break;
        case REOP_range32:
        case REOP_range32_i:
            {
                int n, i;
                n = get_u16(buf + pos + 1);
                len += n * 8;
                for(i = 0; i < n * 2; i++) {
                    val = get_u32(buf + pos + 3 + i * 4);
                    printf(" 0x%08x", val);
                }
            }
            break;
        default:
            break;
        }
        printf("\n");
        pos += len;
    }
}
#endif

static void re_emit_op(REParseState *s, int op)
{
    dbuf_putc(&s->byte_code, op);
}

/* return the offset of the u32 value */
static int re_emit_op_u32(REParseState *s, int op, uint32_t val)
{
    int pos;
    dbuf_putc(&s->byte_code, op);
    pos = s->byte_code.size;
    dbuf_put_u32(&s->byte_code, val);
    return pos;
}

static int re_emit_goto(REParseState *s, int op, uint32_t val)
{
    int pos;
    dbuf_putc(&s->byte_code, op);
    pos = s->byte_code.size;
    dbuf_put_u32(&s->byte_code, val - (pos + 4));
    return pos;
}

static void re_emit_op_u8(REParseState *s, int op, uint32_t val)
{
    dbuf_putc(&s->byte_code, op);
    dbuf_putc(&s->byte_code, val);
}

static void re_emit_op_u16(REParseState *s, int op, uint32_t val)
{
    dbuf_putc(&s->byte_code, op);
    dbuf_put_u16(&s->byte_code, val);
}

static int __attribute__((format(printf, 2, 3))) re_parse_error(REParseState *s, const char *fmt, ...)
{
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(s->u.error_msg, sizeof(s->u.error_msg), fmt, ap);
    va_end(ap);
    return -1;
}

static int re_parse_out_of_memory(REParseState *s)
{
    return re_parse_error(s, "out of memory");
}

/* If allow_overflow is false, return -1 in case of
   overflow. Otherwise return INT32_MAX. */
static int parse_digits(const uint8_t **pp, BOOL allow_overflow)
{
    const uint8_t *p;
    uint64_t v;
    int c;

    p = *pp;
    v = 0;
    for(;;) {
        c = *p;
        if (c < '0' || c > '9')
            break;
        v = v * 10 + c - '0';
        if (v >= INT32_MAX) {
            if (allow_overflow)
                v = INT32_MAX;
            else
                return -1;
        }
        p++;
    }
    *pp = p;
    return v;
}

static int re_parse_expect(REParseState *s, const uint8_t **pp, int c)
{
    const uint8_t *p;
    p = *pp;
    if (*p != c)
        return re_parse_error(s, "expecting '%c'", c);
    p++;
    *pp = p;
    return 0;
}

/* Parse an escape sequence, *pp points after the '\':
   allow_utf16 value:
   0 : no UTF-16 escapes allowed
   1 : UTF-16 escapes allowed
   2 : UTF-16 escapes allowed and escapes of surrogate pairs are
   converted to a unicode character (unicode regexp case).

   Return the unicode char and update *pp if recognized,
   return -1 if malformed escape,
   return -2 otherwise. */
int lre_parse_escape(const uint8_t **pp, int allow_utf16)
{
    const uint8_t *p;
    uint32_t c;

    p = *pp;
    c = *p++;
    switch(c) {
    case 'b':
        c = '\b';
        break;
    case 'f':
        c = '\f';
        break;
    case 'n':
        c = '\n';
        break;
    case 'r':
        c = '\r';
        break;
    case 't':
        c = '\t';
        break;
    case 'v':
        c = '\v';
        break;
    case 'x':
    case 'u':
        {
            int h, n, i;
            uint32_t c1;

            if (*p == '{' && allow_utf16) {
                p++;
                c = 0;
                for(;;) {
                    h = from_hex(*p++);
                    if (h < 0)
                        return -1;
                    c = (c << 4) | h;
                    if (c > 0x10FFFF)
                        return -1;
                    if (*p == '}')
                        break;
                }
                p++;
            } else {
                if (c == 'x') {
                    n = 2;
                } else {
                    n = 4;
                }

                c = 0;
                for(i = 0; i < n; i++) {
                    h = from_hex(*p++);
                    if (h < 0) {
                        return -1;
                    }
                    c = (c << 4) | h;
                }
                if (is_hi_surrogate(c) &&
                    allow_utf16 == 2 && p[0] == '\\' && p[1] == 'u') {
                    /* convert an escaped surrogate pair into a
                       unicode char */
                    c1 = 0;
                    for(i = 0; i < 4; i++) {
                        h = from_hex(p[2 + i]);
                        if (h < 0)
                            break;
                        c1 = (c1 << 4) | h;
                    }
                    if (i == 4 && is_lo_surrogate(c1)) {
                        p += 6;
                        c = from_surrogate(c, c1);
                    }
                }
            }
        }
        break;
    case '0': case '1': case '2': case '3':
    case '4': case '5': case '6': case '7':
        c -= '0';
        if (allow_utf16 == 2) {
            /* only accept \0 not followed by digit */
            if (c != 0 || is_digit(*p))
                return -1;
        } else {
            /* parse a legacy octal sequence */
            uint32_t v;
            v = *p - '0';
            if (v > 7)
                break;
            c = (c << 3) | v;
            p++;
            if (c >= 32)
                break;
            v = *p - '0';
            if (v > 7)
                break;
            c = (c << 3) | v;
            p++;
        }
        break;
    default:
        return -2;
    }
    *pp = p;
    return c;
}

#ifdef CONFIG_ALL_UNICODE
/* XXX: we use the same chars for name and value */
static BOOL is_unicode_char(int c)
{
    return ((c >= '0' && c <= '9') ||
            (c >= 'A' && c <= 'Z') ||
            (c >= 'a' && c <= 'z') ||
            (c == '_'));
}

/* XXX: memory error test */
static void seq_prop_cb(void *opaque, const uint32_t *seq, int seq_len)
{
    REStringList *sl = opaque;
    re_string_add(sl, seq_len, seq);
}

static int parse_unicode_property(REParseState *s, REStringList *cr,
                                  const uint8_t **pp, BOOL is_inv,
                                  BOOL allow_sequence_prop)
{
    const uint8_t *p;
    char name[64], value[64];
    char *q;
    BOOL script_ext;
    int ret;

    p = *pp;
    if (*p != '{')
        return re_parse_error(s, "expecting '{' after \\p");
    p++;
    q = name;
    while (is_unicode_char(*p)) {
        if ((q - name) >= sizeof(name) - 1)
            goto unknown_property_name;
        *q++ = *p++;
    }
    *q = '\0';
    q = value;
    if (*p == '=') {
        p++;
        while (is_unicode_char(*p)) {
            if ((q - value) >= sizeof(value) - 1)
                return re_parse_error(s, "unknown unicode property value");
            *q++ = *p++;
        }
    }
    *q = '\0';
    if (*p != '}')
        return re_parse_error(s, "expecting '}'");
    p++;
    //    printf("name=%s value=%s\n", name, value);

    if (!strcmp(name, "Script") || !strcmp(name, "sc")) {
        script_ext = FALSE;
        goto do_script;
    } else if (!strcmp(name, "Script_Extensions") || !strcmp(name, "scx")) {
        script_ext = TRUE;
    do_script:
        re_string_list_init(s, cr);
        ret = unicode_script(&cr->cr, value, script_ext);
        if (ret) {
            re_string_list_free(cr);
            if (ret == -2)
                return re_parse_error(s, "unknown unicode script");
            else
                goto out_of_memory;
        }
    } else if (!strcmp(name, "General_Category") || !strcmp(name, "gc")) {
        re_string_list_init(s, cr);
        ret = unicode_general_category(&cr->cr, value);
        if (ret) {
            re_string_list_free(cr);
            if (ret == -2)
                return re_parse_error(s, "unknown unicode general category");
            else
                goto out_of_memory;
        }
    } else if (value[0] == '\0') {
        re_string_list_init(s, cr);
        ret = unicode_general_category(&cr->cr, name);
        if (ret == -1) {
            re_string_list_free(cr);
            goto out_of_memory;
        }
        if (ret < 0) {
            ret = unicode_prop(&cr->cr, name);
            if (ret == -1) {
                re_string_list_free(cr);
                goto out_of_memory;
            }
        }
        if (ret < 0 && !is_inv && allow_sequence_prop) {
            CharRange cr_tmp;
            cr_init(&cr_tmp, s->opaque, lre_realloc);
            ret = unicode_sequence_prop(name, seq_prop_cb, cr, &cr_tmp);
            cr_free(&cr_tmp);
            if (ret == -1) {
                re_string_list_free(cr);
                goto out_of_memory;
            }
        }
        if (ret < 0)
            goto unknown_property_name;
    } else {
    unknown_property_name:
        return re_parse_error(s, "unknown unicode property name");
    }

    /* the ordering of case folding and inversion  differs with
       unicode_sets. 'unicode_sets' ordering is more consistent */
    /* XXX: the spec seems incorrect, we do it as the other engines
       seem to do it. */
    if (s->ignore_case && s->unicode_sets) {
        if (re_string_list_canonicalize(s, cr, s->is_unicode)) {
            re_string_list_free(cr);
            goto out_of_memory;
        }
    }
    if (is_inv) {
        if (cr_invert(&cr->cr)) {
            re_string_list_free(cr);
            goto out_of_memory;
        }
    }
    if (s->ignore_case && !s->unicode_sets) {
        if (re_string_list_canonicalize(s, cr, s->is_unicode)) {
            re_string_list_free(cr);
            goto out_of_memory;
        }
    }
    *pp = p;
    return 0;
 out_of_memory:
    return re_parse_out_of_memory(s);
}
#endif /* CONFIG_ALL_UNICODE */

static int get_class_atom(REParseState *s, REStringList *cr,
                          const uint8_t **pp, BOOL inclass);

static int parse_class_string_disjunction(REParseState *s, REStringList *cr,
                                          const uint8_t **pp)
{
    const uint8_t *p;
    DynBuf str;
    int c;
    
    p = *pp;
    if (*p != '{')
        return re_parse_error(s, "expecting '{' after \\q");

    dbuf_init2(&str, s->opaque, lre_realloc);
    re_string_list_init(s, cr);
    
    p++;
    for(;;) {
        str.size = 0;
        while (*p != '}' && *p != '|') {
            c = get_class_atom(s, NULL, &p, FALSE);
            if (c < 0)
                goto fail;
            if (dbuf_put_u32(&str, c)) {
                re_parse_out_of_memory(s);
                goto fail;
            }
        }
        if (re_string_add(cr, str.size / 4, (uint32_t *)str.buf)) {
            re_parse_out_of_memory(s);
            goto fail;
        }
        if (*p == '}')
            break;
        p++;
    }
    if (s->ignore_case) {
        if (re_string_list_canonicalize(s, cr, TRUE))
            goto fail;
    }
    p++; /* skip the '}' */
    dbuf_free(&str);
    *pp = p;
    return 0;
 fail:
    dbuf_free(&str);
    re_string_list_free(cr);
    return -1;
}

/* return -1 if error otherwise the character or a class range
   (CLASS_RANGE_BASE) if cr != NULL. In case of class range, 'cr' is
   initialized. Otherwise, it is ignored. */
static int get_class_atom(REParseState *s, REStringList *cr,
                          const uint8_t **pp, BOOL inclass)
{
    const uint8_t *p;
    uint32_t c;
    int ret;

    p = *pp;

    c = *p;
    switch(c) {
    case '\\':
        p++;
        if (p >= s->buf_end)
            goto unexpected_end;
        c = *p++;
        switch(c) {
        case 'd':
            c = CHAR_RANGE_d;
            goto class_range;
        case 'D':
            c = CHAR_RANGE_D;
            goto class_range;
        case 's':
            c = CHAR_RANGE_s;
            goto class_range;
        case 'S':
            c = CHAR_RANGE_S;
            goto class_range;
        case 'w':
            c = CHAR_RANGE_w;
            goto class_range;
        case 'W':
            c = CHAR_RANGE_W;
        class_range:
            if (!cr)
                goto default_escape;
            if (cr_init_char_range(s, cr, c))
                return -1;
            c = CLASS_RANGE_BASE;
            break;
        case 'c':
            c = *p;
            if ((c >= 'a' && c <= 'z') ||
                (c >= 'A' && c <= 'Z') ||
                (((c >= '0' && c <= '9') || c == '_') &&
                 inclass && !s->is_unicode)) {   /* Annex B.1.4 */
                c &= 0x1f;
                p++;
            } else if (s->is_unicode) {
                goto invalid_escape;
            } else {
                /* otherwise return '\' and 'c' */
                p--;
                c = '\\';
            }
            break;
        case '-':
            if (!inclass && s->is_unicode)
                goto invalid_escape;
            break;
        case '^':
        case '$':
        case '\\':
        case '.':
        case '*':
        case '+':
        case '?':
        case '(':
        case ')':
        case '[':
        case ']':
        case '{':
        case '}':
        case '|':
        case '/':
            /* always valid to escape these characters */
            break;
#ifdef CONFIG_ALL_UNICODE
        case 'p':
        case 'P':
            if (s->is_unicode && cr) {
                if (parse_unicode_property(s, cr, &p, (c == 'P'), s->unicode_sets))
                    return -1;
                c = CLASS_RANGE_BASE;
                break;
            }
            goto default_escape;
#endif
        case 'q':
            if (s->unicode_sets && cr && inclass) {
                if (parse_class_string_disjunction(s, cr, &p))
                    return -1;
                c = CLASS_RANGE_BASE;
                break;
            }
            goto default_escape;
        default:
        default_escape:
            p--;
            ret = lre_parse_escape(&p, s->is_unicode * 2);
            if (ret >= 0) {
                c = ret;
            } else {
                if (s->is_unicode) {
                invalid_escape:
                    return re_parse_error(s, "invalid escape sequence in regular expression");
                } else {
                    /* just ignore the '\' */
                    goto normal_char;
                }
            }
            break;
        }
        break;
    case '\0':
        if (p >= s->buf_end) {
        unexpected_end:
            return re_parse_error(s, "unexpected end");
        }
        /* fall thru */
        goto normal_char;

    case '&':
    case '!':
    case '#':
    case '$':
    case '%':
    case '*':
    case '+':
    case ',':
    case '.':
    case ':':
    case ';':
    case '<':
    case '=':
    case '>':
    case '?':
    case '@':
    case '^':
    case '`':
    case '~':
        if (s->unicode_sets && p[1] == c) {
            /* forbidden double characters */
            return re_parse_error(s, "invalid class set operation in regular expression");
        }
        goto normal_char;

    case '(':
    case ')':
    case '[':
    case ']':
    case '{':
    case '}':
    case '/':
    case '-':
    case '|':
        if (s->unicode_sets) {
            /* invalid characters in unicode sets */
            return re_parse_error(s, "invalid character in class in regular expression");
        }
        goto normal_char;

    default:
    normal_char:
        /* normal char */
        if (c >= 128) {
            c = unicode_from_utf8(p, UTF8_CHAR_LEN_MAX, &p);
            if ((unsigned)c > 0xffff && !s->is_unicode) {
                /* XXX: should handle non BMP-1 code points */
                return re_parse_error(s, "malformed unicode char");
            }
        } else {
            p++;
        }
        break;
    }
    *pp = p;
    return c;
}

static int re_emit_range(REParseState *s, const CharRange *cr)
{
    int len, i;
    uint32_t high;

    len = (unsigned)cr->len / 2;
    if (len >= 65535)
        return re_parse_error(s, "too many ranges");
    if (len == 0) {
        re_emit_op_u32(s, REOP_char32, -1);
    } else {
        high = cr->points[cr->len - 1];
        if (high == UINT32_MAX)
            high = cr->points[cr->len - 2];
        if (high <= 0xffff) {
            /* can use 16 bit ranges with the conversion that 0xffff =
               infinity */
            re_emit_op_u16(s, s->ignore_case ? REOP_range_i : REOP_range, len);
            for(i = 0; i < cr->len; i += 2) {
                dbuf_put_u16(&s->byte_code, cr->points[i]);
                high = cr->points[i + 1] - 1;
                if (high == UINT32_MAX - 1)
                    high = 0xffff;
                dbuf_put_u16(&s->byte_code, high);
            }
        } else {
            re_emit_op_u16(s, s->ignore_case ? REOP_range32_i : REOP_range32, len);
            for(i = 0; i < cr->len; i += 2) {
                dbuf_put_u32(&s->byte_code, cr->points[i]);
                dbuf_put_u32(&s->byte_code, cr->points[i + 1] - 1);
            }
        }
    }
    return 0;
}

static int re_string_cmp_len(const void *a, const void *b, void *arg)
{
    REString *p1 = *(REString **)a;
    REString *p2 = *(REString **)b;
    return (p1->len < p2->len) - (p1->len > p2->len);
}

static void re_emit_char(REParseState *s, int c)
{
    if (c <= 0xffff)
        re_emit_op_u16(s, s->ignore_case ? REOP_char_i : REOP_char, c);
    else
        re_emit_op_u32(s, s->ignore_case ? REOP_char32_i : REOP_char32, c);
}

static int re_emit_string_list(REParseState *s, const REStringList *sl)
{
    REString **tab, *p;
    int i, j, split_pos, last_match_pos, n;
    BOOL has_empty_string, is_last;
    
    //    re_string_list_dump("sl", sl);
    if (sl->n_strings == 0) {
        /* simple case: only characters */
        if (re_emit_range(s, &sl->cr))
            return -1;
    } else {
        /* at least one string list is present : match the longest ones first */
        /* XXX: add a new op_switch opcode to compile as a trie */
        tab = lre_realloc(s->opaque, NULL, sizeof(tab[0]) * sl->n_strings);
        if (!tab) {
            re_parse_out_of_memory(s);
            return -1;
        }
        has_empty_string = FALSE;
        n = 0;
        for(i = 0; i < sl->hash_size; i++) {
            for(p = sl->hash_table[i]; p != NULL; p = p->next) {
                if (p->len == 0) {
                    has_empty_string = TRUE;
                } else {
                    tab[n++] = p;
                }
            }
        }
        assert(n <= sl->n_strings);
        
        rqsort(tab, n, sizeof(tab[0]), re_string_cmp_len, NULL);

        last_match_pos = -1;
        for(i = 0; i < n; i++) {
            p = tab[i];
            is_last = !has_empty_string && sl->cr.len == 0 && i == (n - 1);
            if (!is_last)
                split_pos = re_emit_op_u32(s, REOP_split_next_first, 0);
            else
                split_pos = 0;
            for(j = 0; j < p->len; j++) {
                re_emit_char(s, p->buf[j]);
            }
            if (!is_last) {
                last_match_pos = re_emit_op_u32(s, REOP_goto, last_match_pos);
                put_u32(s->byte_code.buf + split_pos, s->byte_code.size - (split_pos + 4));
            }
        }

        if (sl->cr.len != 0) {
            /* char range */
            is_last = !has_empty_string;
            if (!is_last)
                split_pos = re_emit_op_u32(s, REOP_split_next_first, 0);
            else
                split_pos = 0; /* not used */
            if (re_emit_range(s, &sl->cr)) {
                lre_realloc(s->opaque, tab, 0);
                return -1;
            }
            if (!is_last)
                put_u32(s->byte_code.buf + split_pos, s->byte_code.size - (split_pos + 4));
        }

        /* patch the 'goto match' */
        while (last_match_pos != -1) {
            int next_pos = get_u32(s->byte_code.buf + last_match_pos);
            put_u32(s->byte_code.buf + last_match_pos, s->byte_code.size - (last_match_pos + 4));
            last_match_pos = next_pos;
        }
        
        lre_realloc(s->opaque, tab, 0);
    }
    return 0;
}

static int re_parse_nested_class(REParseState *s, REStringList *cr, const uint8_t **pp);

static int re_parse_class_set_operand(REParseState *s, REStringList *cr, const uint8_t **pp)
{
    int c1;
    const uint8_t *p = *pp;
    
    if (*p == '[') {
        if (re_parse_nested_class(s, cr, pp))
            return -1;
    } else {
        c1 = get_class_atom(s, cr, pp, TRUE);
        if (c1 < 0)
            return -1;
        if (c1 < CLASS_RANGE_BASE) {
            /* create a range with a single character */
            re_string_list_init(s, cr);
            if (s->ignore_case)
                c1 = lre_canonicalize(c1, s->is_unicode);
            if (cr_union_interval(&cr->cr, c1, c1)) {
                re_string_list_free(cr);
                return -1;
            }
        }
    }
    return 0;
}

static int re_parse_nested_class(REParseState *s, REStringList *cr, const uint8_t **pp)
{
    const uint8_t *p;
    uint32_t c1, c2;
    int ret;
    REStringList cr1_s, *cr1 = &cr1_s;
    BOOL invert, is_first;

    if (lre_check_stack_overflow(s->opaque, 0))
        return re_parse_error(s, "stack overflow");

    re_string_list_init(s, cr);
    p = *pp;
    p++;    /* skip '[' */

    invert = FALSE;
    if (*p == '^') {
        p++;
        invert = TRUE;
    }
    
    /* handle unions */
    is_first = TRUE;
    for(;;) {
        if (*p == ']')
            break;
        if (*p == '[' && s->unicode_sets) {
            if (re_parse_nested_class(s, cr1, &p))
                goto fail;
            goto class_union;
        } else {
            c1 = get_class_atom(s, cr1, &p, TRUE);
            if ((int)c1 < 0)
                goto fail;
            if (*p == '-' && p[1] != ']') {
                const uint8_t *p0 = p + 1;
                if (p[1] == '-' && s->unicode_sets && is_first)
                    goto class_atom; /* first character class followed by '--' */
                if (c1 >= CLASS_RANGE_BASE) {
                    if (s->is_unicode) {
                        re_string_list_free(cr1);
                        goto invalid_class_range;
                    }
                    /* Annex B: match '-' character */
                    goto class_atom;
                }
                c2 = get_class_atom(s, cr1, &p0, TRUE);
                if ((int)c2 < 0)
                    goto fail;
                if (c2 >= CLASS_RANGE_BASE) {
                    re_string_list_free(cr1);
                    if (s->is_unicode) {
                        goto invalid_class_range;
                    }
                    /* Annex B: match '-' character */
                    goto class_atom;
                }
                p = p0;
                if (c2 < c1) {
                invalid_class_range:
                    re_parse_error(s, "invalid class range");
                    goto fail;
                }
                if (s->ignore_case) {
                    CharRange cr2_s, *cr2 = &cr2_s;
                    cr_init(cr2, s->opaque, lre_realloc);
                    if (cr_add_interval(cr2, c1, c2 + 1) ||
                        cr_regexp_canonicalize(cr2, s->is_unicode) ||
                        cr_op1(&cr->cr, cr2->points, cr2->len, CR_OP_UNION)) {
                        cr_free(cr2);
                        goto memory_error;
                    }
                    cr_free(cr2);
                } else {
                    if (cr_union_interval(&cr->cr, c1, c2))
                        goto memory_error;
                }
                is_first = FALSE; /* union operation */
            } else {
            class_atom:
                if (c1 >= CLASS_RANGE_BASE) {
                class_union:
                    ret = re_string_list_op(cr, cr1, CR_OP_UNION);
                    re_string_list_free(cr1);
                    if (ret)
                        goto memory_error;
                } else {
                    if (s->ignore_case)
                        c1 = lre_canonicalize(c1, s->is_unicode);
                    if (cr_union_interval(&cr->cr, c1, c1))
                        goto memory_error;
                }
            }
        }
        if (s->unicode_sets && is_first) {
            if (*p == '&' && p[1] == '&' && p[2] != '&') {
                /* handle '&&' */
                for(;;) {
                    if (*p == ']') {
                        break;
                    } else if (*p == '&' && p[1] == '&' && p[2] != '&') {
                        p += 2;
                    } else {
                        goto invalid_operation;
                    }
                    if (re_parse_class_set_operand(s, cr1, &p))
                        goto fail;
                    ret = re_string_list_op(cr, cr1, CR_OP_INTER);
                    re_string_list_free(cr1);
                    if (ret)
                        goto memory_error;
                }
            } else if (*p == '-' && p[1] == '-') {
                /* handle '--' */
                for(;;) {
                    if (*p == ']') {
                        break;
                    } else if (*p == '-' && p[1] == '-') {
                        p += 2;
                    } else {
                    invalid_operation:
                        re_parse_error(s, "invalid operation in regular expression");
                        goto fail;
                    }
                    if (re_parse_class_set_operand(s, cr1, &p))
                        goto fail;
                    ret = re_string_list_op(cr, cr1, CR_OP_SUB);
                    re_string_list_free(cr1);
                    if (ret)
                        goto memory_error;
                }
            }
        }
        is_first = FALSE;
    }

    p++;    /* skip ']' */
    *pp = p;
    if (invert) {
        /* XXX: add may_contain_string syntax check to be fully
           compliant. The test here accepts more input than the
           spec. */
        if (cr->n_strings != 0) {
            re_parse_error(s, "negated character class with strings in regular expression debugger eval code");
            goto fail;
        }
        if (cr_invert(&cr->cr))
            goto memory_error;
    }
    return 0;
 memory_error:
    re_parse_out_of_memory(s);
 fail:
    re_string_list_free(cr);
    return -1;
}

static int re_parse_char_class(REParseState *s, const uint8_t **pp)
{
    REStringList cr_s, *cr = &cr_s;

    if (re_parse_nested_class(s, cr, pp))
        return -1;
    if (re_emit_string_list(s, cr))
        goto fail;
    re_string_list_free(cr);
    return 0;
 fail:
    re_string_list_free(cr);
    return -1;
}

/* Return:
   - true if the opcodes may not advance the char pointer
   - false if the opcodes always advance the char pointer
*/
static BOOL re_need_check_advance(const uint8_t *bc_buf, int bc_buf_len)
{
    int pos, opcode, len;
    uint32_t val;
    BOOL ret;

    ret = TRUE;
    pos = 0;
    while (pos < bc_buf_len) {
        opcode = bc_buf[pos];
        len = reopcode_info[opcode].size;
        switch(opcode) {
        case REOP_range:
        case REOP_range_i:
            val = get_u16(bc_buf + pos + 1);
            len += val * 4;
            goto simple_char;
        case REOP_range32:
        case REOP_range32_i:
            val = get_u16(bc_buf + pos + 1);
            len += val * 8;
            goto simple_char;
        case REOP_char:
        case REOP_char_i:
        case REOP_char32:
        case REOP_char32_i:
        case REOP_dot:
        case REOP_any:
        simple_char:
            ret = FALSE;
            break;
        case REOP_line_start:
        case REOP_line_start_m:
        case REOP_line_end:
        case REOP_line_end_m:
        case REOP_push_i32:
        case REOP_push_char_pos:
        case REOP_drop:
        case REOP_word_boundary:
        case REOP_word_boundary_i:
        case REOP_not_word_boundary:
        case REOP_not_word_boundary_i:
        case REOP_prev:
            /* no effect */
            break;
        case REOP_save_start:
        case REOP_save_end:
        case REOP_save_reset:
        case REOP_back_reference:
        case REOP_back_reference_i:
        case REOP_backward_back_reference:
        case REOP_backward_back_reference_i:
            break;
        default:
            /* safe behavior: we cannot predict the outcome */
            return TRUE;
        }
        pos += len;
    }
    return ret;
}

/* return -1 if a simple quantifier cannot be used. Otherwise return
   the number of characters in the atom. */
static int re_is_simple_quantifier(const uint8_t *bc_buf, int bc_buf_len)
{
    int pos, opcode, len, count;
    uint32_t val;

    count = 0;
    pos = 0;
    while (pos < bc_buf_len) {
        opcode = bc_buf[pos];
        len = reopcode_info[opcode].size;
        switch(opcode) {
        case REOP_range:
        case REOP_range_i:
            val = get_u16(bc_buf + pos + 1);
            len += val * 4;
            goto simple_char;
        case REOP_range32:
        case REOP_range32_i:
            val = get_u16(bc_buf + pos + 1);
            len += val * 8;
            goto simple_char;
        case REOP_char:
        case REOP_char_i:
        case REOP_char32:
        case REOP_char32_i:
        case REOP_dot:
        case REOP_any:
        simple_char:
            count++;
            break;
        case REOP_line_start:
        case REOP_line_start_m:
        case REOP_line_end:
        case REOP_line_end_m:
        case REOP_word_boundary:
        case REOP_word_boundary_i:
        case REOP_not_word_boundary:
        case REOP_not_word_boundary_i:
            break;
        default:
            return -1;
        }
        pos += len;
    }
    return count;
}

/* '*pp' is the first char after '<' */
static int re_parse_group_name(char *buf, int buf_size, const uint8_t **pp)
{
    const uint8_t *p, *p1;
    uint32_t c, d;
    char *q;

    p = *pp;
    q = buf;
    for(;;) {
        c = *p;
        if (c == '\\') {
            p++;
            if (*p != 'u')
                return -1;
            c = lre_parse_escape(&p, 2); // accept surrogate pairs
        } else if (c == '>') {
            break;
        } else if (c >= 128) {
            c = unicode_from_utf8(p, UTF8_CHAR_LEN_MAX, &p);
            if (is_hi_surrogate(c)) {
                d = unicode_from_utf8(p, UTF8_CHAR_LEN_MAX, &p1);
                if (is_lo_surrogate(d)) {
                    c = from_surrogate(c, d);
                    p = p1;
                }
            }
        } else {
            p++;
        }
        if (c > 0x10FFFF)
            return -1;
        if (q == buf) {
            if (!lre_js_is_ident_first(c))
                return -1;
        } else {
            if (!lre_js_is_ident_next(c))
                return -1;
        }
        if ((q - buf + UTF8_CHAR_LEN_MAX + 1) > buf_size)
            return -1;
        if (c < 128) {
            *q++ = c;
        } else {
            q += unicode_to_utf8((uint8_t*)q, c);
        }
    }
    if (q == buf)
        return -1;
    *q = '\0';
    p++;
    *pp = p;
    return 0;
}

/* if capture_name = NULL: return the number of captures + 1.
   Otherwise, return the capture index corresponding to capture_name
   or -1 if none */
static int re_parse_captures(REParseState *s, int *phas_named_captures,
                             const char *capture_name)
{
    const uint8_t *p;
    int capture_index;
    char name[TMP_BUF_SIZE];

    capture_index = 1;
    *phas_named_captures = 0;
    for (p = s->buf_start; p < s->buf_end; p++) {
        switch (*p) {
        case '(':
            if (p[1] == '?') {
                if (p[2] == '<' && p[3] != '=' && p[3] != '!') {
                    *phas_named_captures = 1;
                    /* potential named capture */
                    if (capture_name) {
                        p += 3;
                        if (re_parse_group_name(name, sizeof(name), &p) == 0) {
                            if (!strcmp(name, capture_name))
                                return capture_index;
                        }
                    }
                    capture_index++;
                    if (capture_index >= CAPTURE_COUNT_MAX)
                        goto done;
                }
            } else {
                capture_index++;
                if (capture_index >= CAPTURE_COUNT_MAX)
                    goto done;
            }
            break;
        case '\\':
            p++;
            break;
        case '[':
            for (p += 1 + (*p == ']'); p < s->buf_end && *p != ']'; p++) {
                if (*p == '\\')
                    p++;
            }
            break;
        }
    }
 done:
    if (capture_name)
        return -1;
    else
        return capture_index;
}

static int re_count_captures(REParseState *s)
{
    if (s->total_capture_count < 0) {
        s->total_capture_count = re_parse_captures(s, &s->has_named_captures,
                                                   NULL);
    }
    return s->total_capture_count;
}

static BOOL re_has_named_captures(REParseState *s)
{
    if (s->has_named_captures < 0)
        re_count_captures(s);
    return s->has_named_captures;
}

static int find_group_name(REParseState *s, const char *name)
{
    const char *p, *buf_end;
    size_t len, name_len;
    int capture_index;

    p = (char *)s->group_names.buf;
    if (!p) return -1;
    buf_end = (char *)s->group_names.buf + s->group_names.size;
    name_len = strlen(name);
    capture_index = 1;
    while (p < buf_end) {
        len = strlen(p);
        if (len == name_len && memcmp(name, p, name_len) == 0)
            return capture_index;
        p += len + 1;
        capture_index++;
    }
    return -1;
}

static int re_parse_disjunction(REParseState *s, BOOL is_backward_dir);

static int re_parse_modifiers(REParseState *s, const uint8_t **pp)
{
    const uint8_t *p = *pp;
    int mask = 0;
    int val;

    for(;;) {
        if (*p == 'i') {
            val = LRE_FLAG_IGNORECASE;
        } else if (*p == 'm') {
            val = LRE_FLAG_MULTILINE;
        } else if (*p == 's') {
            val = LRE_FLAG_DOTALL;
        } else {
            break;
        }
        if (mask & val)
            return re_parse_error(s, "duplicate modifier: '%c'", *p);
        mask |= val;
        p++;
    }
    *pp = p;
    return mask;
}

static BOOL update_modifier(BOOL val, int add_mask, int remove_mask,
                            int mask)
{
    if (add_mask & mask)
        val = TRUE;
    if (remove_mask & mask)
        val = FALSE;
    return val;
}

static int re_parse_term(REParseState *s, BOOL is_backward_dir)
{
    const uint8_t *p;
    int c, last_atom_start, quant_min, quant_max, last_capture_count;
    BOOL greedy, add_zero_advance_check, is_neg, is_backward_lookahead;
    REStringList cr_s, *cr = &cr_s;

    last_atom_start = -1;
    last_capture_count = 0;
    p = s->buf_ptr;
    c = *p;
    switch(c) {
    case '^':
        p++;
        re_emit_op(s, s->multi_line ? REOP_line_start_m : REOP_line_start);
        break;
    case '$':
        p++;
        re_emit_op(s, s->multi_line ? REOP_line_end_m : REOP_line_end);
        break;
    case '.':
        p++;
        last_atom_start = s->byte_code.size;
        last_capture_count = s->capture_count;
        if (is_backward_dir)
            re_emit_op(s, REOP_prev);
        re_emit_op(s, s->dotall ? REOP_any : REOP_dot);
        if (is_backward_dir)
            re_emit_op(s, REOP_prev);
        break;
    case '{':
        if (s->is_unicode) {
            return re_parse_error(s, "syntax error");
        } else if (!is_digit(p[1])) {
            /* Annex B: we accept '{' not followed by digits as a
               normal atom */
            goto parse_class_atom;
        } else {
            const uint8_t *p1 = p + 1;
            /* Annex B: error if it is like a repetition count */
            parse_digits(&p1, TRUE);
            if (*p1 == ',') {
                p1++;
                if (is_digit(*p1)) {
                    parse_digits(&p1, TRUE);
                }
            }
            if (*p1 != '}') {
                goto parse_class_atom;
            }
        }
        /* fall thru */
    case '*':
    case '+':
    case '?':
        return re_parse_error(s, "nothing to repeat");
    case '(':
        if (p[1] == '?') {
            if (p[2] == ':') {
                p += 3;
                last_atom_start = s->byte_code.size;
                last_capture_count = s->capture_count;
                s->buf_ptr = p;
                if (re_parse_disjunction(s, is_backward_dir))
                    return -1;
                p = s->buf_ptr;
                if (re_parse_expect(s, &p, ')'))
                    return -1;
            } else if (p[2] == 'i' || p[2] == 'm' || p[2] == 's' || p[2] == '-') {
                BOOL saved_ignore_case, saved_multi_line, saved_dotall;
                int add_mask, remove_mask;
                p += 2;
                remove_mask = 0;
                add_mask = re_parse_modifiers(s, &p);
                if (add_mask < 0)
                    return -1;
                if (*p == '-') {
                    p++;
                    remove_mask = re_parse_modifiers(s, &p);
                    if (remove_mask < 0)
                        return -1;
                }
                if ((add_mask == 0 && remove_mask == 0) ||
                    (add_mask & remove_mask) != 0) {
                    return re_parse_error(s, "invalid modifiers");
                }
                if (re_parse_expect(s, &p, ':'))
                    return -1;
                saved_ignore_case = s->ignore_case;
                saved_multi_line = s->multi_line;
                saved_dotall = s->dotall;
                s->ignore_case = update_modifier(s->ignore_case, add_mask, remove_mask, LRE_FLAG_IGNORECASE);
                s->multi_line = update_modifier(s->multi_line, add_mask, remove_mask, LRE_FLAG_MULTILINE);
                s->dotall = update_modifier(s->dotall, add_mask, remove_mask, LRE_FLAG_DOTALL);

                last_atom_start = s->byte_code.size;
                last_capture_count = s->capture_count;
                s->buf_ptr = p;
                if (re_parse_disjunction(s, is_backward_dir))
                    return -1;
                p = s->buf_ptr;
                if (re_parse_expect(s, &p, ')'))
                    return -1;
                s->ignore_case = saved_ignore_case;
                s->multi_line = saved_multi_line;
                s->dotall = saved_dotall;
            } else if ((p[2] == '=' || p[2] == '!')) {
                is_neg = (p[2] == '!');
                is_backward_lookahead = FALSE;
                p += 3;
                goto lookahead;
            } else if (p[2] == '<' &&
                       (p[3] == '=' || p[3] == '!')) {
                int pos;
                is_neg = (p[3] == '!');
                is_backward_lookahead = TRUE;
                p += 4;
                /* lookahead */
            lookahead:
                /* Annex B allows lookahead to be used as an atom for
                   the quantifiers */
                if (!s->is_unicode && !is_backward_lookahead)  {
                    last_atom_start = s->byte_code.size;
                    last_capture_count = s->capture_count;
                }
                pos = re_emit_op_u32(s, REOP_lookahead + is_neg, 0);
                s->buf_ptr = p;
                if (re_parse_disjunction(s, is_backward_lookahead))
                    return -1;
                p = s->buf_ptr;
                if (re_parse_expect(s, &p, ')'))
                    return -1;
                re_emit_op(s, REOP_match);
                /* jump after the 'match' after the lookahead is successful */
                if (dbuf_error(&s->byte_code))
                    return -1;
                put_u32(s->byte_code.buf + pos, s->byte_code.size - (pos + 4));
            } else if (p[2] == '<') {
                p += 3;
                if (re_parse_group_name(s->u.tmp_buf, sizeof(s->u.tmp_buf),
                                        &p)) {
                    return re_parse_error(s, "invalid group name");
                }
                if (find_group_name(s, s->u.tmp_buf) > 0) {
                    return re_parse_error(s, "duplicate group name");
                }
                /* group name with a trailing zero */
                dbuf_put(&s->group_names, (uint8_t *)s->u.tmp_buf,
                         strlen(s->u.tmp_buf) + 1);
                s->has_named_captures = 1;
                goto parse_capture;
            } else {
                return re_parse_error(s, "invalid group");
            }
        } else {
            int capture_index;
            p++;
            /* capture without group name */
            dbuf_putc(&s->group_names, 0);
        parse_capture:
            if (s->capture_count >= CAPTURE_COUNT_MAX)
                return re_parse_error(s, "too many captures");
            last_atom_start = s->byte_code.size;
            last_capture_count = s->capture_count;
            capture_index = s->capture_count++;
            re_emit_op_u8(s, REOP_save_start + is_backward_dir,
                          capture_index);

            s->buf_ptr = p;
            if (re_parse_disjunction(s, is_backward_dir))
                return -1;
            p = s->buf_ptr;

            re_emit_op_u8(s, REOP_save_start + 1 - is_backward_dir,
                          capture_index);

            if (re_parse_expect(s, &p, ')'))
                return -1;
        }
        break;
    case '\\':
        switch(p[1]) {
        case 'b':
        case 'B':
            if (p[1] != 'b') {
                re_emit_op(s, s->ignore_case ? REOP_not_word_boundary_i : REOP_not_word_boundary);
            } else {
                re_emit_op(s, s->ignore_case ? REOP_word_boundary_i : REOP_word_boundary);
            }
            p += 2;
            break;
        case 'k':
            {
                const uint8_t *p1;
                int dummy_res;

                p1 = p;
                if (p1[2] != '<') {
                    /* annex B: we tolerate invalid group names in non
                       unicode mode if there is no named capture
                       definition */
                    if (s->is_unicode || re_has_named_captures(s))
                        return re_parse_error(s, "expecting group name");
                    else
                        goto parse_class_atom;
                }
                p1 += 3;
                if (re_parse_group_name(s->u.tmp_buf, sizeof(s->u.tmp_buf),
                                        &p1)) {
                    if (s->is_unicode || re_has_named_captures(s))
                        return re_parse_error(s, "invalid group name");
                    else
                        goto parse_class_atom;
                }
                c = find_group_name(s, s->u.tmp_buf);
                if (c < 0) {
                    /* no capture name parsed before, try to look
                       after (inefficient, but hopefully not common */
                    c = re_parse_captures(s, &dummy_res, s->u.tmp_buf);
                    if (c < 0) {
                        if (s->is_unicode || re_has_named_captures(s))
                            return re_parse_error(s, "group name not defined");
                        else
                            goto parse_class_atom;
                    }
                }
                p = p1;
            }
            goto emit_back_reference;
        case '0':
            p += 2;
            c = 0;
            if (s->is_unicode) {
                if (is_digit(*p)) {
                    return re_parse_error(s, "invalid decimal escape in regular expression");
                }
            } else {
                /* Annex B.1.4: accept legacy octal */
                if (*p >= '0' && *p <= '7') {
                    c = *p++ - '0';
                    if (*p >= '0' && *p <= '7') {
                        c = (c << 3) + *p++ - '0';
                    }
                }
            }
            goto normal_char;
        case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8':
        case '9':
            {
                const uint8_t *q = ++p;

                c = parse_digits(&p, FALSE);
                if (c < 0 || (c >= s->capture_count && c >= re_count_captures(s))) {
                    if (!s->is_unicode) {
                        /* Annex B.1.4: accept legacy octal */
                        p = q;
                        if (*p <= '7') {
                            c = 0;
                            if (*p <= '3')
                                c = *p++ - '0';
                            if (*p >= '0' && *p <= '7') {
                                c = (c << 3) + *p++ - '0';
                                if (*p >= '0' && *p <= '7') {
                                    c = (c << 3) + *p++ - '0';
                                }
                            }
                        } else {
                            c = *p++;
                        }
                        goto normal_char;
                    }
                    return re_parse_error(s, "back reference out of range in regular expression");
                }
            emit_back_reference:
                last_atom_start = s->byte_code.size;
                last_capture_count = s->capture_count;
                
                re_emit_op_u8(s, REOP_back_reference + 2 * is_backward_dir + s->ignore_case, c);
            }
            break;
        default:
            goto parse_class_atom;
        }
        break;
    case '[':
        last_atom_start = s->byte_code.size;
        last_capture_count = s->capture_count;
        if (is_backward_dir)
            re_emit_op(s, REOP_prev);
        if (re_parse_char_class(s, &p))
            return -1;
        if (is_backward_dir)
            re_emit_op(s, REOP_prev);
        break;
    case ']':
    case '}':
        if (s->is_unicode)
            return re_parse_error(s, "syntax error");
        goto parse_class_atom;
    default:
    parse_class_atom:
        c = get_class_atom(s, cr, &p, FALSE);
        if ((int)c < 0)
            return -1;
    normal_char:
        last_atom_start = s->byte_code.size;
        last_capture_count = s->capture_count;
        if (is_backward_dir)
            re_emit_op(s, REOP_prev);
        if (c >= CLASS_RANGE_BASE) {
            int ret;
            ret = re_emit_string_list(s, cr);
            re_string_list_free(cr);
            if (ret)
                return -1;
        } else {
            if (s->ignore_case)
                c = lre_canonicalize(c, s->is_unicode);
            re_emit_char(s, c);
        }
        if (is_backward_dir)
            re_emit_op(s, REOP_prev);
        break;
    }

    /* quantifier */
    if (last_atom_start >= 0) {
        c = *p;
        switch(c) {
        case '*':
            p++;
            quant_min = 0;
            quant_max = INT32_MAX;
            goto quantifier;
        case '+':
            p++;
            quant_min = 1;
            quant_max = INT32_MAX;
            goto quantifier;
        case '?':
            p++;
            quant_min = 0;
            quant_max = 1;
            goto quantifier;
        case '{':
            {
                const uint8_t *p1 = p;
                /* As an extension (see ES6 annex B), we accept '{' not
                   followed by digits as a normal atom */
                if (!is_digit(p[1])) {
                    if (s->is_unicode)
                        goto invalid_quant_count;
                    break;
                }
                p++;
                quant_min = parse_digits(&p, TRUE);
                quant_max = quant_min;
                if (*p == ',') {
                    p++;
                    if (is_digit(*p)) {
                        quant_max = parse_digits(&p, TRUE);
                        if (quant_max < quant_min) {
                        invalid_quant_count:
                            return re_parse_error(s, "invalid repetition count");
                        }
                    } else {
                        quant_max = INT32_MAX; /* infinity */
                    }
                }
                if (*p != '}' && !s->is_unicode) {
                    /* Annex B: normal atom if invalid '{' syntax */
                    p = p1;
                    break;
                }
                if (re_parse_expect(s, &p, '}'))
                    return -1;
            }
        quantifier:
            greedy = TRUE;
            if (*p == '?') {
                p++;
                greedy = FALSE;
            }
            if (last_atom_start < 0) {
                return re_parse_error(s, "nothing to repeat");
            }
            if (greedy) {
                int len, pos;

                if (quant_max > 0) {
                    /* specific optimization for simple quantifiers */
                    if (dbuf_error(&s->byte_code))
                        goto out_of_memory;
                    len = re_is_simple_quantifier(s->byte_code.buf + last_atom_start,
                                                 s->byte_code.size - last_atom_start);
                    if (len > 0) {
                        re_emit_op(s, REOP_match);

                        if (dbuf_insert(&s->byte_code, last_atom_start, 17))
                            goto out_of_memory;
                        pos = last_atom_start;
                        s->byte_code.buf[pos++] = REOP_simple_greedy_quant;
                        put_u32(&s->byte_code.buf[pos],
                                s->byte_code.size - last_atom_start - 17);
                        pos += 4;
                        put_u32(&s->byte_code.buf[pos], quant_min);
                        pos += 4;
                        put_u32(&s->byte_code.buf[pos], quant_max);
                        pos += 4;
                        put_u32(&s->byte_code.buf[pos], len);
                        pos += 4;
                        goto done;
                    }
                }

                if (dbuf_error(&s->byte_code))
                    goto out_of_memory;
            }
            /* the spec tells that if there is no advance when
               running the atom after the first quant_min times,
               then there is no match. We remove this test when we
               are sure the atom always advances the position. */
            add_zero_advance_check = re_need_check_advance(s->byte_code.buf + last_atom_start,
                                                           s->byte_code.size - last_atom_start);

            {
                int len, pos;
                len = s->byte_code.size - last_atom_start;
                if (quant_min == 0) {
                    /* need to reset the capture in case the atom is
                       not executed */
                    if (last_capture_count != s->capture_count) {
                        if (dbuf_insert(&s->byte_code, last_atom_start, 3))
                            goto out_of_memory;
                        s->byte_code.buf[last_atom_start++] = REOP_save_reset;
                        s->byte_code.buf[last_atom_start++] = last_capture_count;
                        s->byte_code.buf[last_atom_start++] = s->capture_count - 1;
                    }
                    if (quant_max == 0) {
                        s->byte_code.size = last_atom_start;
                    } else if (quant_max == 1 || quant_max == INT32_MAX) {
                        BOOL has_goto = (quant_max == INT32_MAX);
                        if (dbuf_insert(&s->byte_code, last_atom_start, 5 + add_zero_advance_check))
                            goto out_of_memory;
                        s->byte_code.buf[last_atom_start] = REOP_split_goto_first +
                            greedy;
                        put_u32(s->byte_code.buf + last_atom_start + 1,
                                len + 5 * has_goto + add_zero_advance_check * 2);
                        if (add_zero_advance_check) {
                            s->byte_code.buf[last_atom_start + 1 + 4] = REOP_push_char_pos;
                            re_emit_op(s, REOP_check_advance);
                        }
                        if (has_goto)
                            re_emit_goto(s, REOP_goto, last_atom_start);
                    } else {
                        if (dbuf_insert(&s->byte_code, last_atom_start, 10 + add_zero_advance_check))
                            goto out_of_memory;
                        pos = last_atom_start;
                        s->byte_code.buf[pos++] = REOP_push_i32;
                        put_u32(s->byte_code.buf + pos, quant_max);
                        pos += 4;
                        s->byte_code.buf[pos++] = REOP_split_goto_first + greedy;
                        put_u32(s->byte_code.buf + pos, len + 5 + add_zero_advance_check * 2);
                        pos += 4;
                        if (add_zero_advance_check) {
                            s->byte_code.buf[pos++] = REOP_push_char_pos;
                            re_emit_op(s, REOP_check_advance);
                        }
                        re_emit_goto(s, REOP_loop, last_atom_start + 5);
                        re_emit_op(s, REOP_drop);
                    }
                } else if (quant_min == 1 && quant_max == INT32_MAX &&
                           !add_zero_advance_check) {
                    re_emit_goto(s, REOP_split_next_first - greedy,
                                 last_atom_start);
                } else {
                    if (quant_min == 1) {
                        /* nothing to add */
                    } else {
                        if (dbuf_insert(&s->byte_code, last_atom_start, 5))
                            goto out_of_memory;
                        s->byte_code.buf[last_atom_start] = REOP_push_i32;
                        put_u32(s->byte_code.buf + last_atom_start + 1,
                                quant_min);
                        last_atom_start += 5;
                        re_emit_goto(s, REOP_loop, last_atom_start);
                        re_emit_op(s, REOP_drop);
                    }
                    if (quant_max == INT32_MAX) {
                        pos = s->byte_code.size;
                        re_emit_op_u32(s, REOP_split_goto_first + greedy,
                                       len + 5 + add_zero_advance_check * 2);
                        if (add_zero_advance_check)
                            re_emit_op(s, REOP_push_char_pos);
                        /* copy the atom */
                        dbuf_put_self(&s->byte_code, last_atom_start, len);
                        if (add_zero_advance_check)
                            re_emit_op(s, REOP_check_advance);
                        re_emit_goto(s, REOP_goto, pos);
                    } else if (quant_max > quant_min) {
                        re_emit_op_u32(s, REOP_push_i32, quant_max - quant_min);
                        pos = s->byte_code.size;
                        re_emit_op_u32(s, REOP_split_goto_first + greedy,
                                       len + 5 + add_zero_advance_check * 2);
                        if (add_zero_advance_check)
                            re_emit_op(s, REOP_push_char_pos);
                        /* copy the atom */
                        dbuf_put_self(&s->byte_code, last_atom_start, len);
                        if (add_zero_advance_check)
                            re_emit_op(s, REOP_check_advance);
                        re_emit_goto(s, REOP_loop, pos);
                        re_emit_op(s, REOP_drop);
                    }
                }
                last_atom_start = -1;
            }
            break;
        default:
            break;
        }
    }
 done:
    s->buf_ptr = p;
    return 0;
 out_of_memory:
    return re_parse_out_of_memory(s);
}

static int re_parse_alternative(REParseState *s, BOOL is_backward_dir)
{
    const uint8_t *p;
    int ret;
    size_t start, term_start, end, term_size;

    start = s->byte_code.size;
    for(;;) {
        p = s->buf_ptr;
        if (p >= s->buf_end)
            break;
        if (*p == '|' || *p == ')')
            break;
        term_start = s->byte_code.size;
        ret = re_parse_term(s, is_backward_dir);
        if (ret)
            return ret;
        if (is_backward_dir) {
            /* reverse the order of the terms (XXX: inefficient, but
               speed is not really critical here) */
            end = s->byte_code.size;
            term_size = end - term_start;
            if (dbuf_realloc(&s->byte_code, end + term_size))
                return -1;
            memmove(s->byte_code.buf + start + term_size,
                    s->byte_code.buf + start,
                    end - start);
            memcpy(s->byte_code.buf + start, s->byte_code.buf + end,
                   term_size);
        }
    }
    return 0;
}

static int re_parse_disjunction(REParseState *s, BOOL is_backward_dir)
{
    int start, len, pos;

    if (lre_check_stack_overflow(s->opaque, 0))
        return re_parse_error(s, "stack overflow");

    start = s->byte_code.size;
    if (re_parse_alternative(s, is_backward_dir))
        return -1;
    while (*s->buf_ptr == '|') {
        s->buf_ptr++;

        len = s->byte_code.size - start;

        /* insert a split before the first alternative */
        if (dbuf_insert(&s->byte_code, start, 5)) {
            return re_parse_out_of_memory(s);
        }
        s->byte_code.buf[start] = REOP_split_next_first;
        put_u32(s->byte_code.buf + start + 1, len + 5);

        pos = re_emit_op_u32(s, REOP_goto, 0);

        if (re_parse_alternative(s, is_backward_dir))
            return -1;

        /* patch the goto */
        len = s->byte_code.size - (pos + 4);
        put_u32(s->byte_code.buf + pos, len);
    }
    return 0;
}

/* the control flow is recursive so the analysis can be linear */
static int compute_stack_size(const uint8_t *bc_buf, int bc_buf_len)
{
    int stack_size, stack_size_max, pos, opcode, len;
    uint32_t val;

    stack_size = 0;
    stack_size_max = 0;
    bc_buf += RE_HEADER_LEN;
    bc_buf_len -= RE_HEADER_LEN;
    pos = 0;
    while (pos < bc_buf_len) {
        opcode = bc_buf[pos];
        len = reopcode_info[opcode].size;
        assert(opcode < REOP_COUNT);
        assert((pos + len) <= bc_buf_len);
        switch(opcode) {
        case REOP_push_i32:
        case REOP_push_char_pos:
            stack_size++;
            if (stack_size > stack_size_max) {
                if (stack_size > STACK_SIZE_MAX)
                    return -1;
                stack_size_max = stack_size;
            }
            break;
        case REOP_drop:
        case REOP_check_advance:
            assert(stack_size > 0);
            stack_size--;
            break;
        case REOP_range:
        case REOP_range_i:
            val = get_u16(bc_buf + pos + 1);
            len += val * 4;
            break;
        case REOP_range32:
        case REOP_range32_i:
            val = get_u16(bc_buf + pos + 1);
            len += val * 8;
            break;
        }
        pos += len;
    }
    return stack_size_max;
}

static void *lre_bytecode_realloc(void *opaque, void *ptr, size_t size)
{
    if (size > (INT32_MAX / 2)) {
        /* the bytecode cannot be larger than 2G. Leave some slack to 
           avoid some overflows. */
        return NULL;
    } else {
        return lre_realloc(opaque, ptr, size);
    }
}

/* 'buf' must be a zero terminated UTF-8 string of length buf_len.
   Return NULL if error and allocate an error message in *perror_msg,
   otherwise the compiled bytecode and its length in plen.
*/
uint8_t *lre_compile(int *plen, char *error_msg, int error_msg_size,
                     const char *buf, size_t buf_len, int re_flags,
                     void *opaque)
{
    REParseState s_s, *s = &s_s;
    int stack_size;
    BOOL is_sticky;

    memset(s, 0, sizeof(*s));
    s->opaque = opaque;
    s->buf_ptr = (const uint8_t *)buf;
    s->buf_end = s->buf_ptr + buf_len;
    s->buf_start = s->buf_ptr;
    s->re_flags = re_flags;
    s->is_unicode = ((re_flags & (LRE_FLAG_UNICODE | LRE_FLAG_UNICODE_SETS)) != 0);
    is_sticky = ((re_flags & LRE_FLAG_STICKY) != 0);
    s->ignore_case = ((re_flags & LRE_FLAG_IGNORECASE) != 0);
    s->multi_line = ((re_flags & LRE_FLAG_MULTILINE) != 0);
    s->dotall = ((re_flags & LRE_FLAG_DOTALL) != 0);
    s->unicode_sets = ((re_flags & LRE_FLAG_UNICODE_SETS) != 0);
    s->capture_count = 1;
    s->total_capture_count = -1;
    s->has_named_captures = -1;

    dbuf_init2(&s->byte_code, opaque, lre_bytecode_realloc);
    dbuf_init2(&s->group_names, opaque, lre_realloc);

    dbuf_put_u16(&s->byte_code, re_flags); /* first element is the flags */
    dbuf_putc(&s->byte_code, 0); /* second element is the number of captures */
    dbuf_putc(&s->byte_code, 0); /* stack size */
    dbuf_put_u32(&s->byte_code, 0); /* bytecode length */

    if (!is_sticky) {
        /* iterate thru all positions (about the same as .*?( ... ) )
           .  We do it without an explicit loop so that lock step
           thread execution will be possible in an optimized
           implementation */
        re_emit_op_u32(s, REOP_split_goto_first, 1 + 5);
        re_emit_op(s, REOP_any);
        re_emit_op_u32(s, REOP_goto, -(5 + 1 + 5));
    }
    re_emit_op_u8(s, REOP_save_start, 0);

    if (re_parse_disjunction(s, FALSE)) {
    error:
        dbuf_free(&s->byte_code);
        dbuf_free(&s->group_names);
        pstrcpy(error_msg, error_msg_size, s->u.error_msg);
        *plen = 0;
        return NULL;
    }

    re_emit_op_u8(s, REOP_save_end, 0);

    re_emit_op(s, REOP_match);

    if (*s->buf_ptr != '\0') {
        re_parse_error(s, "extraneous characters at the end");
        goto error;
    }

    if (dbuf_error(&s->byte_code)) {
        re_parse_out_of_memory(s);
        goto error;
    }

    stack_size = compute_stack_size(s->byte_code.buf, s->byte_code.size);
    if (stack_size < 0) {
        re_parse_error(s, "too many imbricated quantifiers");
        goto error;
    }

    s->byte_code.buf[RE_HEADER_CAPTURE_COUNT] = s->capture_count;
    s->byte_code.buf[RE_HEADER_STACK_SIZE] = stack_size;
    put_u32(s->byte_code.buf + RE_HEADER_BYTECODE_LEN,
            s->byte_code.size - RE_HEADER_LEN);

    /* add the named groups if needed */
    if (s->group_names.size > (s->capture_count - 1)) {
        dbuf_put(&s->byte_code, s->group_names.buf, s->group_names.size);
        put_u16(s->byte_code.buf + RE_HEADER_FLAGS,
                lre_get_flags(s->byte_code.buf) | LRE_FLAG_NAMED_GROUPS);
    }
    dbuf_free(&s->group_names);

#ifdef DUMP_REOP
    lre_dump_bytecode(s->byte_code.buf, s->byte_code.size);
#endif

    error_msg[0] = '\0';
    *plen = s->byte_code.size;
    return s->byte_code.buf;
}

static BOOL is_line_terminator(uint32_t c)
{
    return (c == '\n' || c == '\r' || c == CP_LS || c == CP_PS);
}

static BOOL is_word_char(uint32_t c)
{
    return ((c >= '0' && c <= '9') ||
            (c >= 'a' && c <= 'z') ||
            (c >= 'A' && c <= 'Z') ||
            (c == '_'));
}

#define GET_CHAR(c, cptr, cbuf_end, cbuf_type)                          \
    do {                                                                \
        if (cbuf_type == 0) {                                           \
            c = *cptr++;                                                \
        } else {                                                        \
            const uint16_t *_p = (const uint16_t *)cptr;                \
            const uint16_t *_end = (const uint16_t *)cbuf_end;          \
            c = *_p++;                                                  \
            if (is_hi_surrogate(c) && cbuf_type == 2) {                 \
                if (_p < _end && is_lo_surrogate(*_p)) {                \
                    c = from_surrogate(c, *_p++);                       \
                }                                                       \
            }                                                           \
            cptr = (const void *)_p;                                    \
        }                                                               \
    } while (0)

#define PEEK_CHAR(c, cptr, cbuf_end, cbuf_type)                         \
    do {                                                                \
        if (cbuf_type == 0) {                                           \
            c = cptr[0];                                                \
        } else {                                                        \
            const uint16_t *_p = (const uint16_t *)cptr;                \
            const uint16_t *_end = (const uint16_t *)cbuf_end;          \
            c = *_p++;                                                  \
            if (is_hi_surrogate(c) && cbuf_type == 2) {                 \
                if (_p < _end && is_lo_surrogate(*_p)) {                \
                    c = from_surrogate(c, *_p);                         \
                }                                                       \
            }                                                           \
        }                                                               \
    } while (0)

#define PEEK_PREV_CHAR(c, cptr, cbuf_start, cbuf_type)                  \
    do {                                                                \
        if (cbuf_type == 0) {                                           \
            c = cptr[-1];                                               \
        } else {                                                        \
            const uint16_t *_p = (const uint16_t *)cptr - 1;            \
            const uint16_t *_start = (const uint16_t *)cbuf_start;      \
            c = *_p;                                                    \
            if (is_lo_surrogate(c) && cbuf_type == 2) {                 \
                if (_p > _start && is_hi_surrogate(_p[-1])) {           \
                    c = from_surrogate(*--_p, c);                       \
                }                                                       \
            }                                                           \
        }                                                               \
    } while (0)

#define GET_PREV_CHAR(c, cptr, cbuf_start, cbuf_type)                   \
    do {                                                                \
        if (cbuf_type == 0) {                                           \
            cptr--;                                                     \
            c = cptr[0];                                                \
        } else {                                                        \
            const uint16_t *_p = (const uint16_t *)cptr - 1;            \
            const uint16_t *_start = (const uint16_t *)cbuf_start;      \
            c = *_p;                                                    \
            if (is_lo_surrogate(c) && cbuf_type == 2) {                 \
                if (_p > _start && is_hi_surrogate(_p[-1])) {           \
                    c = from_surrogate(*--_p, c);                       \
                }                                                       \
            }                                                           \
            cptr = (const void *)_p;                                    \
        }                                                               \
    } while (0)

#define PREV_CHAR(cptr, cbuf_start, cbuf_type)                          \
    do {                                                                \
        if (cbuf_type == 0) {                                           \
            cptr--;                                                     \
        } else {                                                        \
            const uint16_t *_p = (const uint16_t *)cptr - 1;            \
            const uint16_t *_start = (const uint16_t *)cbuf_start;      \
            if (is_lo_surrogate(*_p) && cbuf_type == 2) {               \
                if (_p > _start && is_hi_surrogate(_p[-1])) {           \
                    --_p;                                               \
                }                                                       \
            }                                                           \
            cptr = (const void *)_p;                                    \
        }                                                               \
    } while (0)

typedef uintptr_t StackInt;

typedef enum {
    RE_EXEC_STATE_SPLIT,
    RE_EXEC_STATE_LOOKAHEAD,
    RE_EXEC_STATE_NEGATIVE_LOOKAHEAD,
    RE_EXEC_STATE_GREEDY_QUANT,
} REExecStateEnum;

typedef struct REExecState {
    REExecStateEnum type : 8;
    uint8_t stack_len;
    size_t count; /* only used for RE_EXEC_STATE_GREEDY_QUANT */
    const uint8_t *cptr;
    const uint8_t *pc;
    void *buf[0];
} REExecState;

typedef struct {
    const uint8_t *cbuf;
    const uint8_t *cbuf_end;
    /* 0 = 8 bit chars, 1 = 16 bit chars, 2 = 16 bit chars, UTF-16 */
    int cbuf_type;
    int capture_count;
    int stack_size_max;
    BOOL is_unicode;
    int interrupt_counter;
    void *opaque; /* used for stack overflow check */

    size_t state_size;
    uint8_t *state_stack;
    size_t state_stack_size;
    size_t state_stack_len;
} REExecContext;

static int push_state(REExecContext *s,
                      uint8_t **capture,
                      StackInt *stack, size_t stack_len,
                      const uint8_t *pc, const uint8_t *cptr,
                      REExecStateEnum type, size_t count)
{
    REExecState *rs;
    uint8_t *new_stack;
    size_t new_size, i, n;
    StackInt *stack_buf;

    if (unlikely((s->state_stack_len + 1) > s->state_stack_size)) {
        /* reallocate the stack */
        new_size = s->state_stack_size * 3 / 2;
        if (new_size < 8)
            new_size = 8;
        new_stack = lre_realloc(s->opaque, s->state_stack, new_size * s->state_size);
        if (!new_stack)
            return -1;
        s->state_stack_size = new_size;
        s->state_stack = new_stack;
    }
    rs = (REExecState *)(s->state_stack + s->state_stack_len * s->state_size);
    s->state_stack_len++;
    rs->type = type;
    rs->count = count;
    rs->stack_len = stack_len;
    rs->cptr = cptr;
    rs->pc = pc;
    n = 2 * s->capture_count;
    for(i = 0; i < n; i++)
        rs->buf[i] = capture[i];
    stack_buf = (StackInt *)(rs->buf + n);
    for(i = 0; i < stack_len; i++)
        stack_buf[i] = stack[i];
    return 0;
}

static int lre_poll_timeout(REExecContext *s)
{
    if (unlikely(--s->interrupt_counter <= 0)) {
        s->interrupt_counter = INTERRUPT_COUNTER_INIT;
        if (lre_check_timeout(s->opaque))
            return LRE_RET_TIMEOUT;
    }
    return 0;
}

/* return 1 if match, 0 if not match or < 0 if error. */
static intptr_t lre_exec_backtrack(REExecContext *s, uint8_t **capture,
                                   StackInt *stack, int stack_len,
                                   const uint8_t *pc, const uint8_t *cptr,
                                   BOOL no_recurse)
{
    int opcode, ret;
    int cbuf_type;
    uint32_t val, c;
    const uint8_t *cbuf_end;

    cbuf_type = s->cbuf_type;
    cbuf_end = s->cbuf_end;

    for(;;) {
        //        printf("top=%p: pc=%d\n", th_list.top, (int)(pc - (bc_buf + RE_HEADER_LEN)));
        opcode = *pc++;
        switch(opcode) {
        case REOP_match:
            {
                REExecState *rs;
                if (no_recurse)
                    return (intptr_t)cptr;
                ret = 1;
                goto recurse;
            no_match:
                if (no_recurse)
                    return 0;
                ret = 0;
            recurse:
                for(;;) {
                    if (lre_poll_timeout(s))
                        return LRE_RET_TIMEOUT;
                    if (s->state_stack_len == 0)
                        return ret;
                    rs = (REExecState *)(s->state_stack +
                                         (s->state_stack_len - 1) * s->state_size);
                    if (rs->type == RE_EXEC_STATE_SPLIT) {
                        if (!ret) {
                        pop_state:
                            memcpy(capture, rs->buf,
                                   sizeof(capture[0]) * 2 * s->capture_count);
                        pop_state1:
                            pc = rs->pc;
                            cptr = rs->cptr;
                            stack_len = rs->stack_len;
                            memcpy(stack, rs->buf + 2 * s->capture_count,
                                   stack_len * sizeof(stack[0]));
                            s->state_stack_len--;
                            break;
                        }
                    } else if (rs->type == RE_EXEC_STATE_GREEDY_QUANT) {
                        if (!ret) {
                            uint32_t char_count, i;
                            memcpy(capture, rs->buf,
                                   sizeof(capture[0]) * 2 * s->capture_count);
                            stack_len = rs->stack_len;
                            memcpy(stack, rs->buf + 2 * s->capture_count,
                                   stack_len * sizeof(stack[0]));
                            pc = rs->pc;
                            cptr = rs->cptr;
                            /* go backward */
                            char_count = get_u32(pc + 12);
                            for(i = 0; i < char_count; i++) {
                                PREV_CHAR(cptr, s->cbuf, cbuf_type);
                            }
                            pc = (pc + 16) + (int)get_u32(pc);
                            rs->cptr = cptr;
                            rs->count--;
                            if (rs->count == 0) {
                                s->state_stack_len--;
                            }
                            break;
                        }
                    } else {
                        ret = ((rs->type == RE_EXEC_STATE_LOOKAHEAD && ret) ||
                               (rs->type == RE_EXEC_STATE_NEGATIVE_LOOKAHEAD && !ret));
                        if (ret) {
                            /* keep the capture in case of positive lookahead */
                            if (rs->type == RE_EXEC_STATE_LOOKAHEAD)
                                goto pop_state1;
                            else
                                goto pop_state;
                        }
                    }
                    s->state_stack_len--;
                }
            }
            break;
        case REOP_char32:
        case REOP_char32_i:
            val = get_u32(pc);
            pc += 4;
            goto test_char;
        case REOP_char:
        case REOP_char_i:
            val = get_u16(pc);
            pc += 2;
        test_char:
            if (cptr >= cbuf_end)
                goto no_match;
            GET_CHAR(c, cptr, cbuf_end, cbuf_type);
            if (opcode == REOP_char_i || opcode == REOP_char32_i) {
                c = lre_canonicalize(c, s->is_unicode);
            }
            if (val != c)
                goto no_match;
            break;
        case REOP_split_goto_first:
        case REOP_split_next_first:
            {
                const uint8_t *pc1;

                val = get_u32(pc);
                pc += 4;
                if (opcode == REOP_split_next_first) {
                    pc1 = pc + (int)val;
                } else {
                    pc1 = pc;
                    pc = pc + (int)val;
                }
                ret = push_state(s, capture, stack, stack_len,
                                 pc1, cptr, RE_EXEC_STATE_SPLIT, 0);
                if (ret < 0)
                    return LRE_RET_MEMORY_ERROR;
                break;
            }
        case REOP_lookahead:
        case REOP_negative_lookahead:
            val = get_u32(pc);
            pc += 4;
            ret = push_state(s, capture, stack, stack_len,
                             pc + (int)val, cptr,
                             RE_EXEC_STATE_LOOKAHEAD + opcode - REOP_lookahead,
                             0);
            if (ret < 0)
                return LRE_RET_MEMORY_ERROR;
            break;

        case REOP_goto:
            val = get_u32(pc);
            pc += 4 + (int)val;
            if (lre_poll_timeout(s))
                return LRE_RET_TIMEOUT;
            break;
        case REOP_line_start:
        case REOP_line_start_m:
            if (cptr == s->cbuf)
                break;
            if (opcode == REOP_line_start)
                goto no_match;
            PEEK_PREV_CHAR(c, cptr, s->cbuf, cbuf_type);
            if (!is_line_terminator(c))
                goto no_match;
            break;
        case REOP_line_end:
        case REOP_line_end_m:
            if (cptr == cbuf_end)
                break;
            if (opcode == REOP_line_end)
                goto no_match;
            PEEK_CHAR(c, cptr, cbuf_end, cbuf_type);
            if (!is_line_terminator(c))
                goto no_match;
            break;
        case REOP_dot:
            if (cptr == cbuf_end)
                goto no_match;
            GET_CHAR(c, cptr, cbuf_end, cbuf_type);
            if (is_line_terminator(c))
                goto no_match;
            break;
        case REOP_any:
            if (cptr == cbuf_end)
                goto no_match;
            GET_CHAR(c, cptr, cbuf_end, cbuf_type);
            break;
        case REOP_save_start:
        case REOP_save_end:
            val = *pc++;
            assert(val < s->capture_count);
            capture[2 * val + opcode - REOP_save_start] = (uint8_t *)cptr;
            break;
        case REOP_save_reset:
            {
                uint32_t val2;
                val = pc[0];
                val2 = pc[1];
                pc += 2;
                assert(val2 < s->capture_count);
                while (val <= val2) {
                    capture[2 * val] = NULL;
                    capture[2 * val + 1] = NULL;
                    val++;
                }
            }
            break;
        case REOP_push_i32:
            val = get_u32(pc);
            pc += 4;
            stack[stack_len++] = val;
            break;
        case REOP_drop:
            stack_len--;
            break;
        case REOP_loop:
            val = get_u32(pc);
            pc += 4;
            if (--stack[stack_len - 1] != 0) {
                pc += (int)val;
                if (lre_poll_timeout(s))
                    return LRE_RET_TIMEOUT;
            }
            break;
        case REOP_push_char_pos:
            stack[stack_len++] = (uintptr_t)cptr;
            break;
        case REOP_check_advance:
            if (stack[--stack_len] == (uintptr_t)cptr)
                goto no_match;
            break;
        case REOP_word_boundary:
        case REOP_word_boundary_i:
        case REOP_not_word_boundary:
        case REOP_not_word_boundary_i:
            {
                BOOL v1, v2;
                int ignore_case = (opcode == REOP_word_boundary_i || opcode == REOP_not_word_boundary_i);
                BOOL is_boundary = (opcode == REOP_word_boundary || opcode == REOP_word_boundary_i);
                /* char before */
                if (cptr == s->cbuf) {
                    v1 = FALSE;
                } else {
                    PEEK_PREV_CHAR(c, cptr, s->cbuf, cbuf_type);
                    if (ignore_case)
                        c = lre_canonicalize(c, s->is_unicode);
                    v1 = is_word_char(c);
                }
                /* current char */
                if (cptr >= cbuf_end) {
                    v2 = FALSE;
                } else {
                    PEEK_CHAR(c, cptr, cbuf_end, cbuf_type);
                    if (ignore_case)
                        c = lre_canonicalize(c, s->is_unicode);
                    v2 = is_word_char(c);
                }
                if (v1 ^ v2 ^ is_boundary)
                    goto no_match;
            }
            break;
        case REOP_back_reference:
        case REOP_back_reference_i:
        case REOP_backward_back_reference:
        case REOP_backward_back_reference_i:
            {
                const uint8_t *cptr1, *cptr1_end, *cptr1_start;
                uint32_t c1, c2;

                val = *pc++;
                if (val >= s->capture_count)
                    goto no_match;
                cptr1_start = capture[2 * val];
                cptr1_end = capture[2 * val + 1];
                if (!cptr1_start || !cptr1_end)
                    break;
                if (opcode == REOP_back_reference ||
                    opcode == REOP_back_reference_i) {
                    cptr1 = cptr1_start;
                    while (cptr1 < cptr1_end) {
                        if (cptr >= cbuf_end)
                            goto no_match;
                        GET_CHAR(c1, cptr1, cptr1_end, cbuf_type);
                        GET_CHAR(c2, cptr, cbuf_end, cbuf_type);
                        if (opcode == REOP_back_reference_i) {
                            c1 = lre_canonicalize(c1, s->is_unicode);
                            c2 = lre_canonicalize(c2, s->is_unicode);
                        }
                        if (c1 != c2)
                            goto no_match;
                    }
                } else {
                    cptr1 = cptr1_end;
                    while (cptr1 > cptr1_start) {
                        if (cptr == s->cbuf)
                            goto no_match;
                        GET_PREV_CHAR(c1, cptr1, cptr1_start, cbuf_type);
                        GET_PREV_CHAR(c2, cptr, s->cbuf, cbuf_type);
                        if (opcode == REOP_backward_back_reference_i) {
                            c1 = lre_canonicalize(c1, s->is_unicode);
                            c2 = lre_canonicalize(c2, s->is_unicode);
                        }
                        if (c1 != c2)
                            goto no_match;
                    }
                }
            }
            break;
        case REOP_range:
        case REOP_range_i:
            {
                int n;
                uint32_t low, high, idx_min, idx_max, idx;

                n = get_u16(pc); /* n must be >= 1 */
                pc += 2;
                if (cptr >= cbuf_end)
                    goto no_match;
                GET_CHAR(c, cptr, cbuf_end, cbuf_type);
                if (opcode == REOP_range_i) {
                    c = lre_canonicalize(c, s->is_unicode);
                }
                idx_min = 0;
                low = get_u16(pc + 0 * 4);
                if (c < low)
                    goto no_match;
                idx_max = n - 1;
                high = get_u16(pc + idx_max * 4 + 2);
                /* 0xffff in for last value means +infinity */
                if (unlikely(c >= 0xffff) && high == 0xffff)
                    goto range_match;
                if (c > high)
                    goto no_match;
                while (idx_min <= idx_max) {
                    idx = (idx_min + idx_max) / 2;
                    low = get_u16(pc + idx * 4);
                    high = get_u16(pc + idx * 4 + 2);
                    if (c < low)
                        idx_max = idx - 1;
                    else if (c > high)
                        idx_min = idx + 1;
                    else
                        goto range_match;
                }
                goto no_match;
            range_match:
                pc += 4 * n;
            }
            break;
        case REOP_range32:
        case REOP_range32_i:
            {
                int n;
                uint32_t low, high, idx_min, idx_max, idx;

                n = get_u16(pc); /* n must be >= 1 */
                pc += 2;
                if (cptr >= cbuf_end)
                    goto no_match;
                GET_CHAR(c, cptr, cbuf_end, cbuf_type);
                if (opcode == REOP_range32_i) {
                    c = lre_canonicalize(c, s->is_unicode);
                }
                idx_min = 0;
                low = get_u32(pc + 0 * 8);
                if (c < low)
                    goto no_match;
                idx_max = n - 1;
                high = get_u32(pc + idx_max * 8 + 4);
                if (c > high)
                    goto no_match;
                while (idx_min <= idx_max) {
                    idx = (idx_min + idx_max) / 2;
                    low = get_u32(pc + idx * 8);
                    high = get_u32(pc + idx * 8 + 4);
                    if (c < low)
                        idx_max = idx - 1;
                    else if (c > high)
                        idx_min = idx + 1;
                    else
                        goto range32_match;
                }
                goto no_match;
            range32_match:
                pc += 8 * n;
            }
            break;
        case REOP_prev:
            /* go to the previous char */
            if (cptr == s->cbuf)
                goto no_match;
            PREV_CHAR(cptr, s->cbuf, cbuf_type);
            break;
        case REOP_simple_greedy_quant:
            {
                uint32_t next_pos, quant_min, quant_max;
                size_t q;
                intptr_t res;
                const uint8_t *pc1;

                next_pos = get_u32(pc);
                quant_min = get_u32(pc + 4);
                quant_max = get_u32(pc + 8);
                pc += 16;
                pc1 = pc;
                pc += (int)next_pos;

                q = 0;
                for(;;) {
                    if (lre_poll_timeout(s))
                        return LRE_RET_TIMEOUT;
                    res = lre_exec_backtrack(s, capture, stack, stack_len,
                                             pc1, cptr, TRUE);
                    if (res == LRE_RET_MEMORY_ERROR ||
                        res == LRE_RET_TIMEOUT)
                        return res;
                    if (!res)
                        break;
                    cptr = (uint8_t *)res;
                    q++;
                    if (q >= quant_max && quant_max != INT32_MAX)
                        break;
                }
                if (q < quant_min)
                    goto no_match;
                if (q > quant_min) {
                    /* will examine all matches down to quant_min */
                    ret = push_state(s, capture, stack, stack_len,
                                     pc1 - 16, cptr,
                                     RE_EXEC_STATE_GREEDY_QUANT,
                                     q - quant_min);
                    if (ret < 0)
                        return LRE_RET_MEMORY_ERROR;
                }
            }
            break;
        default:
            abort();
        }
    }
}

/* Return 1 if match, 0 if not match or < 0 if error (see LRE_RET_x). cindex is the
   starting position of the match and must be such as 0 <= cindex <=
   clen. */
int lre_exec(uint8_t **capture,
             const uint8_t *bc_buf, const uint8_t *cbuf, int cindex, int clen,
             int cbuf_type, void *opaque)
{
    REExecContext s_s, *s = &s_s;
    int re_flags, i, alloca_size, ret;
    StackInt *stack_buf;
    const uint8_t *cptr;

    re_flags = lre_get_flags(bc_buf);
    s->is_unicode = (re_flags & (LRE_FLAG_UNICODE | LRE_FLAG_UNICODE_SETS)) != 0;
    s->capture_count = bc_buf[RE_HEADER_CAPTURE_COUNT];
    s->stack_size_max = bc_buf[RE_HEADER_STACK_SIZE];
    s->cbuf = cbuf;
    s->cbuf_end = cbuf + (clen << cbuf_type);
    s->cbuf_type = cbuf_type;
    if (s->cbuf_type == 1 && s->is_unicode)
        s->cbuf_type = 2;
    s->interrupt_counter = INTERRUPT_COUNTER_INIT;
    s->opaque = opaque;

    s->state_size = sizeof(REExecState) +
        s->capture_count * sizeof(capture[0]) * 2 +
        s->stack_size_max * sizeof(stack_buf[0]);
    s->state_stack = NULL;
    s->state_stack_len = 0;
    s->state_stack_size = 0;

    for(i = 0; i < s->capture_count * 2; i++)
        capture[i] = NULL;
    alloca_size = s->stack_size_max * sizeof(stack_buf[0]);
    stack_buf = alloca(alloca_size);

    cptr = cbuf + (cindex << cbuf_type);
    if (0 < cindex && cindex < clen && s->cbuf_type == 2) {
        const uint16_t *p = (const uint16_t *)cptr;
        if (is_lo_surrogate(*p) && is_hi_surrogate(p[-1])) {
            cptr = (const uint8_t *)(p - 1);
        }
    }

    ret = lre_exec_backtrack(s, capture, stack_buf, 0, bc_buf + RE_HEADER_LEN,
                             cptr, FALSE);
    lre_realloc(s->opaque, s->state_stack, 0);
    return ret;
}

int lre_get_capture_count(const uint8_t *bc_buf)
{
    return bc_buf[RE_HEADER_CAPTURE_COUNT];
}

int lre_get_flags(const uint8_t *bc_buf)
{
    return get_u16(bc_buf + RE_HEADER_FLAGS);
}

/* Return NULL if no group names. Otherwise, return a pointer to
   'capture_count - 1' zero terminated UTF-8 strings. */
const char *lre_get_groupnames(const uint8_t *bc_buf)
{
    uint32_t re_bytecode_len;
    if ((lre_get_flags(bc_buf) & LRE_FLAG_NAMED_GROUPS) == 0)
        return NULL;
    re_bytecode_len = get_u32(bc_buf + RE_HEADER_BYTECODE_LEN);
    return (const char *)(bc_buf + RE_HEADER_LEN + re_bytecode_len);
}

#ifdef TEST

BOOL lre_check_stack_overflow(void *opaque, size_t alloca_size)
{
    return FALSE;
}

void *lre_realloc(void *opaque, void *ptr, size_t size)
{
    return realloc(ptr, size);
}

int main(int argc, char **argv)
{
    int len, flags, ret, i;
    uint8_t *bc;
    char error_msg[64];
    uint8_t *capture[CAPTURE_COUNT_MAX * 2];
    const char *input;
    int input_len, capture_count;

    if (argc < 4) {
        printf("usage: %s regexp flags input\n", argv[0]);
        return 1;
    }
    flags = atoi(argv[2]);
    bc = lre_compile(&len, error_msg, sizeof(error_msg), argv[1],
                     strlen(argv[1]), flags, NULL);
    if (!bc) {
        fprintf(stderr, "error: %s\n", error_msg);
        exit(1);
    }

    input = argv[3];
    input_len = strlen(input);

    ret = lre_exec(capture, bc, (uint8_t *)input, 0, input_len, 0, NULL);
    printf("ret=%d\n", ret);
    if (ret == 1) {
        capture_count = lre_get_capture_count(bc);
        for(i = 0; i < 2 * capture_count; i++) {
            uint8_t *ptr;
            ptr = capture[i];
            printf("%d: ", i);
            if (!ptr)
                printf("<nil>");
            else
                printf("%u", (int)(ptr - (uint8_t *)input));
            printf("\n");
        }
    }
    return 0;
}
#endif
