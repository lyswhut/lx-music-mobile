import { memo } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { CHIP_FLOW } from '@/newui/theme'

import { Chip } from '../Chip'

export interface ChipFlowItem {
  key: string
  label: string
  /** 第二段等宽文字（原型 `#plIdSamples .chip b`，见 Chip.monoLabel） */
  monoLabel?: string
  /** 单项自带选中态（不传时按 activeKey 判定） */
  active?: boolean
  /** 单项不可选态（降显但仍可点，点击说明由容器在 onSelect 里给；见 Chip.disabled） */
  disabled?: boolean
}

export interface ChipFlowProps {
  /** 胶囊集合（原型 .q-chips / .hot-words 的子 .chip） */
  items: ReadonlyArray<ChipFlowItem>
  /** 整组共用的选中 key（与 item.active 二选一即可） */
  activeKey?: string
  onSelect?: (key: string) => void
  style?: StyleProp<ViewStyle>
}

/**
 * 换行胶囊组（对应原型 .q-chips / .hot-words：flex-wrap + gap 8）。
 * 定时档位、搜索历史 / 热搜词共用；纯展示组件，选择行为由容器接线。
 */
export const ChipFlow = memo(({ items, activeKey, onSelect, style }: ChipFlowProps) => {
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
    // flexWrap 两行之间也按原型 gap 8 走（Chip 自身 flexShrink:0，不会压扁）
  },
})
