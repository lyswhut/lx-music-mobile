import { useCallback, useEffect, useMemo, useState } from 'react'
import { View, TouchableOpacity, Alert } from 'react-native'
import CheckBox from './Checkbox'

import { createStyle } from '@/utils/tools'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { useTheme } from '@/store/theme/hook'
import Text from '../Text'
import { Icon } from '../Icon'

export interface CheckBoxProps {
  check: boolean
  label: string
  children?: React.ReactNode
  onChange: (check: boolean) => void
  disabled?: boolean
  need?: boolean
  marginRight?: number
  marginBottom?: number

  helpTitle?: string
  helpDesc?: string
}

export default ({ check, label, children, onChange, helpTitle, helpDesc, disabled = false, need = false, marginRight = 0, marginBottom = 0 }: CheckBoxProps) => {
  const theme = useTheme()
  const [isDisabled, setDisabled] = useState(false)
  const tintColors = {
    true: theme['c-primary'],
    false: theme['c-600'],
  }
  const disabledTintColors = {
    true: theme['c-primary-alpha-600'],
    false: theme['c-400'],
  }

  useEffect(() => {
    if (need) {
      if (check) {
        if (!isDisabled) setDisabled(true)
      } else {
        if (isDisabled) setDisabled(false)
      }
    } else {
      isDisabled && setDisabled(false)
    }
  }, [check, need, isDisabled])

  const handleLabelPress = useCallback(() => {
    if (isDisabled) return
    onChange?.(!check)
  }, [isDisabled, onChange, check])

  const helpComponent = useMemo(() => {
    const handleShowHelp = () => {
      Alert.alert(helpTitle ?? '', helpDesc,
        // [{
        //   text: '我知道了 (Close)',
        //   // onPress: () => {
        //   //   void saveData(storageDataPrefix.cheatTip, true)
        //   //   resolve()
        //   // },
        // }],
      )
    }
    return (helpTitle ?? helpDesc) ? (
      <TouchableOpacity style={styles.helpBtn} onPress={handleShowHelp}>
        <Icon name="help" />
      </TouchableOpacity>
    ) : null
  }, [helpTitle, helpDesc])


  const contentStyle = { ...styles.content, marginBottom: scaleSizeH(marginBottom) }
  const labelStyle = { ...styles.label, marginRight: scaleSizeW(marginRight) }

  return (
    disabled
      ? (
          <View style={contentStyle}>
            <CheckBox status={check ? 'checked' : 'unchecked'} disabled={true} tintColors={disabledTintColors} />
            <View style={labelStyle}>{label ? <Text style={styles.name} color={theme['c-500']}>{label}</Text> : children}</View>
            {helpComponent}
          </View>
        )
      : (
          <View style={contentStyle}>
            <CheckBox status={check ? 'checked' : 'unchecked'} disabled={isDisabled} onPress={handleLabelPress} tintColors={tintColors} />
            <TouchableOpacity style={labelStyle} activeOpacity={0.3} onPress={handleLabelPress}>
              {label ? <Text style={styles.name}>{label}</Text> : children}
            </TouchableOpacity>
            {helpComponent}
          </View>
        )
  )
}

const styles = createStyle({
  content: {
    flexGrow: 0,
    flexShrink: 1,
    marginRight: 15,
    alignItems: 'center',
    flexDirection: 'row',
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  checkbox: {
    flex: 0,
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  label: {
    flexGrow: 0,
    flexShrink: 1,
    // marginRight: 15,
    // alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.2)',
    paddingRight: 3,
  },
  name: {
    marginTop: 2,
  },
  helpBtn: {
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
})

