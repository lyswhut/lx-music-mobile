import { Children, Fragment, memo, type ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { RADIUS, SETTINGS, useTheme } from '@/newui/theme'

import { GroupLabel } from '../GroupLabel'

export interface SettingsGroupProps {
  /** .sg-label 组名（「外观」「数据与缓存」「关于」…） */
  label: string
  /** 组内行（SettingsRow 家族），行间自动补 .set-row border-top 分隔线 */
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

/**
 * 设定页分组容器（对应原型 .set-group / .set-list，styles.css L438-443）：
 * 小标 + 一张圆角 18、chip 底、line 内描边的竖向列表卡；行与行之间自动插 1px 分隔线
 * （原型 :first-child 无顶线，这里等价地只在行间补线）。
 * 今后新增设定 = 往页面里再插一个 SettingsGroup / 多铺几行 SettingsRow，页面本身不用改。
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
  /** .set-group margin-top:26px */
  root: {
    marginTop: SETTINGS.groupMarginTop,
  },
  /** .sg-label 与 .group-label 排版一致（GroupLabel 复用），只差左距 3、上距归零（组距由 root 供） */
  label: {
    marginTop: 0,
    marginLeft: SETTINGS.groupLabelMarginLeft,
  },
  /** .set-list：圆角 18（RADIUS.m）+ overflow 裁切 + inset 1px line（RN 无 inset，转 1px 实描边） */
  list: {
    borderRadius: RADIUS.m,
    overflow: 'hidden',
    borderWidth: 1,
  },
  /** .set-row border-top 1px rgba(255,255,255,.055)（归色板 line，同 StatRow 口径） */
  divider: {
    height: 1,
  },
})
