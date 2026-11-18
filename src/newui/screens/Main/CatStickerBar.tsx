import { useCallback } from 'react'
import { StyleSheet, View } from 'react-native'

import { ChipRow } from '@/newui/components'
import {
  selectPlaylistTag,
  usePlaylistCategories,
  usePlaylistChipItems,
  usePlaylistTagSelection,
  useWideLayout,
} from '@/newui/hooks'
import { LAYOUT, useTheme } from '@/newui/theme'
import { NEW_UI_PLAYLIST_TITLES } from '@/newui/const'

export interface CatStickerBarProps {
  /** 状态栏高度（吸顶层要让开顶栏：原型 .cat-row sticky top:0 的基准是顶栏下沿） */
  topInset: number
  onOpenPlTagsSheet: () => void
}

/**
 * 歌单页分类条吸顶层（QA 2026-10-14 D-06，原型 .cat-row position:sticky，styles.css L359-366）。
 * 主屏挂在 PageViewport 之后、TopBar 之前：TopBar（更高 JSX 序）压在它预留的
 * topbar 高度空档上，视觉即「分类条贴住顶栏下沿」。
 * 显隐由父层按滚动位置驱动（本组件存活 = 可见），非歌单页/未越线时整棵不挂载，
 * 分类数据 hook 实例也随之省掉（getTags 自带缓存，重进不重取网络）。
 * 数据与页面原位分类条同源：分类目录 = usePlaylistCategories（两处实例同读 getTags 缓存），
 * 选中态 = playlistTagSelection 模块级共享 store（chip 行/浮层/吸顶层三处天然同步）。
 * 已知降级（如实记录）：原型吸顶背景是「底色渐变 94%→70% + backdrop blur(20) saturate(170)」，
 * 本项目无 blur/渐变依赖，降级为不透明底色 + 底部 1px 分界线；滚动内容从其下方穿过会被完全遮住。
 */
export const CatStickerBar = ({ topInset, onOpenPlTagsSheet }: CatStickerBarProps) => {
  const theme = useTheme()
  // 吸顶层压在顶栏下沿：这条线必须与 TopBar 的盒高、PageViewport 的上内衬同一档同一式
  // （原型 `.wide .viewport{padding-top:92px}` = 顶栏 36 + 46 + 10，styles.css:1314-1315）
  const { topBarHeight } = useWideLayout()
  const cats = usePlaylistCategories()
  const selection = usePlaylistTagSelection()
  const chipItems = usePlaylistChipItems(cats.items, selection)

  const handleTagSelect = useCallback((key: string) => {
    const hit = chipItems.find(item => item.key === key)
    if (hit) selectPlaylistTag({ key: hit.key, label: hit.label })
  }, [chipItems])

  // 与页面原位同一条显示闸：取数中/失败/只有一个分类都不出条
  if (cats.loading || cats.error != null || cats.items.length <= 1) return null

  return (
    <View
      style={[styles.root, {
        paddingTop: topBarHeight(topInset),
        backgroundColor: theme.colors.bg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.line,
      }]}
      pointerEvents="box-none"
    >
      {/* 原位行的 marginHorizontal:-16 需要容器补回 16 内边距，chip 才不贴屏边；
          sticky=true 剥掉流内上 margin（14），吸顶盒与原型同高：padding 3 + 胶囊 28 + padding 8 = 39px */}
      <View style={styles.row}>
        <ChipRow
          variant="cat"
          sticky
          items={chipItems}
          activeKey={selection.key}
          onSelect={handleTagSelect}
          trailing={{
            label: NEW_UI_PLAYLIST_TITLES.allTags,
            onPress: onOpenPlTagsSheet,
          }}
        />
      </View>
    </View>
  )
}

CatStickerBar.displayName = 'NewUICatStickerBar'

const styles = StyleSheet.create({
  /** 全屏宽浮层：top:0，顶栏高度在 paddingTop 里让出（TOP_BAR 口径见 theme/tokens.ts）。
   *  底缘不再另加 padding：吸顶盒的上下留白由 ChipRow(sticky) 的 3/8 padding 提供，与原型 .cat-row 一致 */
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  row: {
    paddingHorizontal: LAYOUT.screenPaddingX,
  },
})
