import { useCallback, useMemo, useRef, useState } from 'react'
import { StyleSheet, Text, type ListRenderItem } from 'react-native'

import { LIST_IDS, MUSIC_TOGGLE_MODE } from '@/config/constant'
import { removeListMusics } from '@/core/list'
import { playListById } from '@/core/player/player'
import { addTempPlayList, removeTempPlayList } from '@/core/player/tempPlayList'
import { useIsPlay } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'

import { EmptyTip, Sheet, SongRow } from '@/newui/components'
import {
  NEW_UI_SEARCH_UNPLAYABLE_TOAST,
  NEW_UI_SHEET_MORE,
  NEW_UI_SHEET_QUEUE,
} from '@/newui/const'
import { useApiSupport, usePlayQueue, type NewUiPlayQueueRow } from '@/newui/hooks'
import { MoreSheet } from '@/newui/screens/Main/sheets'
import { FONT_SIZE, SONG_ROW, useTheme } from '@/newui/theme'
import { showNewUiToast, toSongDisplay } from '@/newui/utils'

export interface QueueSheetProps {
  visible: boolean
  onClose: () => void
  /** 底部安全区（透传给 Sheet） */
  bottomInset?: number
}

/** 说明行（与 MoreSheet / SourceSheet 同参数） */
const QueueNote = ({ text }: { text: string }) => {
  const theme = useTheme()
  return <Text style={[styles.note, { color: theme.colors.text3 }]}>{text}</Text>
}

/**
 * 正在播放页 · 播放列表面板。
 *
 * - 一条按播放顺序平铺的列，不分段；正在播的那首用 song-row.playing 底色 + 均衡条；不带序号。
 * - 头部钉住、只有列表滚；pinnedComponent 传空 Fragment 让钉住模式恒开。
 * - 行内「⋯」的 MoreSheet 必须与本面板同层、排在其后（同 z-index 后声明者在上，返回键先收它）。
 *
 * 数据全部只读复用（usePlayQueue）：重排只发生在显示层，不写回用户歌单。
 */
export const QueueSheet = ({ visible, onClose, bottomInset }: QueueSheetProps) => {
  const assertApiSupport = useApiSupport()
  const playing = useIsPlay()
  const togglePlayMethod = useSettingValue('player.togglePlayMethod')
  const { rows, hasSong, ownerNameOf } = usePlayQueue()

  /** 行内「⋯」的目标行；null = 这一层没开 */
  const [moreRow, setMoreRow] = useState<NewUiPlayQueueRow | null>(null)
  // 退场动画期间留着最后一帧（与 MoreSheet 自身那条镜像规则同一口径）
  const lastRef = useRef<NewUiPlayQueueRow | null>(moreRow)
  if (moreRow != null) lastRef.current = moreRow
  const moreTarget = moreRow ?? lastRef.current

  /* ---- 动作：全部转发现有 core 函数，本层不写任何播放逻辑 ---- */

  /** 点这一行 = playListById，内部会清临时队列后重新起算 */
  const handlePlayRow = useCallback((row: NewUiPlayQueueRow) => {
    if (row.listId === '') return
    void playListById(row.listId, row.musicInfo.id)
      .then(() => { showNewUiToast(NEW_UI_SHEET_QUEUE.played(row.musicInfo.name)) })
      .catch(() => { showNewUiToast(NEW_UI_SHEET_QUEUE.playFailed) })
  }, [])

  /** 正在出声那一行：从头再放（走既有进度事件，不碰播放核心） */
  const handleAgain = useCallback(() => {
    if (moreTarget == null) return
    const title = moreTarget.musicInfo.name
    global.app_event.setProgress(0)
    setMoreRow(null)
    showNewUiToast(NEW_UI_SHEET_QUEUE.againTip(title))
  }, [moreTarget])

  /**
   * 下一曲播放：addTempPlayList 带 isTop 插到临时队首，播完即出，不改持久单子、不搬 playerPlayIndex。
   */
  const handleNext = useCallback(() => {
    if (moreTarget == null) return
    const title = moreTarget.musicInfo.name
    addTempPlayList([{ listId: moreTarget.listId, musicInfo: moreTarget.musicInfo, isTop: true }])
    setMoreRow(null)
    showNewUiToast(NEW_UI_SHEET_QUEUE.nextSet(title))
  }, [moreTarget])

  /**
   * 「移出」按落点分两种文案：临时队列 → 「这次不播这一首」；本机单子 → 「从「X」移出」。
   * 落点取不到（无 listId 或下载单）→ 不给这一行，不留死按钮。
   */
  const handleRemove = useCallback(() => {
    if (moreTarget == null) return
    const title = moreTarget.musicInfo.name
    if (moreTarget.tempIndex >= 0) {
      removeTempPlayList(moreTarget.tempIndex)
      setMoreRow(null)
      showNewUiToast(NEW_UI_SHEET_QUEUE.skipped(title))
      return
    }
    if (moreTarget.listId === '' || moreTarget.listId === LIST_IDS.DOWNLOAD) return
    // 只有「这一行挂在本机那张单子上」才谈移出那张单子，否则动的是这一次播放的那一池
    // 名字按这一行自己的落点问（ownerNameOf），不拿在播那一列的名字顶
    const ownedName = ownerNameOf(moreTarget.listId)
    void removeListMusics(moreTarget.listId, [moreTarget.musicInfo.id])
      .then(() => {
        setMoreRow(null)
        showNewUiToast(ownedName != null
          ? NEW_UI_SHEET_MORE.listRemoved(ownedName, title)
          : NEW_UI_SHEET_QUEUE.skipped(title))
      })
      .catch(() => { showNewUiToast(NEW_UI_SHEET_MORE.listRemoveFailed) })
  }, [moreTarget, ownerNameOf])

  /** 本行的「移出」怎么写（文案与给不给这一行） */
  const removeOf = useCallback((row: NewUiPlayQueueRow) => {
    if (row.tempIndex >= 0) return { label: NEW_UI_SHEET_QUEUE.skip, onPress: handleRemove }
    if (row.listId === '' || row.listId === LIST_IDS.DOWNLOAD) return undefined
    const ownedName = ownerNameOf(row.listId)
    return {
      label: ownedName != null ? NEW_UI_SHEET_MORE.removeFromList(ownedName) : NEW_UI_SHEET_QUEUE.skip,
      onPress: handleRemove,
    }
  }, [handleRemove, ownerNameOf])

  const openMore = useCallback((row: NewUiPlayQueueRow) => { setMoreRow(row) }, [])
  const closeMore = useCallback(() => { setMoreRow(null) }, [])

  /** 一条 = 一首歌；本屏不传 rank，不可播行压暗并提示 */
  const renderItem = useCallback<ListRenderItem<NewUiPlayQueueRow>>(
    ({ item, index }) => {
      const playable = item.musicInfo.source === 'local' || assertApiSupport(item.musicInfo.source)
      const display = toSongDisplay(item.musicInfo, playable)
      return (
        <SongRow
          style={[index === 0 ? styles.rowFirst : null, styles.row]}
          artSeed={display.artSeed}
          artUri={display.artUri}
          musicInfo={item.musicInfo}
          title={display.title}
          sourceLabel={display.sourceLabel}
          sourceTint={display.sourceTint}
          artist={display.artist}
          album={display.album}
          qualityLabel={display.qualityLabel}
          durationText={display.durationText}
          active={item.isCurrent}
          playing={item.isCurrent && playing}
          dimmed={!playable}
          onPress={() => {
            if (!playable) {
              showNewUiToast(NEW_UI_SEARCH_UNPLAYABLE_TOAST)
              return
            }
            handlePlayRow(item)
          }}
          onMore={() => { openMore(item) }}
        />
      )
    },
    [assertApiSupport, handlePlayRow, openMore, playing],
  )
  const keyExtractor = useCallback((item: NewUiPlayQueueRow) => item.key, [])

  /**
   * 列表头部：空态一句；随机档挂一句说明（留在滚动区，不钉住）。
   */
  const listHeader = useMemo(() => (
    <>
      {!hasSong && <EmptyTip text={NEW_UI_SHEET_QUEUE.noSong} />}
      {hasSong && togglePlayMethod === MUSIC_TOGGLE_MODE.random && <QueueNote text={NEW_UI_SHEET_QUEUE.random} />}
    </>
  ), [hasSong, togglePlayMethod])

  /** 钉住区槽位恒空：传空 Fragment 让钉住模式自挂载起恒开，头部不在两套结构间跳变 */
  const pinnedMeta = <></>

  /** 交给行内「⋯」的菜单 */
  const queueActions = moreTarget != null ? {
    isCurrent: moreTarget.isCurrent,
    onAgain: handleAgain,
    onPlay: () => { handlePlayRow(moreTarget); setMoreRow(null) },
    onNext: handleNext,
    remove: removeOf(moreTarget),
  } : undefined

  return (
    <>
      <Sheet
        visible={visible}
        title={NEW_UI_SHEET_QUEUE.title}
        subtitle={hasSong ? NEW_UI_SHEET_QUEUE.sub(rows.length) : undefined}
        onClose={onClose}
        bottomInset={bottomInset}
        list={{
          data: rows,
          renderItem,
          keyExtractor,
          headerComponent: listHeader,
          pinnedComponent: pinnedMeta,
          // SongRow regular 档 + queueListGap(4)：paddingY×2(14) + artSize(46) + queueListGap(4) = 64
          getItemLayout: (_data, index) => ({
            length: SONG_ROW.paddingY * 2 + SONG_ROW.artSize + SONG_ROW.queueListGap,
            offset: (SONG_ROW.paddingY * 2 + SONG_ROW.artSize + SONG_ROW.queueListGap) * index,
            index,
          }),
          initialNumToRender: 12,
        }}
      />
      {/* 行内「⋯」叠在面板之上：同 z-index，后声明者在上 */}
      <MoreSheet
        visible={visible && moreRow != null}
        musicInfo={moreTarget?.musicInfo ?? null}
        scene="queue"
        queueActions={queueActions}
        onClose={closeMore}
        bottomInset={bottomInset}
      />
    </>
  )
}

QueueSheet.displayName = 'NewUIQueueSheet'

const styles = StyleSheet.create({
  /** 行距落在每行下边距；列顶衬距落在首行上边距 */
  row: {
    marginBottom: SONG_ROW.queueListGap,
  },
  rowFirst: {
    marginTop: SONG_ROW.queueListMarginTop,
  },
  note: {
    fontSize: FONT_SIZE.caption,
    lineHeight: 18,
  },
})
