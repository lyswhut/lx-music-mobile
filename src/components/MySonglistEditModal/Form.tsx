import { memo } from 'react'
import { View } from 'react-native'
import Input from '@/components/common/Input'
import { createStyle } from '@/utils/tools'
import { useI18n } from '@/lang'

export default memo(({ name, desc, onNameChange, onDescChange }: {
  name: string
  desc: string
  onNameChange: (name: string) => void
  onDescChange: (desc: string) => void
}) => {
  const t = useI18n()

  return (
    <View style={styles.container}>
      <Input
        value={name}
        onChangeText={onNameChange}
        placeholder="歌单标题"
        style={styles.input}
        maxLength={50}
      />
      <Input
        value={desc}
        onChangeText={onDescChange}
        placeholder="简介（可选）"
        style={{ ...styles.input, ...styles.descInput }}
        multiline
        maxLength={200}
      />
    </View>
  )
})

const styles = createStyle({
  container: {
    marginTop: 10,
  },
  input: {
    marginBottom: 10,
  },
  descInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
})
