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
  /** 标题；不传回落默认句 */
  title?: string
  /** 正文：一句说明删什么、能否恢复 */
  body: string
  /** 确认键文案，默认「确定」 */
  okLabel?: string
  /** 取消键文案，默认「取消」 */
  cancelLabel?: string
  /** 确认：先关层再执行 */
  onConfirm: () => void
  /** 关闭（遮罩 / Android 返回键 / 左键共用） */
  onClose: () => void
  /** 底部安全区（透传 Sheet） */
  bottomInset?: number
}

/**
 * 二次确认浮层：骨架复用 Sheet（遮罩 / 体贴动画 / 返回键先收层），本组件只落两枚动作键。
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
  // 按压缩放 .98，过渡 .2s
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
      {/* 两枚等宽键 */}
      <View style={styles.actions}>
        {/* 左键：fill2 底 + 1px 描边 */}
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
        {/* 右键：品牌渐变底 + 白字 */}
        <AnimatedPressable
          onPress={() => {
            // 先收层再执行确认
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
    // 描边占位（右键走渐变无描边）；overflow 让内嵌渐变跟随圆角
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
