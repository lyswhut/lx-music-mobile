import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { NEW_UI_SHEET_CONFIRM } from '@/newui/const'
import { usePressFx } from '@/newui/hooks/usePressFx'
import { CONFIRM_SHEET, FONT_WEIGHT, GRADIENTS, useTheme } from '@/newui/theme'

import { Sheet } from '../Sheet'

/** 按压反馈要动 `Pressable` 本体：套一层 `Animated.View` 会改掉 flex 布局，见 usePressFx 头注 */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface ConfirmSheetProps {
  /** 显隐（透传 Sheet：false 时播完退场动画后自动卸载） */
  visible: boolean
  /** .sheet-title；不传回落原型 askConfirm 默认句「要执行这一步吗」（app.js L1454，okLabel 默认「确定」同行） */
  title?: string
  /** .sheet-sub 正文（原型 body：一句说明删什么、能不能恢复） */
  body: string
  /** 右键文案（原型 #cfOk，默认「确定」） */
  okLabel?: string
  /** 左键文案（原型取消位，默认「取消」） */
  cancelLabel?: string
  /** 按右键（原型 #cfOk.onclick：先关层再跑 onOk，这里同序） */
  onConfirm: () => void
  /** 关闭（点遮罩 / Android 返回键 / 左键都走它，原型 data-close 等价路径） */
  onClose: () => void
  /** 底部安全区（透传 Sheet） */
  bottomInset?: number
}

/**
 * 二次确认浮层（QA 2026-10-14 D-09：原型 #confirmSheet 是 Sheet 家族的一员，
 * RN 此前走原生 `Alert.alert` 系统弹窗——载体降级）。
 * 结构逐字对照原型 index.html L498-509：sheet-handle + .sheet-title(#cfTitle) +
 * .sheet-sub(#cfBody) + .cf-actions 两枚 .cf-btn（styles.css L501-505）；
 * 骨架整体复用共通件 Sheet（遮罩/体贴动画/返回键先收层都归它），本组件只落动作行。
 * 纯展示组件：文案、显隐、确认动作全部由容器接线。
 */
export const ConfirmSheet = ({
  visible,
  title,
  body,
  okLabel = NEW_UI_SHEET_CONFIRM.ok,
  cancelLabel = NEW_UI_SHEET_CONFIRM.cancel,
  onConfirm,
  onClose,
  bottomInset,
}: ConfirmSheetProps) => {
  const theme = useTheme()
  // `.cf-btn:active{transform:scale(.98)}`（styles.css L648），`.cf-btn{transition:.2s var(--ease)}`（L646）
  const cancelFx = usePressFx({ scale: CONFIRM_SHEET.pressScale })
  const okFx = usePressFx({ scale: CONFIRM_SHEET.pressScale })

  return (
    <Sheet
      visible={visible}
      title={title ?? NEW_UI_SHEET_CONFIRM.defaultTitle}
      subtitle={body}
      onClose={onClose}
      bottomInset={bottomInset}
    >
      {/* .cf-actions：两枚等宽键，间距 10（styles.css L501） */}
      <View style={styles.actions}>
        {/* .cf-btn（左键）：fill-2 底 + 1px line 描边（原型 inset 描边转真实 border，高度不变） */}
        <AnimatedPressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
          onPressIn={cancelFx.onPressIn}
          onPressOut={cancelFx.onPressOut}
          style={[
            styles.btn,
            {
              backgroundColor: theme.colors.fill2,
              borderColor: theme.colors.line,
            },
            cancelFx.animatedStyle,
          ]}
        >
          <Text style={[styles.btnText, { color: theme.colors.text2 }]}>{cancelLabel}</Text>
        </AnimatedPressable>
        {/* .cf-btn.go（右键）：--grad 渐变底 + 白字（原型 box-shadow:none，L505） */}
        <AnimatedPressable
          onPress={() => {
            // 原型 cfOk.onclick：先 closeLayer 再 onOk——确认动作触发后立即收层
            onClose()
            onConfirm()
          }}
          accessibilityRole="button"
          accessibilityLabel={okLabel}
          onPressIn={okFx.onPressIn}
          onPressOut={okFx.onPressOut}
          style={[styles.btn, okFx.animatedStyle]}
        >
          <LinearGradient
            colors={[...GRADIENTS.brand.colors]}
            start={GRADIENTS.brand.start}
            end={GRADIENTS.brand.end}
            style={styles.btnFill}
          >
            <Text style={[styles.btnText, { color: theme.colors.onGradient }]}>{okLabel}</Text>
          </LinearGradient>
        </AnimatedPressable>
      </View>
    </Sheet>
  )
}

ConfirmSheet.displayName = 'NewUIConfirmSheet'

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: CONFIRM_SHEET.actionsGap,
    marginTop: CONFIRM_SHEET.actionsMarginTop,
  },
  btn: {
    flex: 1,
    height: CONFIRM_SHEET.btnHeight,
    borderRadius: CONFIRM_SHEET.btnRadius,
    alignItems: 'center',
    justifyContent: 'center',
    // 左键描边占位（右键走渐变无描边）；overflow 让内嵌渐变跟随圆角
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  /** 渐变层撑满键面（LinearGradient 不吃 flex，需显式 absolute 铺满） */
  btnFill: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: CONFIRM_SHEET.btnFontSize,
    fontWeight: FONT_WEIGHT.extraBold,
    textAlign: 'center',
  },
})
