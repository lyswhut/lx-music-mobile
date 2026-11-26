import { useCallback, useMemo, type ReactNode } from 'react'
import { StyleSheet, Text, useWindowDimensions } from 'react-native'

import { ChipFlow, GroupLabel, Sheet } from '@/newui/components'
import { NEW_UI_PLAYLIST_TAG_SHEET, NEW_UI_PLAYLIST_TITLES } from '@/newui/const'
import {
  NEW_UI_PLAYLIST_REC_LABEL,
  NEW_UI_PLAYLIST_REC_TAG,
  selectPlaylistTag,
  usePlaylistCategories,
  usePlaylistTagSelection,
} from '@/newui/hooks'
import { CHIP_FLOW, FONT_SIZE, SHEET, useTheme } from '@/newui/theme'

export interface PlTagsSheetProps {
  visible: boolean
  onClose: () => void
  /** 底部安全区（透传给 Sheet） */
  bottomInset?: number
}

/**
 * 「全部分类」浮层：按平台分类目录分组（GroupLabel + ChipFlow），当前选中项高亮；
 * 首位「推荐」单列一行；点任一条目写入共享选中态并收起浮层，推荐池随之重拉。
 * 入口是歌单页 chip 行末尾的「全部分类」。
 */
export const PlTagsSheet = ({ visible, onClose, bottomInset }: PlTagsSheetProps) => (
  <Sheet
    visible={visible}
    title={NEW_UI_PLAYLIST_TITLES.allTags}
    subtitle={NEW_UI_PLAYLIST_TAG_SHEET.sub}
    onClose={onClose}
    bottomInset={bottomInset}
  >
    {/* 取数与选中态在子件里，关闭即卸载；getTags 有 core 缓存，开时秒回 */}
    <PlTagsSheetBody onClose={onClose} />
  </Sheet>
)

PlTagsSheet.displayName = 'NewUIPlTagsSheet'

const PlTagsSheetBody = ({ onClose }: Pick<PlTagsSheetProps, 'onClose'>) => {
  const theme = useTheme()
  const cats = usePlaylistCategories()
  const selection = usePlaylistTagSelection()
  const { width: windowWidth } = useWindowDimensions()
  // 胶囊固定宽度、每行恰好 4 枚；paddingHorizontal 4 让约 5 个汉字完整显示
  const categoryChipStyle = useMemo(
    () => ({
      width: Math.floor((windowWidth - SHEET.paddingX * 2 - CHIP_FLOW.gap * 3) / 4),
      paddingHorizontal: 4,
    }),
    [windowWidth],
  )

  const pick = useCallback((key: string, label: string) => {
    selectPlaylistTag({ key, label })
    onClose()
  }, [onClose])

  if (cats.loading) {
    return <Text style={[styles.tip, { color: theme.colors.text3 }]}>{NEW_UI_PLAYLIST_TAG_SHEET.loading}</Text>
  }
  if (cats.error || cats.groups.length === 0) {
    return <Text style={[styles.tip, { color: theme.colors.text3 }]}>{cats.error ?? NEW_UI_PLAYLIST_TAG_SHEET.empty}</Text>
  }

  return (
    <>
      {/* 「推荐」单列一行，不混进平台目录；状态与 chip 行首项同一个（key = ''） */}
      <GroupLabel label={NEW_UI_PLAYLIST_TAG_SHEET.recGroup} />
      <ChipFlow
        items={[{ key: NEW_UI_PLAYLIST_REC_TAG, label: NEW_UI_PLAYLIST_REC_LABEL }]}
        activeKey={selection.key}
        onSelect={key => pick(key, NEW_UI_PLAYLIST_REC_LABEL)}
        chipStyle={categoryChipStyle}
      />
      {cats.groups.map(group => (
        <Group key={group.label} label={group.label}>
          <ChipFlow
            items={group.items}
            activeKey={selection.key}
            onSelect={key => {
              const hit = group.items.find(item => item.key === key)
              if (hit) pick(hit.key, hit.label)
            }}
            chipStyle={categoryChipStyle}
          />
        </Group>
      ))}
    </>
  )
}

PlTagsSheetBody.displayName = 'NewUIPlTagsSheetBody'

/** 一组：组名 + 组内流式胶囊 */
const Group = ({ label, children }: { label: string, children: ReactNode }) => (
  <>
    <GroupLabel label={label} />
    {children}
  </>
)

const styles = StyleSheet.create({
  /** 取数中 / 空态提示 */
  tip: {
    marginTop: SHEET.paddingTop * 2 + SHEET.handleMarginBottom,
    fontSize: FONT_SIZE.smallLg,
    lineHeight: SHEET.subLineHeight,
  },
})
