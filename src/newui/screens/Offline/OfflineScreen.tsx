import { useCallback, useEffect, useMemo } from 'react'
import { BackHandler, FlatList, StyleSheet, Text, View } from 'react-native'
import { Navigation } from 'react-native-navigation'

import { EmptyTip } from '@/newui/components/EmptyTip'
import { GhostButton } from '@/newui/components/GhostButton'
import { MinibarHost } from '@/newui/components/Minibar'
import { PlTop } from '@/newui/components/PlTop'
import { SongRow } from '@/newui/components/SongRow'
import { NEW_UI_OFFLINE, QUALITY_LABEL } from '@/newui/const'
import { LIST_LOAD_LIMIT } from '@/core/songlist'
import {
  useMyPlaylists,
  useNewUiSystemBar,
  useNowPlaying,
  useOfflineCache,
  useSafeArea,
  useWideLayout,
  type OfflineRow,
} from '@/newui/hooks'
// 直连 entry 而非 '@/newui/navigation' 桶口：避免 navigation/index → register → screens → 本文件的循环引用
import { pushNewUiPlayer } from '@/newui/navigation/entry'
import { OFFLINE, PL_LAYER, useTheme } from '@/newui/theme'
import { playQueue, toSongDisplay } from '@/newui/utils'

export interface OfflineScreenProps {
  componentId: string
}

/**
 * 「已缓存」（离线收听）屏 —— U86，件 `parts/mine/offline.{html,css}`；
 * 装配逻辑 app.js L1351-1451（OFF_EMPTY / OFF_LEDE / offlineKnownSongs / cachedQuality /
 * offlineRows / offlineQueue / offRow / offlinePlayAll / renderOffline）。
 *
 * **滚动结构（照 #radioLayer 判例）**：`#offlineLayer{padding:0;overflow:hidden}` → 固定段
 * `.pl-head{padding:58px 16px 0}`（顶排 .pl-top + 口径段 .off-meta + 操作行 .pl-actions）
 * → 滚动段**就是 `.off-list` 自己**（`flex:1;padding:10px 16px 34px;gap:2px`）。
 * RN 落法：屏根 `View{flex:1}` → 钉住段 `View{flex:none}` → `FlatList{flex:1}`。
 * 这一屏**不分页**：清单是有限集，一次铺完，没有 .pl-status / 没有触底续取 / 没有页脚。
 *
 * 清单不是接口给的：候选池 = 本机已知道的歌（收藏 ∪ 最近播放 ∪ 各份歌单），逐首过
 * 「musicUrl 映射键存在 + isCached 验字节」两关——全部在 hooks/useOfflineCache 里完成，
 * 本屏只渲染那份结果、把整列交给播放器（纯 UI 层，不写存储、不改列表）。
 * 行是 .song-row 原子族的自造变体：**没有序号**（存储键枚举的顺序说不清，不编排序）、
 * **不挂「⋯」**（这一屏只有"听"一个意图）、**不标灰**（存下即现在能播）；
 * 行内 q-tag 换了语义——读「存在哪一档」，不是「这次会按哪档播」。
 */
export const OfflineScreen = ({ componentId }: OfflineScreenProps) => {
  const theme = useTheme()
  const { top, bottom } = useSafeArea()
  const { wide, layerPaddingX } = useWideLayout()
  useNewUiSystemBar(componentId)

  const myLists = useMyPlaylists()
  const offline = useOfflineCache(myLists)
  const nowPlaying = useNowPlaying()

  const { rows, totalMb, scanning } = offline

  const goBack = useCallback(() => {
    void Navigation.pop(componentId)
  }, [componentId])

  // 硬件返回键与头部那颗同一条出口（原型「一次只收最上面那一层」，index.html L748）；
  // 写法照 SonglistDetailScreen / RadioHomeScreen 的右推层判例。
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack()
      return true
    })
    return () => { subscription.remove() }
  }, [goBack])

  /** 交给播放器的那一列：存在本机即现在能播，整列都给（原型 offlineQueue，app.js L1385） */
  const queue = useMemo(() => rows.map(row => row.song), [rows])

  const handleRowPress = useCallback((index: number) => {
    void playQueue('offline', queue, index)
  }, [queue])

  // 「播放全部」= 整列交给播放器并打开播放页（原型 offlinePlayAll L1420：play + openLayer(player())）
  const handlePlayAll = useCallback(() => {
    void playQueue('offline', queue, 0).then((ok) => {
      if (ok) pushNewUiPlayer(componentId)
    })
  }, [componentId, queue])

  const renderItem = useCallback(({ item, index }: { item: OfflineRow, index: number }) => {
    const active = nowPlaying.id === item.song.id
    return (
      <SongRow
        {...toSongDisplay(item.song, true)}
        // 同一枚 q-tag，这一屏读「存在哪一档」（原型 offRow L1392）
        qualityLabel={QUALITY_LABEL[item.quality]}
        musicInfo={item.song}
        active={active}
        playing={active && nowPlaying.playing}
        onPress={() => { handleRowPress(index) }}
      />
    )
  }, [handleRowPress, nowPlaying.id, nowPlaying.playing])

  const keyExtractor = useCallback((item: OfflineRow) => item.song.id, [])

  /**
   * 钉住段的内衬：`.pl-head{padding:58px 16px 0}`，58 含模拟状态栏 → 真机 = 实测状态栏 + 6。
   * 宽屏档换成 `.wide .pl-head{padding:36px max(16px,calc((100% - 620px)/2)) 0}`（styles.css:1337）：
   * 顶内衬回正到这一档 32 状态栏之上的 4，左右吃那根 620 居中轴算出来的内衬；
   * compact 两侧都回竖屏基线（写法照 RadioHomeScreen 同一判据入口），逐值零变化。
   */
  const headStyle = useMemo(() => ({
    paddingTop: top + (wide?.statusReserve ?? PL_LAYER.paddingTopReserve),
    paddingHorizontal: layerPaddingX ?? PL_LAYER.paddingX,
  }), [top, wide, layerPaddingX])

  /**
   * 滚动段自己的内衬（`#offlineLayer>.off-list{padding:10px 16px 34px}`），底部补真机安全区。
   * 左右同一根轴：`.wide #offlineLayer>.off-list{padding-left/right:max(16px,calc((100% - 620px)/2))}`
   * （styles.css:1338），竖向两位（10 / 34）这一档原型不动，继续吃基线。
   */
  const listContentStyle = useMemo(() => ({
    paddingTop: OFFLINE.listPaddingTop,
    paddingHorizontal: layerPaddingX ?? OFFLINE.listPaddingX,
    paddingBottom: OFFLINE.listPaddingBottom + bottom,
    gap: OFFLINE.listGap,
  }), [bottom, layerPaddingX])

  // 空态只在数完之后出现：还在数的时候先报「正在数…」，不先说「还没有存下的歌」
  const listEmpty = useMemo(
    () => (scanning ? null : <EmptyTip variant="layer" text={NEW_UI_OFFLINE.empty} />),
    [scanning],
  )

  return (
    <View nativeID="newui.offline.content" style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      {/* ▸ 钉住段（.pl-head）：顶排 + 口径段 + 操作行，三段都不滚 */}
      <View style={[styles.pinned, headStyle]}>
        <PlTop
          crumbText={NEW_UI_OFFLINE.crumb}
          backLabel={NEW_UI_OFFLINE.back}
          onBack={goBack}
          right={{ kind: 'none' }}
        />

        {/* .off-meta{margin:18px 0 0;gap:5px}：计数 + 口径句（口径句恒在） */}
        <View style={styles.meta}>
          {scanning
            ? (
              /* 真机在数本机存储键，过程句按口径句同一档字排，留在同一格里不跳版 */
              <Text style={[styles.lede, { color: theme.colors.text2 }]}>
                {NEW_UI_OFFLINE.scanning}
              </Text>
              )
            : rows.length > 0
              ? (
                <Text style={[styles.count, { color: theme.colors.text }]}>
                  {NEW_UI_OFFLINE.count(rows.length, totalMb)}
                </Text>
                )
              : null}
          <Text style={[styles.lede, { color: theme.colors.text2 }]}>
            {NEW_UI_OFFLINE.lede}
          </Text>
        </View>

        {/* .pl-actions margin:18px 0 16px：空的时候没有按钮可点，整行撤掉（与「清空记录」随空态隐藏同一判据） */}
        {!scanning && rows.length > 0 && (
          <View style={styles.actions}>
            <GhostButton
              solid
              icon="play"
              label={NEW_UI_OFFLINE.playAll(rows.length)}
              onPress={handlePlayAll}
            />
          </View>
        )}
      </View>

      {/* ▸ 滚动段：.off-list 自己就是这一屏唯一的轴，行距 2px 落在容器上 */}
      <FlatList
        style={styles.list}
        data={rows}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={listEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={listContentStyle}
        // —— 虚拟化精细化参数（2026-11-05，同根因：RN 默认 initialNumToRender=10，10 行 × 46px = 460px 铺不满屏）——
        // 已缓存屏不分页、整单一次性到位，LIST_LOAD_LIMIT=30 首批 mount 30 行 × 46px = 1380px 足够覆盖任何设备一屏；
        // maxToRenderPerBatch=14 / windowSize=7 与 SonglistDetailScreen 判例同档，滚动补渲染速度与窗口余量平衡
        initialNumToRender={LIST_LOAD_LIMIT}
        maxToRenderPerBatch={14}
        windowSize={7}
      />
      {/* 常驻迷你播放条：本层默认磁吸圆点（原型 miniPageSnapped：不在首页就是圆点）。
          挂在轴之后、屏幕根层最后——圆点浮在列表内容之上 */}
      <MinibarHost componentId={componentId} bottomInset={bottom} defaultSnapped />
    </View>
  )
}

OfflineScreen.displayName = 'NewUiOfflineScreen'

const styles = StyleSheet.create({
  /** #offlineLayer{padding:0;overflow:hidden} → RN 屏根就是「不滚的壳」 */
  root: {
    flex: 1,
    padding: 0,
    overflow: 'hidden',
  },
  /** .pl-head{flex:none}（内衬由 headStyle 在渲染期给，安全区随设备变） */
  pinned: {
    flexGrow: 0,
    flexShrink: 0,
  },
  /** .off-meta{margin:18px 0 0;gap:5px} */
  meta: {
    marginTop: OFFLINE.metaMarginTop,
    gap: OFFLINE.metaGap,
  },
  /** .off-n{font-size:15px;font-weight:900;letter-spacing:.2px;tabular-nums} */
  count: {
    fontSize: OFFLINE.countSize,
    fontWeight: OFFLINE.countWeight,
    letterSpacing: OFFLINE.countLetterSpacing,
    fontVariant: ['tabular-nums'],
  },
  /** .off-lede{font-size:11.5px;line-height:1.6;color:var(--text-2)} */
  lede: {
    fontSize: OFFLINE.ledeSize,
    lineHeight: OFFLINE.ledeSize * OFFLINE.ledeLineHeightRatio,
  },
  /** .pl-actions{margin:18px 0 16px}（这颗钮独占一行，不套 PlActions：这一屏只有「播放全部」一个动作） */
  actions: {
    marginTop: PL_LAYER.actionsMarginTop,
    marginBottom: PL_LAYER.actionsMarginBottom,
  },
  /** #offlineLayer>.off-list{flex:1} = 本屏唯一的轴 */
  list: {
    flex: 1,
  },
})
