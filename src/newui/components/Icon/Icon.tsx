import { memo, type ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg'

import { useTheme } from '@/newui/theme'

import { ICON_DATA } from './icons'
import { EXTRA_ICON_DATA, type ExtraIconName } from './iconsExtra'
import type { IconDef, IconNode } from './types'

/** 可用图标名 = 脚本生成名（icons.ts）+ 手写补充名（iconsExtra.ts） */
export type IconName = keyof typeof ICON_DATA | ExtraIconName

/** 模块级合并查表，渲染期不再拼对象 */
const ALL_ICON_DATA: Record<IconName, IconDef> = { ...ICON_DATA, ...EXTRA_ICON_DATA }

/** 默认尺寸 */
const DEFAULT_SIZE = 22

export interface IconProps {
  /** 图标名（kebab 已转 camelCase；补充字形见 iconsExtra.ts） */
  name: IconName
  /** 像素尺寸，默认 22 */
  size?: number
  /** 颜色；缺省取主题主文字色。数据中的 currentColor 会替换为该值 */
  color?: string
  style?: StyleProp<ViewStyle>
}

const asString = (value: string | number | undefined): string | undefined =>
  value === undefined ? undefined : String(value)

const asNumber = (value: string | number | undefined): number | undefined =>
  typeof value === 'number' ? value : undefined

/** CSS currentColor → 具体颜色（RN 无颜色继承，需显式替换） */
const resolveColor = (value: string | number | undefined, color: string): string | undefined => {
  if (value === undefined) return undefined
  return value === 'currentColor' ? color : String(value)
}

const renderNode = (node: IconNode, color: string, key: number): ReactNode => {
  const props = node.props
  switch (node.type) {
    case 'path':
      return (
        <Path
          key={key}
          d={asString(props.d)}
          fill={resolveColor(props.fill, color)}
          stroke={resolveColor(props.stroke, color)}
          strokeWidth={asNumber(props.strokeWidth)}
          strokeLinecap={asString(props.strokeLinecap) as 'round' | 'butt' | 'square' | undefined}
          strokeLinejoin={
            asString(props.strokeLinejoin) as 'round' | 'miter' | 'bevel' | undefined
          }
          opacity={asNumber(props.opacity)}
        />
      )
    case 'circle':
      return (
        <Circle
          key={key}
          cx={asNumber(props.cx)}
          cy={asNumber(props.cy)}
          r={asNumber(props.r)}
          fill={resolveColor(props.fill, color)}
          stroke={resolveColor(props.stroke, color)}
          strokeWidth={asNumber(props.strokeWidth)}
          opacity={asNumber(props.opacity)}
        />
      )
    case 'rect':
      return (
        <Rect
          key={key}
          x={asNumber(props.x)}
          y={asNumber(props.y)}
          width={asNumber(props.width)}
          height={asNumber(props.height)}
          rx={asNumber(props.rx)}
          fill={resolveColor(props.fill, color)}
          fillOpacity={asNumber(props.fillOpacity)}
          stroke={resolveColor(props.stroke, color)}
          strokeWidth={asNumber(props.strokeWidth)}
          opacity={asNumber(props.opacity)}
        />
      )
    case 'g':
      return (
        <G
          key={key}
          fill={resolveColor(props.fill, color)}
          stroke={resolveColor(props.stroke, color)}
          strokeWidth={asNumber(props.strokeWidth)}
        >
          {node.children?.map((child, index) => renderNode(child, color, index))}
        </G>
      )
    case 'text':
      return (
        <SvgText
          key={key}
          x={asNumber(props.x)}
          y={asNumber(props.y)}
          fontSize={asNumber(props.fontSize)}
          fontWeight={asString(props.fontWeight)}
          textAnchor={asString(props.textAnchor) as 'start' | 'middle' | 'end' | undefined}
          fill={resolveColor(props.fill, color)}
          stroke={resolveColor(props.stroke, color)}
        >
          {node.text}
        </SvgText>
      )
  }
  // 兜底：未知节点类型返回 null，避免渲染崩溃
  return null
}

/** 图标组件：字形合并 icons.ts（脚本生成）与 iconsExtra.ts，渲染期一次查表 */

export const Icon = memo(({ name, size = DEFAULT_SIZE, color, style }: IconProps) => {
  const theme = useTheme()
  const resolvedColor = color ?? theme.colors.text
  const def = ALL_ICON_DATA[name]
  return (
    <Svg width={size} height={size} viewBox={def.viewBox} style={style}>
      {def.nodes.map((node, index) => renderNode(node, resolvedColor, index))}
    </Svg>
  )
})

Icon.displayName = 'NewUIIcon'
