import { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { type Comment } from '@/screens/Comment/utils'

import { Art, Icon } from '@/newui/components'
import { NEW_UI_SHEET_COMMENT } from '@/newui/const'
import { COMMENT, FONT_SIZE, FONT_WEIGHT, RADIUS, useTheme } from '@/newui/theme'
import { formatCount } from '@/newui/utils'

export interface CommentNodeProps {
  comment: Comment
  /**
   * 层级：0 = 根评论（完整块：头像 + 名字 + 点赞 + 正文），>=1 = 回复（胶囊行）。
   * 回复线程按真实嵌套递归呈现（bug-fix「评论浮窗」第 2 条），不把层级写死成两层 if；
   * 缩进量与深度上限见 theme token COMMENT.replyIndent / maxReplyDepth。
   */
  depth: number
  /** 被回复者昵称：depth >= 2 时渲染「回复 @某人」浅色前缀（depth 1 由父线程竖线直接表达归属） */
  parentName?: string
  /** 是否首条根评论：首条不画顶部分隔线（沿用 CommentSheet 既有口径） */
  first?: boolean
  /** 以下两项仅 depth === 0 生效：点赞是浮层会话内的本地态（容器持有，展示组件纯 props） */
  liked?: boolean
  onToggleLike?: (id: string) => void
}

/**
 * 评论节点（对应原型 .cmt-item / .cmt-reply，styles.css L632-646 / app.js L1239-1263）：
 * 同族递归组件——根级渲染完整评论块，回复级渲染胶囊行，回复的回复再套一层
 * 「左侧竖线 + 缩进」的线程容器，层级线索 = 每级 replyIndent 缩进 + thread 竖线 +
 * 第 2 级起的「回复 @某人」前缀。深浅主题都走 useTheme 色板（line / chip / text2 / brand），
 * 缩进挂在线程容器上而非文本内，长昵称 / 长文本换行不会把缩进线顶歪。
 *
 * 数据口径（实测五平台 filterComment，2026-10-13 核查）：
 * - kw：reply = child_comments 结构化数组，回复项运行时不带 reply 键（故此处对 undefined 防御）；
 * - tx：热评 reply = SubComments 数组 / 普评 reply = middlecommentcontent 数组，回复项同样不带 reply 键；
 * - mg：reply = replyComments 数组（另有点开 replyNum 走 getReplyComment 的新接口，本浮层用热评侧，不接）；
 * - wy / kg：出现 beReplied / pcontent 时改挂「被回复的原评论」为根、真评论放进其 reply[0]（倒挂一层）。
 * 五个平台给到的最深结构关系都只有 **2 级**（根 + 一层回复数组），没有第三方 parentCommentId 式扁平链，
 * 所以递归实际最深到 2 级；maxReplyDepth = 3 只是防御性上限，不为“看起来多级”造假嵌套。
 */
const CommentNodeBase = ({ comment, depth, parentName, first, liked, onToggleLike }: CommentNodeProps) => {
  const theme = useTheme()

  // 运行时防御：kw/tx/mg 的回复项没有 reply 字段（类型上声明必有，数据实际可缺），不可直接 .map
  const replies: Comment[] = Array.isArray(comment.reply) ? comment.reply : []
  // 深度闸：下一级回复若超过上限，就平铺在当前级（不再缩进、不再画竖线），防止长串楼中楼挤成窄条
  const capped = depth + 1 > COMMENT.maxReplyDepth

  const thread = replies.length > 0 ? (
    <View style={capped ? styles.threadFlat : [styles.thread, { borderLeftColor: theme.colors.line }]}>
      {replies.map((r) => (
        <CommentNodeBase
          key={String(r.id)}
          comment={r}
          // 超闸的回复保持当前深度（就地平铺），归属线索仍指向直接上级
          depth={capped ? depth : depth + 1}
          parentName={comment.userName}
        />
      ))}
    </View>
  ) : null

  // ---- 根级（depth 0）：完整评论块 ----
  if (depth === 0) {
    const likeCount = (comment.likedCount ?? 0) + (liked ? 1 : 0)
    return (
      <View style={[styles.item, first ? null : { borderTopColor: theme.colors.line }]}>
        {/* .cmt-item .art 34 全圆；无头像时按种子画占位脸（原型 faceArt） */}
        <Art
          width={COMMENT.avatarSize}
          height={COMMENT.avatarSize}
          radius={RADIUS.full}
          seed={`cmt:${comment.id}`}
          imageUri={comment.avatar}
          icon="user"
          iconSize={16}
        />
        <View style={styles.body}>
          {/* —— meta 行两端布局（2026-10-29 收敛同一行）——
              左簇：用户名 · 时间；右簇：♥N 贴右。
              旧版只有 name + like 两项 space-between，时间没放进来；
              现在把时间补上、名字色用 text2 突出（是主信息），like 独立 flex:none 钉右。 */}
          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              <Text numberOfLines={1} style={[styles.name, { color: theme.colors.text2 }]}>
                {comment.userName}
              </Text>
              {comment.timeStr && (
                <>
                  <Text style={[styles.metaDot, { color: theme.colors.text3 }]}>·</Text>
                  <Text numberOfLines={1} style={[styles.time, { color: theme.colors.text3 }]}>
                    {comment.timeStr}
                  </Text>
                </>
              )}
            </View>
            {/* .cmt-like：本地会话点赞态，实心/空心切换；flex:none 钉在 meta 行右端 */}
            <Pressable
              hitSlop={8}
              onPress={() => {
                onToggleLike?.(String(comment.id))
              }}
              style={({ pressed }) => [
                styles.like,
                pressed ? styles.pressed : null,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={liked ? '取消点赞' : '点赞'}
            >
              <Icon
                name={liked ? 'heartFill' : 'heart'}
                size={COMMENT.likeIcon}
                color={liked ? theme.colors.brand : theme.colors.text3}
              />
              <Text
                style={[
                  styles.likeCount,
                  { color: liked ? theme.colors.brand : theme.colors.text3 },
                ]}
              >
                {formatCount(likeCount)}
              </Text>
            </Pressable>
          </View>
          <Text style={[styles.text, { color: theme.colors.text }]}>{comment.text}</Text>
          {thread}
        </View>
      </View>
    )
  }

  // ---- 回复级（depth >= 1）：原型 .cmt-reply 胶囊（@名字：内容），第 2 级起加「回复 @某人」前缀 ----
  return (
    <View style={styles.replyWrap}>
      <View style={[styles.reply, { backgroundColor: theme.colors.fill2 }]}>
        <Text style={[styles.replyText, { color: theme.colors.text2 }]}>
          {depth >= 2 && parentName != null && (
            <Text style={{ color: theme.colors.text3 }}>
              {NEW_UI_SHEET_COMMENT.replyToText(parentName)}
            </Text>
          )}
          <Text style={{ color: theme.colors.brand, fontWeight: FONT_WEIGHT.bold }}>
            @{comment.userName}
          </Text>
          {`：${comment.text}`}
        </Text>
      </View>
      {thread}
    </View>
  )
}

CommentNodeBase.displayName = 'NewUICommentNode'

export const CommentNode = memo(CommentNodeBase)

const styles = StyleSheet.create({
  /** .cmt-item gap:11 / padding:13px 0 / border-top 1px line（首条不画线） */
  item: {
    flexDirection: 'row',
    gap: COMMENT.itemGap,
    paddingVertical: COMMENT.itemPaddingY,
    borderTopWidth: 1,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  /** meta 行两端布局（2026-10-29 收敛同一行）：左簇名字·时间，右簇 ♥N 贴右。 */
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  /** 左簇：名字 · 时间 自然堆叠，flex:1 让右簇钉右；minWidth:0 防长名字撑破 */
  metaLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: COMMENT.metaGap,
    marginRight: COMMENT.lineGap,
  },
  /** 用户名：text2（比旧版 text3 深，是主信息） */
  name: {
    flexShrink: 1,
    fontSize: FONT_SIZE.captionLg,
    fontWeight: FONT_WEIGHT.bold,
  },
  /** meta 行内分隔点（·） */
  metaDot: {
    fontSize: FONT_SIZE.captionLg,
  },
  /** 时间：text3 灰、比名字小一档、tabular */
  time: {
    fontSize: FONT_SIZE.tiny,
    fontVariant: ['tabular-nums'],
  },
  /** .cmt-like 10.5 / gap:4 / flex:none */
  like: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: COMMENT.likeGap,
    flexShrink: 0,
  },
  likeCount: {
    fontSize: FONT_SIZE.tiny,
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  /** .cmt-text 13 / lh 1.55 / margin-top:4 */
  text: {
    marginTop: COMMENT.textMarginTop,
    fontSize: FONT_SIZE.body,
    lineHeight: COMMENT.textLineHeight,
  },
  /** 回复线程容器：左竖线（层级线索）+ 每级 replyIndent 缩进；缩进挂在容器上，文本换行不顶歪 */
  thread: {
    marginTop: COMMENT.threadMarginTop,
    marginLeft: 2,
    paddingLeft: COMMENT.replyIndent,
    borderLeftWidth: COMMENT.threadRuleWidth,
  },
  /** 超过深度上限的回复就地平铺（不缩进不画线），仅保留间距节奏 */
  threadFlat: {
    marginTop: COMMENT.threadMarginTop,
  },
  replyWrap: {
    minWidth: 0,
  },
  /** .cmt-reply margin-top:7 / padding:8px 10px / radius:10 / 11.5 lh 1.55 */
  reply: {
    marginTop: COMMENT.replyMarginTop,
    paddingVertical: COMMENT.replyPaddingY,
    paddingHorizontal: COMMENT.replyPaddingX,
    borderRadius: COMMENT.replyRadius,
  },
  replyText: {
    fontSize: FONT_SIZE.captionLg,
    lineHeight: COMMENT.textLineHeight,
  },
})
