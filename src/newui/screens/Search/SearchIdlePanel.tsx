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
   * 搜索历史（新→旧，已是本机最新值；条数上限由容器侧 searchHistory 适配层截到 8）。
   * `null` = 还没从本机读完（冷启动首帧）：历史区整块先不渲染，别先闪一下空态那行人话。
   */
  history: string[] | null
  /** 大家都在搜（真实热搜，容器截断到 NEW_UI_SEARCH_HOT_LIMIT） */
  hotWords: string[]
  /** 点词即搜（原型 pickQuery） */
  onPick: (word: string) => void
  /** 清空历史（原型 .sc-clear） */
  onClearHistory: () => void
}

/**
 * 搜索空输入态（原型 renderSearchIdle，app.js L3583-3609）：
 * 历史词 + 热搜词两组胶囊 + 尾注；一条历史都没有时历史区换成一行 `.empty-tip`
 * （L3595-3599「这一区不塌成空白，也不摆『暂无数据』那种话」）。纯展示，数据与动作全部由容器传入。
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
              {/* .sc-label：左标题右「清空」 */}
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
            /* 一条都没有：不塌成空白，一行人话（原型 .empty-tip；搜索层壳带 .pl-layer，
               所以走 layer 档的内边距 34px 0，见 index.html L386 与 styles.css L645） */
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

      {/* .sc-hint */}
      <Text style={[styles.hint, { color: theme.colors.text3 }]}>{NEW_UI_SEARCH_IDLE_HINT}</Text>
    </View>
  )
})

SearchIdlePanel.displayName = 'NewUISearchIdlePanel'

const styles = StyleSheet.create({
  /** .sc-label margin:18px 0 10px / 12.5 / 600，b 走 text-2 700 */
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
  /** .sc-clear：11.5 / text-3 / gap 1（图标 13） */
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
  /** 热搜还没回来 / 全平台都空时的说明行（原型 mock 恒有词，真实数据需要如实空态） */
  hotEmpty: {
    fontSize: FONT_SIZE.captionLg,
  },
  /** .sc-hint：11 / mt 16 / 行高 1.7 ≈ 19 */
  hint: {
    marginTop: SEARCH.hintMarginTop,
    fontSize: FONT_SIZE.caption,
    lineHeight: 19,
  },
})
