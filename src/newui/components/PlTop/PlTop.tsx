import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { BUTTON, FONT_SIZE, LETTER_SPACING, SPACING, useTheme } from '@/newui/theme'

import { IconButton } from '../IconButton'
import type { IconName } from '../Icon'

/** 右上钮形态：fav 收藏 / delete 删除 / icon 通用图标（字形由容器给）/ none 空槽 */
export type PlTopRight =
  | {
      kind: 'fav'
      /** 已收藏：心形实心 + 主色 */
      collected: boolean
      onPress: () => void
      /** 无障碍文案 */
      label: string
    }
  | { kind: 'delete'; onPress: () => void; label: string }
  /** 通用图标钮：字形与说明由容器给，无选中态 */
  | { kind: 'icon', name: IconName, label: string, onPress: () => void }
  | { kind: 'none' }

export interface PlTopProps {
  /** 面包屑文字 */
  crumbText: string
  /** 返回钮无障碍文案 */
  backLabel: string
  onBack: () => void
  /** 右上那一格的形态与接线 */
  right: PlTopRight
}

/**
 * 歌单详情层顶排：返回钮 + 面包屑 + 右上钮，三列配重 34 / 1fr / 34。
 * 纯展示组件：文案、形态与回调由容器传入。
 */
export const PlTop = memo(({ crumbText, backLabel, onBack, right }: PlTopProps) => {
  const theme = useTheme()
  return (
    <View style={styles.top}>
      <IconButton
        name="chevron"
        strong
        onPress={onBack}
        iconStyle={styles.backIcon}
        accessibilityLabel={backLabel}
      />
      <Text style={[styles.crumb, { color: theme.colors.text2 }]} numberOfLines={1}>
        {crumbText}
      </Text>
      {right.kind === 'delete'
        ? (
          <IconButton
            name="trash"
            strong
            danger
            onPress={right.onPress}
            accessibilityLabel={right.label}
          />
        )
        : right.kind === 'fav'
          ? (
            <IconButton
              name={right.collected ? 'heartFill' : 'heart'}
              strong
              active={right.collected}
              onPress={right.onPress}
              accessibilityLabel={right.label}
            />
          )
          : right.kind === 'icon'
            ? (
              /* 通用图标钮：与返回钮同重的 strong 底，字形与说明由容器给 */
              <IconButton
                name={right.name}
                strong
                onPress={right.onPress}
                accessibilityLabel={right.label}
              />
            )
            : <View style={styles.spacer} />}
    </View>
  )
})

PlTop.displayName = 'NewUIPlTop'

const styles = StyleSheet.create({
  /** 三列配重：两端钮 + 中部 flex:1 居中 */
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.s,
  },
  backIcon: {
    transform: [{ rotate: '180deg' }],
  },
  /** 右上不留钮时的同尺寸空槽，维持三列配重、面包屑仍居中 */
  spacer: {
    width: BUTTON.iconSize,
    height: BUTTON.iconSize,
  },
  crumb: {
    flex: 1,
    minWidth: 0,
    textAlign: 'center',
    fontSize: FONT_SIZE.small,
    letterSpacing: LETTER_SPACING.wide,
  },
})
