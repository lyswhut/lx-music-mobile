import { useCallback } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { updateSetting } from '@/core/common'
import {
  cancelTimeoutExit,
  startTimeoutExit,
  stopTimeoutExit,
  useTimeoutExitTimeInfo,
} from '@/core/player/timeoutExit'
import { useSettingValue } from '@/store/setting/hook'

import { ChipFlow, Sheet, Switch } from '@/newui/components'
import { NEW_UI_SHEET_TIMER, SLEEP_OPTIONS } from '@/newui/const'
import { FONT_SIZE, FONT_WEIGHT, SHEET, SPACING, useTheme } from '@/newui/theme'
import { formatDuration, showNewUiToast } from '@/newui/utils'

export interface TimerSheetProps {
  visible: boolean
  onClose: () => void
  /** 底部安全区（透传给 Sheet） */
  bottomInset?: number
}

/**
 * 定时停止浮层（原型 renderTimerSheet，app.js L1169-1187）。
 * 接线既有休眠定时逻辑：core/player/timeoutExit 的 start / stop / cancel +
 * 设置键 `player.timeoutExit`（分钟）与 `player.timeoutExitPlayed`（等播完再停）。
 * 与原型的差异（如实呈现）：到点行为由既有核心决定 —— 勾选「等播完」时当前这首
 * 放完即停，未勾选时到点即停；倒计时真相用 useTimeoutExitTimeInfo 订阅。
 * 副标题逐秒回写（原型 sleepSub + paintTimerTag，app.js L1765-1776）：开启态显示
 * 「还剩 mm:ss…」，未开启显示默认句。倒计时驱动不另起 interval ——
 * useTimeoutExitTimeInfo 背后是 core timeoutTools 的每秒钩子（仅计时运行中才 tick），
 * 本组件卸载时钩子自动移除，浮层关闭/组件销毁都不留定时器。
 */
export const TimerSheet = ({ visible, onClose, bottomInset }: TimerSheetProps) => {
  const theme = useTheme()
  const { time } = useTimeoutExitTimeInfo()
  const timeoutExitPlayed = useSettingValue('player.timeoutExitPlayed')

  const handlePick = useCallback((key: string) => {
    const minute = Number(key)
    // 取消在途标记与计时（沿用旧 TimeoutExitEditModal 的 cancel → start 顺序）
    cancelTimeoutExit()
    if (minute === 0) {
      stopTimeoutExit()
      updateSetting({ 'player.timeoutExit': '' })
      showNewUiToast(NEW_UI_SHEET_TIMER.toastOff)
      onClose()
      return
    }
    startTimeoutExit(minute * 60)
    updateSetting({ 'player.timeoutExit': String(minute) })
    showNewUiToast(NEW_UI_SHEET_TIMER.toastOn(minute))
    onClose()
  }, [onClose])

  const handlePlayedToggle = useCallback((check: boolean) => {
    updateSetting({ 'player.timeoutExitPlayed': check })
  }, [])

  // 选中态判定同原型：分钟档 = 剩余时间向上取整；0 档 = 未开启
  const activeKey = String(
    time > 0 ? Math.ceil(time / 60) : 0,
  )

  return (
    <Sheet
      visible={visible}
      title={NEW_UI_SHEET_TIMER.title}
      subtitle={time > 0 ? NEW_UI_SHEET_TIMER.subOn(formatDuration(time)) : NEW_UI_SHEET_TIMER.sub}
      onClose={onClose}
      bottomInset={bottomInset}
    >
      <ChipFlow
        items={SLEEP_OPTIONS.map(minute => ({
          key: String(minute),
          label: NEW_UI_SHEET_TIMER.optionLabel(minute),
          // 「不开启」只在没开定时时亮
          active: minute === 0 ? time <= 0 : activeKey === String(minute),
        }))}
        onSelect={handlePick}
        style={styles.chips}
      />

      {/* 既有设置键 player.timeoutExitPlayed 的行（浮层通用行面板 SHEET.row*） */}
      {/* 原型 .sw-row（styles.css L674-675）：background var(--fill-2) + inset var(--line) */}
      <View style={[styles.switchRow, { backgroundColor: theme.colors.fill2, borderColor: theme.colors.line }]}>
        <View style={styles.switchText}>
          <Text style={[styles.switchTitle, { color: theme.colors.text }]}>
            {NEW_UI_SHEET_TIMER.playedLabel}
          </Text>
        </View>
        <Switch value={timeoutExitPlayed} onValueChange={handlePlayedToggle} />
      </View>

      <Text style={[styles.note, { color: theme.colors.text3 }]}>{NEW_UI_SHEET_TIMER.note}</Text>
    </Sheet>
  )
}

TimerSheet.displayName = 'NewUITimerSheet'

const styles = StyleSheet.create({
  /** #psBody>.q-chips margin-top:14px */
  chips: {
    marginTop: 14,
  },
  /** 浮层通用行面板（原型 .eq-switch 度量，均衡移除后归入 SHEET.row*）：padding 12/14 圆角 14 描边 */
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SHEET.rowGap,
    paddingVertical: SHEET.rowPaddingY,
    paddingHorizontal: SHEET.rowPaddingX,
    borderRadius: SHEET.rowRadius,
    borderWidth: 1,
    marginTop: SPACING.lg,
  },
  switchText: {
    flex: 1,
    minWidth: 0,
  },
  /** 行面板标题（原型 .eq-switch b）：13.5 / 800 */
  switchTitle: {
    fontSize: FONT_SIZE.bodyLg,
    fontWeight: FONT_WEIGHT.extraBold,
  },
  /** .q-note：11px / text-3 / 行高 1.6 */
  note: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.caption,
    lineHeight: 18,
  },
})
