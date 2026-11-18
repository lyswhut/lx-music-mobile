import { Fragment, useCallback } from 'react'
import { StyleSheet } from 'react-native'

// 直连 entry 而非 '@/newui/navigation' 桶口：避免 navigation/index → register → screens → 本文件的循环引用
import { pushNewUiSonglistDetail } from '@/newui/navigation/entry'

import {
  CardGrid,
  EmptyTip,
  FootNote,
  PageHeader,
  PagingEnd,
  PagingStatus,
  RankCard,
  RankGroupHead,
} from '@/newui/components'
import { getPlatformMeta, NEW_UI_PAGING_END_TEXT, NEW_UI_RANK_EMPTY, NEW_UI_RANK_FOOT_NOTE, NEW_UI_RANK_STATUS, NEW_UI_RANK_TITLES } from '@/newui/const'
import {
  useGridItemWidth,
  usePageEndReached,
  useRankBoards,
  type RankBoardCard,
} from '@/newui/hooks'
import { RANK_CARD } from '@/newui/theme'

import type { NewUiPageProps } from '../../types'

/**
 * 排行榜页（原型 #page-rank）容器：按平台分段的 2 列榜单卡网格 + 分批续取。
 * 数据来源：core/leaderboard.getBoardsList。**整平台全列**（第 7b 轮撤掉每平台截 6 张），
 * 一个平台手上有多少榜就列多少；页面按平台切成带组头的分段（.rank-group），
 * 首屏只露 8 张（RANK_PAGING.pageSize），滚到底由 usePageEndReached 通知这里续取下一批。
 * 分段落法：组头/状态行都是 width:'100%' 的 CardGrid 直接子项，在 flexWrap 里独占整行
 * —— 对应原型 .rank-group / .rank-grid>.pl-status 的 grid-column:1/-1，DOM 层级与 CSS 同款。
 * 卡的顺序与窗口都由 useRankBoards 决定：当前内容平台整段排最前，组内主打榜（热/新/飙）在前；
 * 平台身份除组头外仍写在每张卡的副行（getPlatformMeta label）。
 * 尾巴状态行（.pl-status 同款，重取在途配 RunningDots 获取动画）：手里还有未取的榜且「重取在途 / 有平台目录失败」才出现；
 * 本地推进显示窗口是同步的、无假延时，正常续取时这一行根本不会被看见。
 * 全部露出且没有失败平台时，网格尾收上共通终点行 PagingEnd「没有更多了」（原型 L565 plEndRow）。
 * 点卡 = 按原型正线打开新 UI 详情层的榜单形态（app.js rankCard card.onclick = openPlaylist(c, 'rank')）：
 * info 只带榜单目录里的真实字段（id / source / name），img / desc / play_count 目录里没有就留空，
 * 封面按空走 Art 的程序化底，不造数据；取数、整榜播放与收藏全部由详情屏 rank 分支
 * 只读复用 core/leaderboard 与旧 Leaderboard/listAction，本页不再直接播歌。
 */
export const RankPage = ({ componentId }: NewUiPageProps) => {
  const ranks = useRankBoards()
  const cardWidth = useGridItemWidth()

  const handlePress = useCallback((board: RankBoardCard) => {
    pushNewUiSonglistDetail(componentId, {
      id: board.id,
      source: board.source,
      name: board.name,
      author: '',
    }, 'rank', 'rank')
  }, [componentId])

  // 触底续取：距底判定在主屏 PageViewport（160px 触发线），这里只接「该取下一批了」的信号。
  // 重取在途时由 hook 内部拦住，这里不重复判。
  usePageEndReached(ranks.loadNextBatch)

  const showGrid = !ranks.loading && ranks.groups.length > 0
  // 原型 paintRankGrid L563：shown < charts.length && (loading || failed) 才挂状态行；
  // RN 的「还有未显示」= 窗口没到底 ∪ 有平台目录没取回（它们手里可能还有榜）；
  // 正在获取标识（2026-10-15 换动画）：disabled（重取在途）那句配 RunningDots 三点接力跳动，retry 裸文字可点
  const showStatus =
    (ranks.hasMore || ranks.batchFailed) && (ranks.batchLoading || ranks.batchFailed)
  // 原型 L565 else-if 分支：窗口全露出且没有没取回的平台时，网格尾收上「没有更多了」
  const showEnd = !ranks.hasMore && !ranks.batchFailed && !ranks.batchLoading && !ranks.loading

  return (
    <>
      <PageHeader title={NEW_UI_RANK_TITLES.page} />

      {showGrid ? (
        <CardGrid style={styles.grid}>
          {ranks.groups.map((group, index) => (
            <Fragment key={group.source}>
              <RankGroupHead
                first={index === 0}
                label={getPlatformMeta(group.source).label}
                total={group.total}
              />
              {group.cards.map(board => (
                <RankCard
                  key={board.id}
                  width={cardWidth}
                  name={board.name}
                  // 原型副行只有平台全称（「首数 / 更新频率」原型也已撤，不造假字段）
                  sub={getPlatformMeta(board.source).label}
                  coverKey={board.coverKey}
                  onPress={() => handlePress(board)}
                />
              ))}
            </Fragment>
          ))}
          {showStatus ? (
            <PagingStatus
              disabled={ranks.batchLoading}
              loading={ranks.batchLoading}
              text={ranks.batchLoading ? NEW_UI_RANK_STATUS.loading : NEW_UI_RANK_STATUS.retry}
              onPress={ranks.loadMore}
            />
          ) : null}
          {showEnd ? <PagingEnd inGrid text={NEW_UI_PAGING_END_TEXT} /> : null}
        </CardGrid>
      ) : (
        <EmptyTip
          text={ranks.loading
            ? NEW_UI_RANK_EMPTY.loading
            : ranks.error ?? NEW_UI_RANK_EMPTY.noBoards}
        />
      )}

      <FootNote text={NEW_UI_RANK_FOOT_NOTE} />
    </>
  )
}

const styles = StyleSheet.create({
  /** .rank-grid margin-top:18px */
  grid: {
    marginTop: RANK_CARD.gridMarginTop,
  },
})

RankPage.displayName = 'NewUIRankPage'
