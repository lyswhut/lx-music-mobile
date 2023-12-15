import { memo } from 'react'

import { View } from 'react-native'
import type { InputProps } from '@/components/common/Input'
import Input from '@/components/common/Input'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'


export interface TextAreaItemProps extends InputProps {
  value: string
  label: string
  onChanged: (text: string) => void
}

export default memo(({ value, label, onChanged, ...props }: TextAreaItemProps) => {
  const theme = useTheme()
  return (
    <View style={styles.container} onStartShouldSetResponder={() => true}>
      <Text style={styles.label} size={14}>{label}</Text>
      <Input
        value={value}
        onChangeText={onChanged}
        numberOfLines={6}
        scrollEnabled={false}
        textAlignVertical='top'
        multiline
        style={{ ...styles.textarea, backgroundColor: theme['c-primary-input-background'] }}
        {...props}
       />
    </View>
  )
})

const styles = createStyle({
  container: {
    // paddingLeft: 25,
    marginBottom: 15,
  },
  label: {
    marginBottom: 2,
  },
  textarea: {
    flexGrow: 1,
    flexShrink: 1,
    paddingTop: 3,
    paddingBottom: 3,
    height: 'auto',
    // height: 300,
    // maxWidth: 300,
  },
})
