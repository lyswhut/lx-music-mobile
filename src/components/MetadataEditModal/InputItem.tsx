import { memo } from 'react'

import { StyleSheet, View } from 'react-native'
import type { InputProps } from '@/components/common/Input'
import Input from '@/components/common/Input'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'


export interface InputItemProps extends InputProps {
  value: string
  label: string
  onChanged: (text: string) => void
}

export default memo(({ value, label, onChanged, ...props }: InputItemProps) => {
  const theme = useTheme()
  return (
    <View style={styles.container}>
      <Text style={styles.label} size={14}>{label}</Text>
      <Input
        value={value}
        onChangeText={onChanged}
        style={{ ...styles.input, backgroundColor: theme['c-primary-input-background'] }}
        {...props}
       />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    // paddingLeft: 25,
    marginBottom: 15,
  },
  label: {
    marginBottom: 2,
  },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    // borderRadius: 4,
    // paddingTop: 3,
    // paddingBottom: 3,
    // maxWidth: 300,
  },
})
