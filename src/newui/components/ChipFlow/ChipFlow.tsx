import { memo } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { CHIP_FLOW } from '@/newui/theme'

import { Chip } from '../Chip'

export interface ChipFlowItem {
  key: string
  label: string
  /** 第二段等宽文字（见 Chip.monoLabel） */
  monoLabel?: string
  /** 单项自带选中态（不传时按 activeKey 判定） */
  active?: boolean
  /** 单项不可选态（降显但仍可点，说明由容器给；见 Chip.disabled） */
  disabled?: boolean
}

export interface ChipFlowProps {
  /** 胶囊集合 */
  items: ReadonlyArray<ChipFlowItem>
  /** 整组共用的选中 key（与 item.active 二选一即可） */
  activeKey?: string
  onSelect?: (key: string) => void
  style?: StyleProp<ViewStyle>
  /** 逐枚胶囊样式（浮窗里要固定宽度 / 每行固定枚数时传；Chip 最后应用，可覆盖默认 padding） */
  chipStyle?: StyleProp<ViewStyle>
}

/**
 * 换行胶囊组（flex-wrap + gap）：定时档位、搜索历史 / 热搜词共用；
 * 纯展示组件，选择行为由容器接线。
 */
export const ChipFlow = memo(({ items, activeKey, onSelect, style, chipStyle }: ChipFlowProps) => {
  return (
    <View style={[styles.row, style]}>
      {items.map(item => (
        <Chip
          key={item.key}
          label={item.label}
          monoLabel={item.monoLabel}
          active={item.active ?? item.key === activeKey}
          disabled={item.disabled}
          onPress={onSelect == null ? undefined : () => onSelect(item.key)}
          style={chipStyle}
        />
      ))}
    </View>
  )
})

ChipFlow.displayName = 'NewUIChipFlow'

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: CHIP_FLOW.gap,
    // flexWrap 两行之间同样按 gap 走（Chip 自身 flexShrink:0，不会压扁）
  },
})
