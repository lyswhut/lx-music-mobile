import { useCallback, useEffect, useMemo } from 'react'
import { BackHandler, StyleSheet, Text, View } from 'react-native'
import { Navigation } from 'react-native-navigation'

import { EmptyTip } from '@/newui/components/EmptyTip'
import { FixedWindowList } from '@/newui/components/FixedWindowList/FixedWindowList'
import { GhostButton } from '@/newui/components/GhostButton'
import { PlTop } from '@/newui/components/PlTop'
import { SongRow } from '@/newui/components/SongRow'
import { NEW_UI_OFFLINE, QUALITY_LABEL } from '@/newui/const'
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
import { OFFLINE, PL_LAYER, SONG_ROW, useTheme } from '@/newui/theme'
import { playQueue, toSongDisplay } from '@/newui/utils'

/** OfflineScreen 歌曲行行高：SongRow regular 档内容高（paddingY×2 + artSize 46 + 上下 1px 透明描边 = 62） */
const OFFLINE_ROW_HEIGHT = SONG_ROW.paddingY * 2 + SONG_ROW.artSize + 2
const OFFLINE_ROW_GAP = SONG_ROW.listGap

export interface OfflineScreenProps {
  componentId: string
}

/**
 * 「已缓存」（离线收听）屏：顶排 + 口径段 + 操作行钉住，清单本身是唯一的滚动轴。
 * 这一屏不分页，一次铺完；清单由 hooks/useOfflineCache 算出（收藏 ∪ 最近播放 ∪ 各份歌单中已缓存者），
 * 本屏只渲染、把整列交给播放器。行内 q-tag 读「存在哪一档」，不是「这次按哪档播」。
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

  // 硬件返回键与头部返回同一条出口（一次只收最上面那一层）
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack()
      return true
    })
    return () => { subscription.remove() }
  }, [goBack])

  /** 交给播放器的那一列：存在本机即能播，整列都给 */
  const queue = useMemo(() => rows.map(row => row.song), [rows])

  const handleRowPress = useCallback((index: number) => {
    void playQueue('offline', queue, index)
  }, [queue])

  // 「播放全部」= 整列交给播放器并打开播放页
  const handlePlayAll = useCallback(() => {
    void playQueue('offline', queue, 0).then((ok) => {
      if (ok) pushNewUiPlayer(componentId)
    })
  }, [componentId, queue])

  const renderItem = useCallback((item: OfflineRow, index: number) => {
    const active = nowPlaying.id === item.song.id
    return (
      <SongRow
        {...toSongDisplay(item.song, true)}
        // 同一枚 q-tag，这一屏读「存在哪一档」
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
   * 钉住段的内衬：paddingTop = 状态栏 + 预留；
   * 宽屏档左右吃 620 居中轴算出的内衬。
   */
  const headStyle = useMemo(() => ({
    paddingTop: top + (wide?.statusReserve ?? PL_LAYER.paddingTopReserve),
    paddingHorizontal: layerPaddingX ?? PL_LAYER.paddingX,
  }), [top, wide, layerPaddingX])

  /** 滚动段内衬：左右同 620 居中轴，底部补安全区 */
  const listContentStyle = useMemo(() => ({
    paddingTop: OFFLINE.listPaddingTop,
    paddingHorizontal: layerPaddingX ?? OFFLINE.listPaddingX,
    paddingBottom: OFFLINE.listPaddingBottom + bottom,
  }), [bottom, layerPaddingX])

  // 空态只在数完之后出现：还在数的时候先报「正在数…」，不先说「还没有存下的歌」
  const listEmpty = useMemo(
    () => (scanning ? null : <EmptyTip variant="layer" text={NEW_UI_OFFLINE.empty} />),
    [scanning],
  )

  return (
    <View nativeID="newui.offline.content" style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      {/* 钉住段：顶排 + 口径段 + 操作行，都不滚 */}
      <View style={[styles.pinned, headStyle]}>
        <PlTop
          crumbText={NEW_UI_OFFLINE.crumb}
          backLabel={NEW_UI_OFFLINE.back}
          onBack={goBack}
          right={{ kind: 'none' }}
        />

        {/* 计数 + 口径句（口径句恒在） */}
        <View style={styles.meta}>
          {scanning
            ? (
              /* 还在数的时候用与口径句同档的字，留在同一格不跳版 */
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

        {/* 操作行：空态时整行撤掉 */}
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

      {/* 滚动段：本屏唯一的轴，行距落在容器上 */}
      <FixedWindowList
        style={styles.list}
        data={rows}
        rowHeight={OFFLINE_ROW_HEIGHT}
        rowGap={OFFLINE_ROW_GAP}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={listEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={listContentStyle}
      />
    </View>
  )
}

OfflineScreen.displayName = 'NewUiOfflineScreen'

const styles = StyleSheet.create({
  /** 屏根：不滚的壳 */
  root: {
    flex: 1,
    padding: 0,
    overflow: 'hidden',
  },
  /** 钉住段：不参与滚动（内衬由 headStyle 在渲染期给） */
  pinned: {
    flexGrow: 0,
    flexShrink: 0,
  },
  /** 计数 + 口径段 */
  meta: {
    marginTop: OFFLINE.metaMarginTop,
    gap: OFFLINE.metaGap,
  },
  /** 曲目数 */
  count: {
    fontSize: OFFLINE.countSize,
    fontWeight: OFFLINE.countWeight,
    letterSpacing: OFFLINE.countLetterSpacing,
    fontVariant: ['tabular-nums'],
  },
  /** 口径句 */
  lede: {
    fontSize: OFFLINE.ledeSize,
    lineHeight: OFFLINE.ledeSize * OFFLINE.ledeLineHeightRatio,
  },
  /** 操作行（这一屏只有「播放全部」一个动作） */
  actions: {
    marginTop: PL_LAYER.actionsMarginTop,
    marginBottom: PL_LAYER.actionsMarginBottom,
  },
  /** 本屏唯一的滚动轴 */
  list: {
    flex: 1,
  },
})
