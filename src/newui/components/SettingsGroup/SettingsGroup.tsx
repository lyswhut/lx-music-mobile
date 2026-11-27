import { Children, Fragment, memo, type ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { RADIUS, SETTINGS, useTheme } from '@/newui/theme'

import { GroupLabel } from '../GroupLabel'

export interface SettingsGroupProps {
  /** 组名（「外观」「数据与缓存」「关于」…） */
  label: string
  /** 组内行，行间自动补分隔线 */
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

/**
 * 设定页分组容器：小标 + 一张圆角、chip 底、内描边的竖向列表卡；行与行之间自动插 1px 分隔线。
 * 新增设定 = 再插一个 SettingsGroup / 多铺几行 SettingsRow，页面本身不用改。
 */
export const SettingsGroup = memo(({ label, children, style }: SettingsGroupProps) => {
  const theme = useTheme()
  // Children.toArray 会剔除 null/false 并摊平条件渲染产生的数组，分隔线插位始终对齐可见行
  const rows = Children.toArray(children)
  return (
    <View style={[styles.root, style]}>
      <GroupLabel label={label} style={styles.label} />
      <View
        style={[
          styles.list,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.line },
        ]}
      >
        {rows.map((row, i) => (
          <Fragment key={`settings-row-${i}`}>
            {i > 0 && <View style={[styles.divider, { backgroundColor: theme.colors.line }]} />}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  )
})

SettingsGroup.displayName = 'NewUISettingsGroup'

const styles = StyleSheet.create({
  root: {
    marginTop: SETTINGS.groupMarginTop,
  },
  /** 与 GroupLabel 排版一致，只差左距 3、上距归零（组距由 root 供） */
  label: {
    marginTop: 0,
    marginLeft: SETTINGS.groupLabelMarginLeft,
  },
  /** 圆角卡 + overflow 裁切 + 1px 实描边（RN 无 inset 描边） */
  list: {
    borderRadius: RADIUS.m,
    overflow: 'hidden',
    borderWidth: 1,
  },
  divider: {
    height: 1,
  },
})
