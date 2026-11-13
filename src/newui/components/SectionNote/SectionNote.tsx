import { memo } from 'react'
import { StyleSheet, Text } from 'react-native'

import { FONT_SIZE, SPACING, useTheme } from '@/newui/theme'

export interface SectionNoteProps {
  /** 区块说明文案（容器传 const/home.ts 的 NEW_UI_HOME_ARTISTS_NOTE） */
  text: string
}

/** 原型 `.section-note` 的 `line-height:1.6`（styles.css L461）。
 *  CSS 里这个无单位倍数是「相对自身字号」的，RN 只吃绝对行高，故按 11px × 1.6 换算。 */
const LINE_HEIGHT_RATIO = 1.6

/**
 * 区块说明灰字（对应原型 `.section-note`，index.html L148 / styles.css L364，
 * parts/home/section-note.{html,css}，U32；app.js renderArtists L1536）：
 * 区块标题下、卡片行上的一句说明（首页「热门歌手」头像是示意插画的那句）。
 * 原型 `.section-note` 的 margin 就写在该元素自身规则上，故 marginBottom 归本件根节点；
 * 结构自 screens/Main/pages/HomePage 内联抽出（2026-10-15 拆件转正轮），样式引用逐字照搬
 * 原内联定义（SPACING.md / FONT_SIZE.caption），渲染零变化。
 * 纯展示组件：文案由容器传入，不读任何状态。
 */
export const SectionNote = memo(({ text }: SectionNoteProps) => {
  const theme = useTheme()
  return <Text style={[styles.root, { color: theme.colors.text3 }]}>{text}</Text>
})

SectionNote.displayName = 'NewUISectionNote'

const styles = StyleSheet.create({
  /** .section-note（原型 margin:0 0 10px / 11px / line-height:1.6；落地口径：SPACING.md / FONT_SIZE.caption，
   *  行高按 11×1.6 换算成绝对值——闸门轮补的就是这一条漏掉的 line-height） */
  root: {
    marginBottom: SPACING.md,
    fontSize: FONT_SIZE.caption,
    lineHeight: Math.round(FONT_SIZE.caption * LINE_HEIGHT_RATIO),
  },
})
