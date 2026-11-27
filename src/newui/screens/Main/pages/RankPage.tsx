import { Fragment, useCallback } from 'react'
import { StyleSheet } from 'react-native'

// 直连 entry 而非 '@/newui/navigation' 桶口：避免 navigation/index → register → screens → 本文件的循环引用
import { pushNewUiSonglistDetail } from '@/newui/navigation/entry'

import {
  CardGrid,
  EmptyTip,
  PagingEnd,
  PagingStatus,
  RankCard,
  RankGroupHead,
} from '@/newui/components'
import { getPlatformMeta, NEW_UI_PAGING_END_TEXT, NEW_UI_RANK_EMPTY, NEW_UI_RANK_STATUS } from '@/newui/const'
import {
  useGridItemWidth,
  usePageEndReached,
  useRankBoards,
  type RankBoardCard,
} from '@/newui/hooks'
import { RANK_CARD } from '@/newui/theme'

import type { NewUiPageProps } from '../../types'

/**
 * 排行榜页容器：按平台分段的榜单卡网格（竖屏 3 列）+ 分批续取。
 * 数据来自 core/leaderboard.getBoardsList，整平台全列；首屏 8 张，滚到底经 usePageEndReached 续取。
 * 组头 / 状态行在 flexWrap 里独占整行；点卡打开详情层的榜单形态，本页不直接播歌。
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

  // 触底续取：距底判定在主屏 PageViewport，这里只接信号；在途由 hook 内部拦住
  usePageEndReached(ranks.loadNextBatch)

  const showGrid = !ranks.loading && ranks.groups.length > 0
  // 状态行只在「窗口没到底或有平台目录没取回」且在途 / 失败时露出；
  // 在途那句配 RunningDots 动画，retry 裸文字可点
  const showStatus =
    (ranks.hasMore || ranks.batchFailed) && (ranks.batchLoading || ranks.batchFailed)
  // 窗口全露出且无失败平台时，网格尾收上「没有更多了」
  const showEnd = !ranks.hasMore && !ranks.batchFailed && !ranks.batchLoading && !ranks.loading

  return (
    <>
      {/* 内容直接从平台分组起 */}
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
                  // 副行只有平台全称，不造假字段
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
    </>
  )
}

const styles = StyleSheet.create({
  /** 网格上间距 */
  grid: {
    marginTop: RANK_CARD.gridMarginTop,
  },
})

RankPage.displayName = 'NewUIRankPage'
