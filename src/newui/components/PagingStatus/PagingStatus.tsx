import { memo } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'

import { FONT_WEIGHT, PAGING_STATUS, useTheme } from '@/newui/theme'

import { RunningDots } from '../RunningDots'

export interface PagingStatusProps {
  /** 状态行文案（载入中 / 载入失败点击重试） */
  text: string
  /** 请求在途：置灰不可点，样式回落三级文字色 */
  disabled?: boolean
  /** 载入中：文案前配 RunningDots 三点动画 */
  loading?: boolean
  onPress?: () => void
}

/**
 * 分页状态行：把取下一批的进度写在列表尾部，失败时这一行就是重试入口。
 * loading 用 RunningDots 三点接力，比静态转圈在真机上更明显；失败态不带动画、裸文字可点。
 * 纯展示组件；网格整行由 width:100% 表达，色走 theme。
 */
export const PagingStatus = memo(({ text, disabled = false, loading = false, onPress }: PagingStatusProps) => {
  const theme = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.root}
    >
      {loading ? <RunningDots /> : null}
      <Text
        style={[
          styles.text,
          disabled
            ? { color: theme.colors.text3 }
            : { color: theme.colors.brand, fontWeight: FONT_WEIGHT.bold },
        ]}
      >
        {text}
      </Text>
    </Pressable>
  )
})

PagingStatus.displayName = 'NewUIPagingStatus'

const styles = StyleSheet.create({
  root: {
    width: '100%',
    paddingVertical: PAGING_STATUS.paddingVertical,
    paddingHorizontal: PAGING_STATUS.paddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: PAGING_STATUS.contentGap,
  },
  text: {
    fontSize: PAGING_STATUS.fontSize,
    textAlign: 'center',
  },
})
