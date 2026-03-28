import { memo } from 'react'

import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { ActivityIndicator, StyleSheet, type ActivityIndicatorProps } from 'react-native'
import { setSpText } from '@/utils/pixelRatio'
import Text from './Text'

export interface LoadingProps extends Omit<ActivityIndicatorProps, 'size'> {
  size?: number
  label?: string
}

const LoadingLabel = ({ style, label, ...props }: LoadingProps) => {
  return (
    <>
      <ActivityIndicator
        style={StyleSheet.compose(styles.loadingLabel, style)}
        {...props}
      />
      <Text color={props.color} size={props.size! * 0.8}>{label}</Text>
    </>
  )
}

export default memo(({ size = 15, label, ...props }: LoadingProps) => {
  const theme = useTheme()

  return (
    label ? <LoadingLabel color={theme['c-font-label']} size={setSpText(size)} label={label} {...props} />
      : (
          <ActivityIndicator
            color={theme['c-font-label']}
            size={setSpText(size)}
            {...props}
          />
        )
  )
})


const styles = createStyle({
  loadingLabel: {
    marginRight: 6,
  },
})
