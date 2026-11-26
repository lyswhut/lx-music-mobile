import { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { ChipFlow, EmptyTip, Icon } from '@/newui/components'
import {
  NEW_UI_SEARCH_CLEAR_HISTORY_LABEL,
  NEW_UI_SEARCH_HISTORY_EMPTY,
  NEW_UI_SEARCH_HOT_EMPTY,
  NEW_UI_SEARCH_IDLE_HINT,
  NEW_UI_SEARCH_LABELS,
} from '@/newui/const'
import { FONT_SIZE, FONT_WEIGHT, SEARCH, useTheme } from '@/newui/theme'

export interface SearchIdlePanelProps {
  /**
   * 搜索历史（新→旧，已是本机最新值，最多 8 条）。
   * `null` = 还没从本机读完（冷启动首帧）：历史区整块先不渲染，避免先闪一下空态。
   */
  history: string[] | null
  /** 大家都在搜（真实热搜，容器截断到 NEW_UI_SEARCH_HOT_LIMIT） */
  hotWords: string[]
  /** 点词即搜 */
  onPick: (word: string) => void
  /** 清空历史 */
  onClearHistory: () => void
}

/**
 * 搜索空输入态：历史词 + 热搜词两组胶囊 + 尾注；
 * 一条历史都没有时历史区换成一行 EmptyTip。纯展示，数据与动作全部由容器传入。
 */
export const SearchIdlePanel = memo(({
  history,
  hotWords,
  onPick,
  onClearHistory,
}: SearchIdlePanelProps) => {
  const theme = useTheme()

  return (
    <View>
      {history == null
        ? null
        : history.length > 0
          ? (
            <>
              {/* 左标题右「清空」 */}
              <View style={styles.label}>
                <Text style={[styles.labelText, { color: theme.colors.text2 }]}>
                  {NEW_UI_SEARCH_LABELS.history}
                </Text>
                <Pressable
                  hitSlop={8}
                  onPress={onClearHistory}
                  style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={NEW_UI_SEARCH_CLEAR_HISTORY_LABEL}
                >
                  <Icon name="close" size={SEARCH.clearWordIcon} color={theme.colors.text3} />
                  <Text style={[styles.clearText, { color: theme.colors.text3 }]}>
                    {NEW_UI_SEARCH_LABELS.clear}
                  </Text>
                </Pressable>
              </View>
              <ChipFlow
                items={history.map(word => ({ key: word, label: word }))}
                onSelect={onPick}
              />
            </>
          )
          : (
            /* 一条都没有：不塌成空白，一行人话（layer 档内边距） */
            <EmptyTip variant="layer" text={NEW_UI_SEARCH_HISTORY_EMPTY} />
          )}

      <View style={styles.label}>
        <Text style={[styles.labelText, { color: theme.colors.text2 }]}>
          {NEW_UI_SEARCH_LABELS.hot}
        </Text>
      </View>
      {hotWords.length > 0
        ? (
          <ChipFlow
            items={hotWords.map(word => ({ key: word, label: word }))}
            onSelect={onPick}
          />
        )
        : (
          <Text style={[styles.hotEmpty, { color: theme.colors.text3 }]}>{NEW_UI_SEARCH_HOT_EMPTY}</Text>
        )}

      {/* 尾注 */}
      <Text style={[styles.hint, { color: theme.colors.text3 }]}>{NEW_UI_SEARCH_IDLE_HINT}</Text>
    </View>
  )
})

SearchIdlePanel.displayName = 'NewUISearchIdlePanel'

const styles = StyleSheet.create({
  /** 标题行：左标题右「清空」 */
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SEARCH.labelMarginTop,
    marginBottom: SEARCH.labelMarginBottom,
  },
  labelText: {
    fontSize: FONT_SIZE.smallLg,
    fontWeight: FONT_WEIGHT.bold,
  },
  /** 「清空」按钮：小字 + 图标 */
  clear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  clearText: {
    fontSize: FONT_SIZE.captionLg,
  },
  pressed: {
    opacity: 0.6,
  },
  /** 热搜还没回来 / 全平台都空时的说明行 */
  hotEmpty: {
    fontSize: FONT_SIZE.captionLg,
  },
  /** 尾注 */
  hint: {
    marginTop: SEARCH.hintMarginTop,
    fontSize: FONT_SIZE.caption,
    lineHeight: 19,
  },
})
