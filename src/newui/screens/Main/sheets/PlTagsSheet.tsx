import { useCallback, type ReactNode } from 'react'
import { StyleSheet, Text } from 'react-native'

import { ChipFlow, GroupLabel, Sheet } from '@/newui/components'
import { NEW_UI_PLAYLIST_TAG_SHEET, NEW_UI_PLAYLIST_TITLES } from '@/newui/const'
import {
  NEW_UI_PLAYLIST_REC_LABEL,
  NEW_UI_PLAYLIST_REC_TAG,
  selectPlaylistTag,
  usePlaylistCategories,
  usePlaylistTagSelection,
} from '@/newui/hooks'
import { FONT_SIZE, SHEET, useTheme } from '@/newui/theme'

export interface PlTagsSheetProps {
  visible: boolean
  onClose: () => void
  /** 底部安全区（透传给 Sheet） */
  bottomInset?: number
}

/**
 * 「全部分类」浮层（对应原型 #plTagsSheet / renderPlTags app.js L788-804）：
 * 数据 = usePlaylistCategories 的 groups（getTags(source).tags 全量目录，各平台分组天然不同），
 * 每组 GroupLabel + ChipFlow 流式排布，当前选中项高亮；
 * 首位那颗「推荐」按原型单列在「不挑分类」一行下，不混进平台目录；
 * 点任一分组条目 = 写入共享选中态（selectPlaylistTag）→ 收起浮层 → 推荐池按该分类重拉（PlaylistPage 侧订阅）。
 * 入口 = 歌单页 chip 行末尾「全部分类」胶囊；浮层本体挂 MainScreen 根层（与其余 sheet 同构）。
 */
export const PlTagsSheet = ({ visible, onClose, bottomInset }: PlTagsSheetProps) => (
  <Sheet
    visible={visible}
    title={NEW_UI_PLAYLIST_TITLES.allTags}
    subtitle={NEW_UI_PLAYLIST_TAG_SHEET.sub}
    onClose={onClose}
    bottomInset={bottomInset}
  >
    {/* 目录取数与选中态都在子件里：Sheet 关闭后卸载，浮层没开时不额外触发请求（getTags 有 core 缓存，开时秒回） */}
    <PlTagsSheetBody onClose={onClose} />
  </Sheet>
)

PlTagsSheet.displayName = 'NewUIPlTagsSheet'

const PlTagsSheetBody = ({ onClose }: Pick<PlTagsSheetProps, 'onClose'>) => {
  const theme = useTheme()
  const cats = usePlaylistCategories()
  const selection = usePlaylistTagSelection()

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
      {/* 顶部这颗单列一行（原型 app.js L794-797）：它不是平台目录里的一类，不该混进下面的分组，
          所以给它自己的组名「不挑分类」；状态与 chip 行首项同一个（key = ''） */}
      <GroupLabel label={NEW_UI_PLAYLIST_TAG_SHEET.recGroup} />
      <ChipFlow
        items={[{ key: NEW_UI_PLAYLIST_REC_TAG, label: NEW_UI_PLAYLIST_REC_LABEL }]}
        activeKey={selection.key}
        onSelect={key => pick(key, NEW_UI_PLAYLIST_REC_LABEL)}
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
          />
        </Group>
      ))}
    </>
  )
}

PlTagsSheetBody.displayName = 'NewUIPlTagsSheetBody'

/** 一组：组名 + 组内流式胶囊（GroupLabel 自带上下节奏，这里只做纵向堆叠容器） */
const Group = ({ label, children }: { label: string, children: ReactNode }) => (
  <>
    <GroupLabel label={label} />
    {children}
  </>
)

const styles = StyleSheet.create({
  /** 取数中 / 空态提示：12.5 / text-3 / 上 20（同 .sheet-sub 字号档，浮层内短说明节奏） */
  tip: {
    marginTop: SHEET.paddingTop * 2 + SHEET.handleMarginBottom,
    fontSize: FONT_SIZE.smallLg,
    lineHeight: SHEET.subLineHeight,
  },
})
