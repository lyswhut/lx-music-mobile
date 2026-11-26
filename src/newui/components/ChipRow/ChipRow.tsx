import { memo } from 'react'
import { ScrollView, StyleSheet } from 'react-native'

import { CHIP_ROW, LAYOUT } from '@/newui/theme'

import { Chip } from '../Chip'

export interface ChipRowItem {
  key: string
  label: string
}

/** 行尾入口胶囊（如「全部分类」）：不属于选项集，点击走自己的 onPress（开浮层），不参与 activeKey 判定 */
export interface ChipRowTrailing {
  label: string
  onPress: () => void
}

export interface ChipRowProps {
  /** 选项 */
  items: ChipRowItem[]
  activeKey: string
  onSelect: (key: string) => void
  /**
   * 形态：`tabs` = 首页榜单条（缺省）；`cat` = 歌单页分类条。
   * 两者的间距节奏不同（cat 贴屏边横滑、上下留白更大），颜色与 Chip 本身共用。
   */
  variant?: 'tabs' | 'cat'
  /** 行尾固定入口（可选）：渲染在全部选项之后，如歌单页「全部分类」 */
  trailing?: ChipRowTrailing
}

/**
 * 横向胶囊选择条：超出宽度可横滑，纯展示组件。
 * `cat` 分类条由页面放在列表外层作吸顶常驻（不再是随内容滚走的列表头）。
 */
export const ChipRow = memo(({ items, activeKey, onSelect, variant = 'tabs', trailing }: ChipRowProps) => {
  const isCat = variant === 'cat'
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.root, isCat && styles.rootCat]}
      contentContainerStyle={[styles.content, isCat && styles.contentCat]}
    >
      {items.map((item) => (
        <Chip
          key={item.key}
          label={item.label}
          active={item.key === activeKey}
          onPress={() => onSelect(item.key)}
        />
      ))}
      {trailing && (
        <Chip label={trailing.label} onPress={trailing.onPress} />
      )}
    </ScrollView>
  )
})

ChipRow.displayName = 'NewUIChipRow'

const styles = StyleSheet.create({
  /** 上边负值抵消标题区下边距，让胶囊贴近标题 */
  root: {
    marginTop: CHIP_ROW.marginTop,
    marginBottom: CHIP_ROW.marginBottom,
  },
  /** 分类条外边距（见 CHIP_ROW.catMarginBottom） */
  rootCat: {
    marginTop: CHIP_ROW.catMarginTop,
    marginBottom: CHIP_ROW.catMarginBottom,
    marginHorizontal: -LAYOUT.screenPaddingX,
  },
  /** 不写 alignItems：行内胶囊等高，拉伸与居中同解 */
  content: {
    gap: CHIP_ROW.gap,
  },
  /**
   * 分类条内边距：上 2 / 下 4，2026-11-26 收紧留白，交叉轴居中。
   */
  contentCat: {
    alignItems: 'center',
    gap: CHIP_ROW.gap,
    paddingTop: CHIP_ROW.catPaddingTop,
    paddingBottom: CHIP_ROW.catPaddingBottom,
    paddingHorizontal: LAYOUT.screenPaddingX,
  },
})
