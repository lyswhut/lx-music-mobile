import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View, type ListRenderItem } from 'react-native'

import { filterList, getHotComment, type Comment } from '@/screens/Comment/utils'

import { PagingEnd, QTag, Sheet } from '@/newui/components'
import { NEW_UI_SHEET_COMMENT } from '@/newui/const'
import { COMMENT, FONT_SIZE, FONT_WEIGHT, SHEET, useTheme } from '@/newui/theme'
import { formatCount } from '@/newui/utils'

import { CommentNode } from './CommentNode'

/** 每页条数 */
const COMMENT_LIMIT = 15

type Phase = 'loading' | 'ready' | 'error'
/** 分页尾部状态 */
type MoreState = 'idle' | 'loading' | 'end' | 'error'

export interface CommentSheetProps {
  visible: boolean
  /** 当前播放的在线歌曲；由容器保证非本地时才有值 */
  musicInfo: LX.Music.MusicInfoOnline | null
  onClose: () => void
  bottomInset?: number
}

/**
 * 评论浮层：复用 getHotComment，分页沿用既有口径（page 从 1 起、每页 15 条、
 * isEnd = page >= maxPage、追加用 filterList 去重）。触底取下一页挂在 Sheet 的虚拟化主体上，
 * 一条根评论（含整条回复线程）= 一行，避免热评全量直出把 Yoga 节点堆满。
 * 标题/说明/总数/排序标签钉住，只有评论列表滚；点赞是新 UI 的本地会话态。
 */
export const CommentSheet = ({ visible, musicInfo, onClose, bottomInset }: CommentSheetProps) => {
  const theme = useTheme()

  const [phase, setPhase] = useState<Phase>('loading')
  const [comments, setComments] = useState<Comment[]>([])
  const [total, setTotal] = useState(0)
  const [moreState, setMoreState] = useState<MoreState>('idle')
  // 本浮层会话内的点赞态（关闭即复位，不假装持久化）
  const [likedIds, setLikedIds] = useState<ReadonlySet<string>>(new Set())

  /**
   * 分页账本放 ref：异步回调读最新值，
   * 换歌/重开时由 effect 复位；gen 是自增令牌，旧请求晚归一律作废（不污染新歌的分页）。
   */
  const pagerRef = useRef({ gen: 0, page: 0, maxPage: 1, isEnd: false, isLoading: false })

  const queryKey = useMemo(
    () => (musicInfo == null ? '' : `${musicInfo.source}:${musicInfo.id}`),
    [musicInfo],
  )

  // 首屏（第 1 页）取数：visible 或 queryKey 变化时重来，分页账本整体复位
  useEffect(() => {
    if (!visible || musicInfo == null) return
    const pager = pagerRef.current
    const gen = ++pager.gen
    pager.page = 0
    pager.maxPage = 1
    pager.isEnd = false
    pager.isLoading = false
    setPhase('loading')
    setMoreState('idle')
    setLikedIds(new Set())
    void (async () => {
      try {
        const res = await getHotComment(musicInfo, 1, COMMENT_LIMIT)
        if (pager.gen !== gen) return
        setComments(filterList(res.comments))
        setTotal(res.total)
        pager.page = 1
        pager.maxPage = res.maxPage
        pager.isEnd = res.maxPage <= 1
        setPhase('ready')
        setMoreState(pager.isEnd ? 'end' : 'idle')
      } catch {
        if (pager.gen === gen) setPhase('error')
      }
    })()
    // queryKey 变化 = 换了歌，重取（musicInfo 对象引用每次渲染都可能变，故用 key）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, queryKey])

  /** 取下一页并追加（loading/isEnd 挡重入） */
  const handleLoadMore = useCallback(() => {
    if (musicInfo == null || phase !== 'ready') return
    const pager = pagerRef.current
    if (pager.isLoading || pager.isEnd) return
    const gen = pager.gen
    pager.isLoading = true
    setMoreState('loading')
    void getHotComment(musicInfo, pager.page + 1, COMMENT_LIMIT)
      .then((res) => {
        if (pager.gen !== gen) return
        pager.page += 1
        pager.isLoading = false
        pager.isEnd = pager.page >= pager.maxPage
        // 追加去重，不是替换
        setComments((prev) => filterList([...prev, ...res.comments]))
        setMoreState(pager.isEnd ? 'end' : 'idle')
      })
      .catch(() => {
        if (pager.gen !== gen) return
        pager.isLoading = false
        setMoreState('error')
      })
  }, [musicInfo, phase])

  // 点赞态上抛给展示件 CommentNode（useCallback 稳引用，让 memo 在分页追加时不空转）
  const toggleLiked = useCallback((id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  /**
   * 动态高度列表滚到某位置可能算不准 offset：交给 VirtualizedList 自己恢复。
   * 根因靠 initialNumToRender 全渲染首批 + Sheet 底部补偿兜住。
   */
  const handleScrollToIndexFailed = useCallback((_info: {
    index: number
    highestMeasuredFrameIndex: number
    averageItemLength: number
  }) => {
  }, [])

  /** 一条根评论（含整条回复线程）= 一行；likedIds 变化时靠 CommentNode memo 挡住未变行重渲染 */
  const renderItem = useCallback<ListRenderItem<Comment>>(
    ({ item, index }) => (
      <CommentNode
        comment={item}
        depth={0}
        first={index === 0}
        liked={likedIds.has(String(item.id))}
        onToggleLike={toggleLiked}
      />
    ),
    [likedIds, toggleLiked],
  )
  const keyExtractor = useCallback((item: Comment) => String(item.id), [])

  /** 钉住区：总数 + 排序标签，不随列表滚；Fragment 让钉住模式恒开 */
  const pinnedTotal = (
    <>
      {/* 总数 + 排序说明（真实接口无「乐评人长评」口径，不造假） */}
      {phase === 'ready' && comments.length > 0 && (
        <View style={styles.total}>
          <Text style={[styles.totalNum, { color: theme.colors.text }]}>
            {formatCount(total)}
          </Text>
          <QTag label={NEW_UI_SHEET_COMMENT.sortTag} />
        </View>
      )}
    </>
  )

  // 列表头部：三态提示
  const listHeader = (
    <View>
      {phase === 'loading' && (
        <Text style={[styles.state, { color: theme.colors.text3 }]}>
          {NEW_UI_SHEET_COMMENT.loading}
        </Text>
      )}
      {phase === 'error' && (
        <Text style={[styles.state, { color: theme.colors.text3 }]}>
          {NEW_UI_SHEET_COMMENT.error}
        </Text>
      )}
      {phase === 'ready' && comments.length === 0 && (
        <Text style={[styles.state, { color: theme.colors.text3 }]}>
          {NEW_UI_SHEET_COMMENT.empty}
        </Text>
      )}
    </View>
  )

  /**
   * 尾部 cell：三档互斥、同一位置只出一行——
   * 列到尾用共用收行 PagingEnd；正在翻 / 失败给状态行（失败可点重试）；其余不摆，滚到底自动取。
   */
  const listFooter =
    phase === 'ready' && comments.length > 0
      ? moreState === 'end'
        ? <PagingEnd text={NEW_UI_SHEET_COMMENT.moreEnd} />
        : moreState === 'idle'
          ? null
          : (
            <Pressable
              onPress={moreState === 'error' ? handleLoadMore : undefined}
              hitSlop={8}
              style={({ pressed }) => [styles.more, pressed ? styles.pressed : null]}
              accessibilityRole={moreState === 'error' ? 'button' : undefined}
            >
              <Text style={[styles.moreText, { color: theme.colors.text3 }]}>
                {moreState === 'loading' && NEW_UI_SHEET_COMMENT.moreLoading}
                {moreState === 'error' && NEW_UI_SHEET_COMMENT.moreError}
              </Text>
            </Pressable>
            )
      : null

  // 失败态不绑触底：Sheet 的触底判定在内容尺寸变化时也会补判，
  // 失败态放行会因页脚高度变化自动重撞网，故失败保持页脚点按重试。
  const handleListEndReached = moreState === 'error' ? undefined : handleLoadMore

  return (
    <Sheet
      visible={visible}
      title={NEW_UI_SHEET_COMMENT.title}
      subtitle={NEW_UI_SHEET_COMMENT.sub}
      onClose={onClose}
      bottomInset={bottomInset}
      onEndReached={handleListEndReached}
      list={{
        data: comments,
        renderItem,
        keyExtractor,
        headerComponent: listHeader,
        pinnedComponent: pinnedTotal,
        footerComponent: listFooter,
        // 虚拟化参数：首批全渲染；动态高度列表不适合 getItemLayout，靠 Sheet 底部补偿兜底
        initialNumToRender: COMMENT_LIMIT,
        onScrollToIndexFailed: handleScrollToIndexFailed,
      }}
    />
  )
}

CommentSheet.displayName = 'NewUICommentSheet'

const styles = StyleSheet.create({
  state: {
    marginTop: 24,
    fontSize: FONT_SIZE.smallLg,
    lineHeight: SHEET.subLineHeight,
  },
  total: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: COMMENT.totalGap,
    marginTop: 14,
    marginBottom: COMMENT.totalMarginBottom,
  },
  totalNum: {
    fontSize: FONT_SIZE.headingLg,
    fontWeight: FONT_WEIGHT.black,
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  /** 分页状态行 */
  more: {
    padding: COMMENT.morePadding,
    alignItems: 'center',
  },
  moreText: {
    fontSize: FONT_SIZE.small,
    textAlign: 'center',
  },
})
