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
   * 层级：0 = 根评论（完整块），>=1 = 回复（胶囊行）。
   * 缩进量与深度上限见 COMMENT.replyIndent / maxReplyDepth。
   */
  depth: number
  /** 被回复者昵称：depth >= 2 时渲染「回复 @某人」浅色前缀（depth 1 由父线程竖线直接表达归属） */
  parentName?: string
  /** 是否首条根评论：首条不画顶部分隔线（沿用 CommentSheet 既有口径） */
  first?: boolean
  /** 以下两项仅 depth === 0 生效：点赞为浮层会话内的本地态 */
  liked?: boolean
  onToggleLike?: (id: string) => void
}

/**
 * 评论节点：同族递归组件，根级渲染完整块，回复级渲染胶囊行，第 2 级起加「回复 @某人」前缀。
 * 层级线索 = 每级 replyIndent 缩进 + 线程竖线；缩进挂在线程容器上，长文本换行不会顶歪。
 *
 * 各平台真实数据最深只有 2 级（根 + 一层回复数组），maxReplyDepth = 3 只是防御性上限。
 */
const CommentNodeBase = ({ comment, depth, parentName, first, liked, onToggleLike }: CommentNodeProps) => {
  const theme = useTheme()

  // 运行时防御：部分平台回复项没有 reply 字段，不可直接 .map
  const replies: Comment[] = Array.isArray(comment.reply) ? comment.reply : []
  // 深度闸：下一级回复若超过上限，就平铺在当前级（不再缩进、不再画竖线），防止长串楼中楼挤成窄条
  const capped = depth + 1 > COMMENT.maxReplyDepth

  const thread = replies.length > 0 ? (
    <View style={capped ? styles.threadFlat : [styles.thread, { borderLeftColor: theme.colors.line }]}>
      {replies.map((r) => (
        <CommentNodeBase
          key={String(r.id)}
          comment={r}
          // 超闸的回复就地平铺，归属线索仍指向直接上级
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
        {/* 无头像时按种子画占位脸 */}
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
          {/* meta 行：左簇用户名·时间，右簇 ♥N 贴右 */}
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
            {/* 本地会话点赞态，实心/空心切换 */}
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

  // ---- 回复级（depth >= 1）：胶囊行，第 2 级起加「回复 @某人」前缀 ----
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
  /** 首条不画顶部分隔线 */
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  /** 左簇名字·时间自然堆叠；minWidth:0 防长名字撑破 */
  metaLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: COMMENT.metaGap,
    marginRight: COMMENT.lineGap,
  },
  /** 用户名用 text2（主信息） */
  name: {
    flexShrink: 1,
    fontSize: FONT_SIZE.captionLg,
    fontWeight: FONT_WEIGHT.bold,
  },
  metaDot: {
    fontSize: FONT_SIZE.captionLg,
  },
  time: {
    fontSize: FONT_SIZE.tiny,
    fontVariant: ['tabular-nums'],
  },
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
  text: {
    marginTop: COMMENT.textMarginTop,
    fontSize: FONT_SIZE.body,
    lineHeight: COMMENT.textLineHeight,
  },
  /** 回复线程容器：左竖线 + 缩进，缩进挂容器上避免文本换行顶歪 */
  thread: {
    marginTop: COMMENT.threadMarginTop,
    marginLeft: 2,
    paddingLeft: COMMENT.replyIndent,
    borderLeftWidth: COMMENT.threadRuleWidth,
  },
  threadFlat: {
    marginTop: COMMENT.threadMarginTop,
  },
  replyWrap: {
    minWidth: 0,
  },
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
