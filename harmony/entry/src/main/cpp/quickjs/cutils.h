/*
 * C utilities
 *
 * Copyright (c) 2017 Fabrice Bellard
 * Copyright (c) 2018 Charlie Gordon
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
#ifndef CUTILS_H
#define CUTILS_H

#include <stdlib.h>
#include <string.h>
#include <inttypes.h>

#define likely(x)       __builtin_expect(!!(x), 1)
#define unlikely(x)     __builtin_expect(!!(x), 0)
#define force_inline inline __attribute__((always_inline))
#define no_inline __attribute__((noinline))
#define __maybe_unused __attribute__((unused))

#define xglue(x, y) x ## y
#define glue(x, y) xglue(x, y)
#define stringify(s)    tostring(s)
#define tostring(s)     #s

#ifndef offsetof
#define offsetof(type, field) ((size_t) &((type *)0)->field)
#endif
#ifndef countof
#define countof(x) (sizeof(x) / sizeof((x)[0]))
#endif
#ifndef container_of
/* return the pointer of type 'type *' containing 'ptr' as field 'member' */
#define container_of(ptr, type, member) ((type *)((uint8_t *)(ptr) - offsetof(type, member)))
#endif

#if !defined(_MSC_VER) && defined(__STDC_VERSION__) && __STDC_VERSION__ >= 199901L
#define minimum_length(n)  static n
#else
#define minimum_length(n)  n
#endif

typedef int BOOL;

#ifndef FALSE
enum {
    FALSE = 0,
    TRUE = 1,
};
#endif

void pstrcpy(char *buf, int buf_size, const char *str);
char *pstrcat(char *buf, int buf_size, const char *s);
int strstart(const char *str, const char *val, const char **ptr);
int has_suffix(const char *str, const char *suffix);

/* Prevent UB when n == 0 and (src == NULL or dest == NULL) */
static inline void memcpy_no_ub(void *dest, const void *src, size_t n) {
    if (n)
        memcpy(dest, src, n);
}

static inline int max_int(int a, int b)
{
    if (a > b)
        return a;
    else
        return b;
}

static inline int min_int(int a, int b)
{
    if (a < b)
        return a;
    else
        return b;
}

static inline uint32_t max_uint32(uint32_t a, uint32_t b)
{
    if (a > b)
        return a;
    else
        return b;
}

static inline uint32_t min_uint32(uint32_t a, uint32_t b)
{
    if (a < b)
        return a;
    else
        return b;
}

static inline int64_t max_int64(int64_t a, int64_t b)
{
    if (a > b)
        return a;
    else
        return b;
}

static inline int64_t min_int64(int64_t a, int64_t b)
{
    if (a < b)
        return a;
    else
        return b;
}

/* WARNING: undefined if a = 0 */
static inline int clz32(unsigned int a)
{
    return __builtin_clz(a);
}

/* WARNING: undefined if a = 0 */
static inline int clz64(uint64_t a)
{
    return __builtin_clzll(a);
}

/* WARNING: undefined if a = 0 */
static inline int ctz32(unsigned int a)
{
    return __builtin_ctz(a);
}

/* WARNING: undefined if a = 0 */
static inline int ctz64(uint64_t a)
{
    return __builtin_ctzll(a);
}

struct __attribute__((packed)) packed_u64 {
    uint64_t v;
};

struct __attribute__((packed)) packed_u32 {
    uint32_t v;
};

struct __attribute__((packed)) packed_u16 {
    uint16_t v;
};

static inline uint64_t get_u64(const uint8_t *tab)
{
    return ((const struct packed_u64 *)tab)->v;
}

static inline int64_t get_i64(const uint8_t *tab)
{
    return (int64_t)((const struct packed_u64 *)tab)->v;
}

static inline void put_u64(uint8_t *tab, uint64_t val)
{
    ((struct packed_u64 *)tab)->v = val;
}

static inline uint32_t get_u32(const uint8_t *tab)
{
    return ((const struct packed_u32 *)tab)->v;
}

static inline int32_t get_i32(const uint8_t *tab)
{
    return (int32_t)((const struct packed_u32 *)tab)->v;
}

static inline void put_u32(uint8_t *tab, uint32_t val)
{
    ((struct packed_u32 *)tab)->v = val;
}

static inline uint32_t get_u16(const uint8_t *tab)
{
    return ((const struct packed_u16 *)tab)->v;
}

static inline int32_t get_i16(const uint8_t *tab)
{
    return (int16_t)((const struct packed_u16 *)tab)->v;
}

static inline void put_u16(uint8_t *tab, uint16_t val)
{
    ((struct packed_u16 *)tab)->v = val;
}

static inline uint32_t get_u8(const uint8_t *tab)
{
    return *tab;
}

static inline int32_t get_i8(const uint8_t *tab)
{
    return (int8_t)*tab;
}

static inline void put_u8(uint8_t *tab, uint8_t val)
{
    *tab = val;
}

#ifndef bswap16
static inline uint16_t bswap16(uint16_t x)
{
    return (x >> 8) | (x << 8);
}
#endif

#ifndef bswap32
static inline uint32_t bswap32(uint32_t v)
{
    return ((v & 0xff000000) >> 24) | ((v & 0x00ff0000) >>  8) |
        ((v & 0x0000ff00) <<  8) | ((v & 0x000000ff) << 24);
}
#endif

#ifndef bswap64
static inline uint64_t bswap64(uint64_t v)
{
    return ((v & ((uint64_t)0xff << (7 * 8))) >> (7 * 8)) |
        ((v & ((uint64_t)0xff << (6 * 8))) >> (5 * 8)) |
        ((v & ((uint64_t)0xff << (5 * 8))) >> (3 * 8)) |
        ((v & ((uint64_t)0xff << (4 * 8))) >> (1 * 8)) |
        ((v & ((uint64_t)0xff << (3 * 8))) << (1 * 8)) |
        ((v & ((uint64_t)0xff << (2 * 8))) << (3 * 8)) |
        ((v & ((uint64_t)0xff << (1 * 8))) << (5 * 8)) |
        ((v & ((uint64_t)0xff << (0 * 8))) << (7 * 8));
}
#endif

/* XXX: should take an extra argument to pass slack information to the caller */
typedef void *DynBufReallocFunc(void *opaque, void *ptr, size_t size);

typedef struct DynBuf {
    uint8_t *buf;
    size_t size;
    size_t allocated_size;
    BOOL error; /* true if a memory allocation error occurred */
    DynBufReallocFunc *realloc_func;
    void *opaque; /* for realloc_func */
} DynBuf;

void dbuf_init(DynBuf *s);
void dbuf_init2(DynBuf *s, void *opaque, DynBufReallocFunc *realloc_func);
int dbuf_realloc(DynBuf *s, size_t new_size);
int dbuf_write(DynBuf *s, size_t offset, const uint8_t *data, size_t len);
int dbuf_put(DynBuf *s, const uint8_t *data, size_t len);
int dbuf_put_self(DynBuf *s, size_t offset, size_t len);
int dbuf_putc(DynBuf *s, uint8_t c);
int dbuf_putstr(DynBuf *s, const char *str);
static inline int dbuf_put_u16(DynBuf *s, uint16_t val)
{
    return dbuf_put(s, (uint8_t *)&val, 2);
}
static inline int dbuf_put_u32(DynBuf *s, uint32_t val)
{
    return dbuf_put(s, (uint8_t *)&val, 4);
}
static inline int dbuf_put_u64(DynBuf *s, uint64_t val)
{
    return dbuf_put(s, (uint8_t *)&val, 8);
}
int __attribute__((format(printf, 2, 3))) dbuf_printf(DynBuf *s,
                                                      const char *fmt, ...);
void dbuf_free(DynBuf *s);
static inline BOOL dbuf_error(DynBuf *s) {
    return s->error;
}
static inline void dbuf_set_error(DynBuf *s)
{
    s->error = TRUE;
}

#define UTF8_CHAR_LEN_MAX 6

int unicode_to_utf8(uint8_t *buf, unsigned int c);
int unicode_from_utf8(const uint8_t *p, int max_len, const uint8_t **pp);

static inline BOOL is_surrogate(uint32_t c)
{
    return (c >> 11) == (0xD800 >> 11); // 0xD800-0xDFFF
}

static inline BOOL is_hi_surrogate(uint32_t c)
{
    return (c >> 10) == (0xD800 >> 10); // 0xD800-0xDBFF
}

static inline BOOL is_lo_surrogate(uint32_t c)
{
    return (c >> 10) == (0xDC00 >> 10); // 0xDC00-0xDFFF
}

static inline uint32_t get_hi_surrogate(uint32_t c)
{
    return (c >> 10) - (0x10000 >> 10) + 0xD800;
}

static inline uint32_t get_lo_surrogate(uint32_t c)
{
    return (c & 0x3FF) | 0xDC00;
}

static inline uint32_t from_surrogate(uint32_t hi, uint32_t lo)
{
    return 0x10000 + 0x400 * (hi - 0xD800) + (lo - 0xDC00);
}

static inline int from_hex(int c)
{
    if (c >= '0' && c <= '9')
        return c - '0';
    else if (c >= 'A' && c <= 'F')
        return c - 'A' + 10;
    else if (c >= 'a' && c <= 'f')
        return c - 'a' + 10;
    else
        return -1;
}

void rqsort(void *base, size_t nmemb, size_t size,
            int (*cmp)(const void *, const void *, void *),
            void *arg);

static inline uint64_t float64_as_uint64(double d)
{
    union {
        double d;
        uint64_t u64;
    } u;
    u.d = d;
    return u.u64;
}

static inline double uint64_as_float64(uint64_t u64)
{
    union {
        double d;
        uint64_t u64;
    } u;
    u.u64 = u64;
    return u.d;
}

static inline double fromfp16(uint16_t v)
{
    double d;
    uint32_t v1;
    v1 = v & 0x7fff;
    if (unlikely(v1 >= 0x7c00))
        v1 += 0x1f8000; /* NaN or infinity */
    d = uint64_as_float64(((uint64_t)(v >> 15) << 63) | ((uint64_t)v1 << (52 - 10)));
    return d * 0x1p1008;
}

static inline uint16_t tofp16(double d)
{
    uint64_t a, addend;
    uint32_t v, sgn;
    int shift;
    
    a = float64_as_uint64(d);
    sgn = a >> 63;
    a = a & 0x7fffffffffffffff;
    if (unlikely(a > 0x7ff0000000000000)) {
        /* nan */
        v = 0x7c01;
    } else if (a < 0x3f10000000000000) { /* 0x1p-14 */
        /* subnormal f16 number or zero */
        if (a <= 0x3e60000000000000) { /* 0x1p-25 */
            v = 0x0000; /* zero */
        } else {
            shift = 1051 - (a >> 52);
            a = ((uint64_t)1 << 52) | (a & (((uint64_t)1 << 52) - 1));
            addend = ((a >> shift) & 1) + (((uint64_t)1 << (shift - 1)) - 1);
            v = (a + addend) >> shift;
        }
    } else {
        /* normal number or infinity */
        a -= 0x3f00000000000000; /* adjust the exponent */
        /* round */
        addend = ((a >> (52 - 10)) & 1) + (((uint64_t)1 << (52 - 11)) - 1);
        v = (a + addend) >> (52 - 10);
        /* overflow ? */
        if (unlikely(v > 0x7c00))
            v = 0x7c00;
    }
    return v | (sgn << 15);
}

static inline int isfp16nan(uint16_t v)
{
    return (v & 0x7FFF) > 0x7C00;
}

static inline int isfp16zero(uint16_t v)
{
    return (v & 0x7FFF) == 0;
}

#endif  /* CUTILS_H */
