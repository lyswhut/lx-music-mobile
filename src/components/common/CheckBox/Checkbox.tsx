import * as React from 'react'
import {
  Animated,
  type GestureResponderEvent,
  StyleSheet,
  View,
  Pressable,
} from 'react-native'

import { Icon } from '../Icon'
import { createStyle } from '@/utils/tools'
import { scaleSizeW } from '@/utils/pixelRatio'

export interface Props {
  /**
   * Status of checkbox.
   */
  status: 'checked' | 'unchecked' | 'indeterminate'
  /**
   * Whether checkbox is disabled.
   */
  disabled?: boolean
  /**
   * Function to execute on press.
   */
  onPress?: (e: GestureResponderEvent) => void

  /**
   * Custom color for checkbox.
   */
  tintColors: {
    true: string
    false: string
  }
}

const ANIMATION_DURATION = 200
const PADDING = scaleSizeW(4)

/**
 * Checkboxes allow the selection of multiple options from a set.
 * This component follows platform guidelines for Android, but can be used
 * on any platform.
 */
const Checkbox = ({
  status,
  disabled,
  onPress,
  tintColors,
  ...rest
}: Props) => {
  const checked = status === 'checked'
  const indeterminate = status === 'indeterminate'

  const icon = indeterminate
    ? 'minus-box'
    : 'checkbox-marked'

  const { current: scaleAnim } = React.useRef<Animated.Value>(
    new Animated.Value(checked ? 1 : 0),
  )

  const isFirstRendering = React.useRef<boolean>(true)


  React.useEffect(() => {
    // Do not run animation on very first rendering
    if (isFirstRendering.current) {
      isFirstRendering.current = false
      return
    }

    Animated.timing(scaleAnim, {
      toValue: checked ? 1 : 0,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start()
  }, [checked, scaleAnim])


  return (
    <Pressable
      {...rest}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ disabled, checked }}
      accessibilityLiveRegion="polite"
      style={{ ...styles.container, padding: PADDING }}
    >
      <Icon
        allowFontScaling={false}
        name="checkbox-blank-outline"
        size={24}
        color={tintColors.false}
      />
      <View style={[StyleSheet.absoluteFill, styles.fillContainer]}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Icon
            allowFontScaling={false}
            name={icon}
            size={24}
            color={tintColors.true}
          />
        </Animated.View>
      </View>
    </Pressable>
  )
}

Checkbox.displayName = 'Checkbox'

const styles = createStyle({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  fillContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default Checkbox

