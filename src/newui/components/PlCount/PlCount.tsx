import { memo } from 'react'
import { StyleSheet, Text } from 'react-native'

import { FONT_SIZE, useTheme } from '@/newui/theme'

export interface PlCountProps {
  /** 计数文案（容器拼好：const/playlist.ts 的 plPoolCountLabel 产出「已列出 N / M 个」） */
  text: string
}

/**
 * 歌单池计数行（对应原型 `.pl-count`，index.html L188 / styles.css L365，
 * parts/playlist/pl-count.{html,css}，U37；app.js paintPlPool L756-767）：
 * 推荐池标题行右侧的「已列出 N / M 个」灰字（`.section-head` 的右件，经 Section 的 right 槽挂入）。
 * 原型里它与 `.section-note` 是同区段相邻、但各自独立的两条规则（同为 11px / text-3 的灰字家族），
 * 不合并落件：各是各的原型单元（U37 / U32），1:1 对应。
 * 结构自 screens/Main/pages/PlaylistPage 内联抽出（2026-10-15 拆件转正轮）：样式引用逐字照搬
 * 原内联定义（FONT_SIZE.caption），渲染零变化。纯展示组件：文案由容器传入，不读任何状态。
 */
export const PlCount = memo(({ text }: PlCountProps) => {
  const theme = useTheme()
  return <Text style={[styles.root, { color: theme.colors.text3 }]}>{text}</Text>
})

PlCount.displayName = 'NewUIPlCount'

const styles = StyleSheet.create({
  /** .pl-count（原型另有 white-space:nowrap；维持原内联渲染，不追加单行截断） */
  root: {
    fontSize: FONT_SIZE.caption,
  },
})
