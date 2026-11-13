import { useCallback, useMemo, useRef, useState } from 'react'
import { StyleSheet, Text, type ListRenderItem } from 'react-native'

import { LIST_IDS, MUSIC_TOGGLE_MODE } from '@/config/constant'
import { LIST_LOAD_LIMIT } from '@/core/songlist'
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

/** .q-note（件 U21 持有该原子，styles.css L896：11 / text-3 / 行高 1.6）——与 MoreSheet、SourceSheet 同参数 */
const QueueNote = ({ text }: { text: string }) => {
  const theme = useTheme()
  return <Text style={[styles.note, { color: theme.colors.text3 }]}>{text}</Text>
}

/**
 * 正在播放页 · 播放列表面板（原型件 U80 parts/sheets/queue-sheet.{html,css}；
 * renderQueueSheet app.js L2760 + QUEUE_TXT L2741 + openQueueMore L1577 + paintQueueBtn L2783，行号取件头 parts/sheets/queue-sheet.html 原引）。
 *
 * 版面口径逐条照原型：
 * - **一条按播放顺序平铺的列**，不分段不分类——没有「现在 / 之后 / 之前」三段，
 *   也没有五种循环档各写的尾句说明；只有随机档多一句 .q-note（「这一列只是可能被抽到的」）。
 * - 正在播的那首不另造样式：用行内现成的 .song-row.playing 底色 + 歌名前的均衡条（SongRow 的 active/playing）。
 * - 这一列**不带榜单序号**（件里那条 `#psBody .song-row .rank{display:none}`，styles.css L847）——
 *   RN 侧就是不给 SongRow 传 rank，槽位根本不出现。
 * - 顶部只留一句「这次要播的一共 N 首 · 点一行就切过去听」；没有歌在放时整屏只剩空态一句。
 * - 不挂分页状态行（这一列是一次读全的清单，不是按需续取的水池）。
 * - **头部钉住、只有列表滚**（styles.css L839-841：`#playerSheet .sheet-body{display:flex;flex-direction:column;overflow:hidden}`
 *   + `#playerSheet .sheet-handle,#playerSheet .sheet-title,#playerSheet .sheet-sub,#psMeta{flex:none}`
 *   + `#psBody{flex:1;min-height:0;overflow-y:auto}`）。本屏钉住区就是 handle + 标题 + 副题三段：
 *   `#psMeta` 是这组的第四段，但它在 queue 实例里恒空（`openSheet()` L2694 先清空，只有评论实例
 *   L2832 往里写 `.cmt-total`），所以走 Sheet 的 `pinnedComponent` 传一个空 Fragment 占位——
 *   传了它 Sheet 才把 head 挪进钉住区，槽位本身在本屏没有内容。
 *
 * 数据（全部只读复用，见 hooks/usePlayQueue）：整份清单 = getList(playerListId)、当前位置 = 当前曲目 id、
 * 「下一曲播放」那几首 = tempPlayList；**重排只发生在显示层**，写回单子等于改用户歌单，绝对不做。
 *
 * 层级前提（件 U80 + U17 那条口径，styles.css L815-821：同级 .sheet 共用 z-index:80）：行内「⋯」要浮在本面板**之上**。
 * 原型靠 index.html 把 #moreSheet 排在 #playerSheet 之后拿到更高层级（同一个 z-index，写在后面的压上面）；
 * RN 侧同一件事 = 本组件把 <Sheet> 与 <MoreSheet> 作为兄弟节点按这个顺序挂：两者都是 Z_LAYER.sheet(80)
 * 的绝对铺满覆盖层，**后声明的在上**，Android 返回键也按「后挂载先响应」依次收（Sheet 自带这套能力，
 * 这里只是把两层的顺序摆对，没有另造层级）。所以这两层必须由本组件一起持有并成对声明。
 */
export const QueueSheet = ({ visible, onClose, bottomInset }: QueueSheetProps) => {
  const assertApiSupport = useApiSupport()
  const playing = useIsPlay()
  const togglePlayMethod = useSettingValue('player.togglePlayMethod')
  const { rows, hasSong, ownerNameOf } = usePlayQueue()

  /** 行内「⋯」的目标行（原型 openMore(s, queue, 'queue')）；null = 这一层没开 */
  const [moreRow, setMoreRow] = useState<NewUiPlayQueueRow | null>(null)
  // 退场动画期间留着最后一帧（与 MoreSheet 自身那条镜像规则同一口径）
  const lastRef = useRef<NewUiPlayQueueRow | null>(moreRow)
  if (moreRow != null) lastRef.current = moreRow
  const moreTarget = moreRow ?? lastRef.current

  /* ---- 动作：全部转发现有 core 函数，本层不写任何播放逻辑 ---- */

  /**
   * 听这一首（点这一行，或点行内第一项）= 既有 playListById(listId, id)
   * （core/player/player.ts L273，内部就带 clearTempPlayeList()——
   * 「切过去听之后这一次播放重新起算」与原型同一件事，不改它）。
   */
  const handlePlayRow = useCallback((row: NewUiPlayQueueRow) => {
    if (row.listId === '') return
    void playListById(row.listId, row.musicInfo.id)
      .then(() => { showNewUiToast(NEW_UI_SHEET_QUEUE.played(row.musicInfo.name)) })
      .catch(() => { showNewUiToast(NEW_UI_SHEET_QUEUE.playFailed) })
  }, [])

  /** 正在出声那一行唯一的一项：这首从头再放（原型 seekTo(0)；跳转走播放页现成的那条既有进度事件，不碰播放核心） */
  const handleAgain = useCallback(() => {
    if (moreTarget == null) return
    const title = moreTarget.musicInfo.name
    global.app_event.setProgress(0)
    setMoreRow(null)
    showNewUiToast(NEW_UI_SHEET_QUEUE.againTip(title))
  }, [moreTarget])

  /**
   * 下一曲播放（原型 nextRow L1566，全站只有这一条写法）。
   * 真实侧落点 = `addTempPlayList([{ listId, musicInfo, isTop: true }])`：isTop 那条把这首插到临时队首，
   * 播完即出（core/player/tempPlayList.ts L10、core/player/player.ts L412-416），不改持久单子、也不搬 playerPlayIndex。
   * **不能**走旧 UI 共用的 components/OnlineList/listAction.handlePlayLater（L21-27 不传 isTop，到不了队首），
   * 也绝不动那份共用逻辑本身；这一列的重排仍然只在显示层（见 usePlayQueue）。
   */
  const handleNext = useCallback(() => {
    if (moreTarget == null) return
    const title = moreTarget.musicInfo.name
    addTempPlayList([{ listId: moreTarget.listId, musicInfo: moreTarget.musicInfo, isTop: true }])
    setMoreRow(null)
    showNewUiToast(NEW_UI_SHEET_QUEUE.nextSet(title))
  }, [moreTarget])

  /**
   * 「移出」按此刻这一列是谁家的分两种文案（原型 L1605-1626 那段判据：一条含糊的"移出"有两种后果，
   * 宁可分两种文案，也不把它留成一个待拍板的问号）：
   * - 这一首是「下一曲播放」排进去的 → 摘掉那条暂存就是「这次不播这一首」
   * - 本机的一张单子（自建 / 内置「我喜欢」）→ 逐字复用歌单详情层那句「从「X」移出」，动的是本机那条歌目
   * - 起播时临时凑出来的一池（试听池 / 新 UI 播放暂存池）→ 「这次不播这一首」，动这池只影响这一次播放
   * - 落点取不到（没有 listId，或下载单——它不在这套歌目通道里）→ 不给这一行，不留一颗死按钮
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
    // 只有「这一行就挂在本机那张单子上」才谈移出那张单子；否则动的是这一次播放的那一池
    // 名字按这一行自己的落点问（ownerNameOf），不拿在播那一列的名字顶——移的是哪张单就说哪张单
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

  /**
   * 行模型：一条 = 一首歌（全站那一种 songRow，件 U29/U30 同一族），
   * 只是这一屏**不传 rank**（榜单序号在本屏被原型整条藏掉），「⋯」换成这一屏那几项。
   * 点一行就切过去听（顶部那句 sub 就是这条承诺）；不可播的行按原型 .off 压暗并明说来源未接入。
   */
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
   * 列表头部 cell（在 #psBody 内，随列表滚，不属于钉住区——原型原话两条都在 box=#psBody 上落）：
   * 空态一句（app.js L2768 `box.appendChild(el('div','empty-tip',…))`，没歌在放时 #psBody 里就只有它）；
   * 随机档那一句 .q-note 挂在列表头顶（app.js L2774，注释原话「挂在列表头顶，钉不钉住无所谓：
   * 它解释的是顺序，不是某一行的状态」）。这两段都留在滚动区内，本轮不上移。
   */
  const listHeader = useMemo(() => (
    <>
      {!hasSong && <EmptyTip text={NEW_UI_SHEET_QUEUE.noSong} />}
      {hasSong && togglePlayMethod === MUSIC_TOGGLE_MODE.random && <QueueNote text={NEW_UI_SHEET_QUEUE.random} />}
    </>
  ), [hasSong, togglePlayMethod])

  /**
   * 钉住区槽位（Sheet 的 pinnedComponent）：本屏恒空——它对应原型 `#psMeta`，
   * 而 #psMeta 只在评论实例里被写过（见组件头注）。传空 Fragment 而不是不传，是为了让钉住模式
   * 自挂载起恒开：有歌/空态/随机档来回切，头部都不在「随滚 / 钉住」两套结构间跳变
   * （与 CommentSheet 的 pinnedTotal 同一写法）。
   */
  const pinnedMeta = <></>

  /** 交给行内「⋯」那一份菜单（原型 scene='queue' 整份换掉菜单，不掺通用那几项） */
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
          // —— 虚拟化精细化参数（2026-10-29 末行半截修复）——
          // 首批 LIST_LOAD_LIMIT=30 行（歌单详情屏同档判例），播放列表不分页、整单在手也不会比这大；
          // 末行半截根因已靠 Sheet 组件统一的底部补偿 padding 解决，此处不再硬算 getItemLayout
          // （SongRow 是 flex 自适应高度，将来改尺寸也不会把精确 offset 弄坏）
          initialNumToRender: LIST_LOAD_LIMIT,
        }}
      />
      {/* 面板之上再叠行内「⋯」——必须排在上面那块之后（同 z-index，后声明者在上；返回键也先收它） */}
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
  /** `#psBody .song-list`（styles.css L848，件 U80 自己带的两条规则之一）：gap 4px / margin-top 12px。
   *  FlatList 没有 gap，行距落在每行的下边距上；12px 的列顶衬距落在首行的上边距上（随机档那句 .q-note
   *  本身无纵向 margin，styles.css L896，所以列顶这 12px 在两种形态下都是同一段距离） */
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
