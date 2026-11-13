import { memo } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'

import { FONT_WEIGHT, PAGING_STATUS, useTheme } from '@/newui/theme'

import { RunningDots } from '../RunningDots'

export interface PagingStatusProps {
  /** 状态行文案（原型 PLD_STATUS 两句：正在载入下一批… / 这一批没有载入 · 点击重试） */
  text: string
  /** 请求在途（原型 button.disabled）：置灰不可点，样式回落三级文字色 */
  disabled?: boolean
  /** 正在获取标识（2026-10-15 同事清单：静态转圈偏弱，换动画）：文案前配 RunningDots 三点接力跳动 */
  loading?: boolean
  onPress?: () => void
}

/**
 * 分页状态行（对应原型 .pl-status，styles.css L272-278）：
 * 「取下一批的进度如实写在列表尾巴上，取失败时这一行就是重试入口」。
 * grid-column:1/-1（.pl-grid>.pl-status / .rank-grid>.pl-status 横跨整行）在 RN 侧用 width:'100%' 表达。
 * 可点（非 disabled）时 color:var(--brand)+700，disabled 时 text-3——与原型两条规则一一对应。
 * 正在获取形态（loading）：原型的 .spin 转圈真机反馈存在感太弱，2026-10-15 换成
 * 共通件 RunningDots（三颗品牌色点接力跳动）——请求发出到数据回来的整个窗口持续动画；
 * 失败态不带动画、裸文字可点重试（口径不变）。
 * 纯展示组件；排行榜/歌单池网格末尾与歌单详情层共用。
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
  /** width:100%;padding:14px 6px（网格整行）；gap:7px = 动画与文字之间（styles.css L274） */
  root: {
    width: '100%',
    paddingVertical: PAGING_STATUS.paddingVertical,
    paddingHorizontal: PAGING_STATUS.paddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: PAGING_STATUS.contentGap,
  },
  /** font-size:12px;text-align:center（色走 theme 内联） */
  text: {
    fontSize: PAGING_STATUS.fontSize,
    textAlign: 'center',
  },
})
