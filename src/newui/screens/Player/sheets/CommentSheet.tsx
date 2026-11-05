import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View, type ListRenderItem } from 'react-native'

import { filterList, getHotComment, type Comment } from '@/screens/Comment/utils'

import { PagingEnd, QTag, Sheet } from '@/newui/components'
import { NEW_UI_SHEET_COMMENT } from '@/newui/const'
import { COMMENT, FONT_SIZE, FONT_WEIGHT, SHEET, useTheme } from '@/newui/theme'
import { formatCount } from '@/newui/utils'

import { CommentNode } from './CommentNode'

/** 每页条数，逐条照抄旧 CommentHot.tsx L5 的 limit = 15 */
const COMMENT_LIMIT = 15

type Phase = 'loading' | 'ready' | 'error'
/** 分页尾部状态（对齐旧 List.tsx 的 status：idle/loading/end/error） */
type MoreState = 'idle' | 'loading' | 'end' | 'error'

export interface CommentSheetProps {
  visible: boolean
  /** 当前播放的在线歌曲；由容器保证非本地时才有值 */
  musicInfo: LX.Music.MusicInfoOnline | null
  onClose: () => void
  bottomInset?: number
}

/**
 * 评论浮层（对应原型 renderCommentSheet app.js L1239 + .cmt-* styles.css L632-646）：
 * 复用旧评论数据层 getHotComment（src/screens/Comment/utils.ts L38），
 * **分页口径逐条照抄旧 CommentHot.tsx**：page 从 1 起、每页 15 条、
 * CommentInfo { total, maxPage }（utils.ts L17-24）、isEnd = page >= maxPage（旧 L50）、
 * 首页 isEnd = maxPage === 1（旧 L62）、追加时 filterList 去重（utils.ts L50）。
 * 触底取下一页挂在 Sheet 的**虚拟化主体**上（list 路径：骨架自带滚动容器就地换成 FlatList，
 * 原生 onEndReached + 本容器 isLoading/isEnd 挡重入；仍是唯一一层滚动容器，不嵌第二层）。
 * 2026-10-16 OOM 修复轮：热门歌评论翻页累加可到几千条，旧版在骨架 ScrollView 里 .map 全量直出、
 * 滚不回收把 Yoga 节点堆满 Java 堆——现在挂载视图数 = 屏内行数 + windowSize 余量，与总数解耦。
 * 评论浮层钉住回归修复轮（对齐 164dfa4）：.cmt-total 从列表头部 cell 上移进 Sheet 钉住区
 * （原型 #psMeta：总数 + 排序标签跟着标题一起钉住、不跟着列表滚，app.js L2075-2076）——
 * 标题、说明、总数与排序标签不再被顶出视野，只有评论列表滚；三态提示仍在列表头 cell（原 #psBody 内挂载）。
 * 点赞是新 UI 里的本地状态（旧工程评论无点赞写接口，不造假接线）。
 * 评论项（含回复层级）渲染委托给同目录递归展示件 CommentNode，本容器只管数据与三态。
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
   * 分页账本放 ref（同旧 CommentHot 的 listInfo ref）：异步回调读最新值，
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

  /** 取下一页并追加（口径同旧 CommentHot.handleListLoadMore L44-54：loading/isEnd 挡重入，成功后页码 +1） */
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
        // 追加去重（同旧 L52 filterList([...旧, ...新])），不是替换
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
   * 动态高度 VirtualizedList 滚到底部时可能算不准某位置 offset（评论卡含回复线程，高度飘）。
   * 官方兜底：滚到 index 失败时回调，这里不做额外处理——让用户再滚一次就通了；
   * 真正根因已靠 initialNumToRender=15（首批全渲染，窗口不跨 item 边界）+ Sheet 底部补偿解决大部分场景。
   */
  const handleScrollToIndexFailed = useCallback((_info: {
    index: number
    highestMeasuredFrameIndex: number
    averageItemLength: number
  }) => {
    // no-op：让 VirtualizedList 自己恢复
  }, [])

  /**
   * 虚拟化行模型（2026-10-16 评论浮层 OOM 修复轮）：**一条根评论（含其整条回复线程）= 一行**。
   * 回复递归展开仍是 CommentNode 内部的事（bug-fix「评论浮窗」第 2 条的层级/缩进/竖线零变化）；
   * 五平台真实数据最深只有 2 级（根 + 一层回复数组），单行体量有界，
   * 不会出现「一条热评几百楼把一行撑成巨块」的失控——行回收粒度 = 热卡体量。
   * renderItem 依赖 likedIds：点赞变化只重建回调、由 CommentNode memo 挡住未变行的重渲染。
   */
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

  /**
   * 钉住区内容：.cmt-total 总数行（原型 #psMeta —— app.js L2075-2076 原话「总数与排序口径跟着
   * 标题一起钉住，不跟着评论列表滚」；钉住规则本体归 sheet chrome，styles.css L735-738）。
   * 外层 Fragment 让钉住模式自挂载起恒开：三态/换歌切换不来回换结构，头部不在「随滚/钉住」间跳变；
   * 无总数阶段槽内留空，sub 到状态行/首条的间距与旧版逐像素一致（衬距拆账在 Sheet.tsx pinnedZone）。
   */
  const pinnedTotal = (
    <>
      {phase === 'ready' && comments.length > 0 && (
        /* .cmt-total：总数 + 排序说明（原型还有一枚「乐评人长评」标签，真实接口无此口径，不造假） */
        <View style={styles.total}>
          <Text style={[styles.totalNum, { color: theme.colors.text }]}>
            {formatCount(total)}
          </Text>
          <QTag label={NEW_UI_SHEET_COMMENT.sortTag} />
        </View>
      )}
    </>
  )

  // 头部 cell：三态提示（.cmt-total 已上移钉住区）；随滚动进出、不回收（定长小内容）
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
   * 尾部 cell（旧 List.tsx L108-127 Footer 的等价物）。三档互斥、同一位置只出一行
   * （原型 paintComments 的 if / else 链，app.js L3228-L3236）：
   * - 列到热门评论尽头 → **全站共用收行 `PagingEnd`**（原型 `plEndRow(CMT_TXT.moreEnd, 'cmt-status')`，
   *   app.js L3230）：形状与居中跟着 `styles.css` 那条 `.pl-end` 共用规则走，文案仍是这一列自己那句
   *   「热门评论到此为止」（`const/sheet.ts` 的 moreEnd，一个字没改）。改前这一档是手搓的块级左对齐文字，
   *   而它上面两态本来就是居中的状态行——同一列尾巴一居中一靠左，本轮统一（todo-list 第 2 条）。
   * - 正在翻 / 上一页没翻到 → 状态行（失败可点重试），两句文案不变。
   * - 其余（idle）→ 什么都不摆，滚到底自己去取。
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

  // 失败态不绑触底：Sheet 的触底判定除了滚动，还会在内容尺寸变化等时机补判（首屏短内容靠它自动续页），
  // 若失败态也放行，「加载中」换成「没翻到」页脚高度一变就会自动再撞一次网——失败保持页脚点按重试。
  // 其余态（loading / ready）一律交给 handleLoadMore 内部闸门（phase / isLoading / isEnd）挡。
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
        // —— 虚拟化精细化参数（2026-10-29 末行半截修复）——
        // 每页 COMMENT_LIMIT=15 条，首批全渲染后一屏不会再出现"窗口边界上的半截"；
        // 动态高度列表（评论卡含回复线程）不适合 getItemLayout，靠 Sheet 底部补偿 + 这个兜底
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
  /** .cmt-total gap:8 / margin-bottom:2，b 19px/900 tabular */
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
  /** 分页状态行：居中 + 旧 footer 的 10px 内衬 */
  more: {
    padding: COMMENT.morePadding,
    alignItems: 'center',
  },
  moreText: {
    fontSize: FONT_SIZE.small,
    textAlign: 'center',
  },
})
