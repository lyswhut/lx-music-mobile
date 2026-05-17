import { memo, useRef, useCallback } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import Image from '@/components/common/Image'
import FileSelect, { type FileSelectType } from '@/components/common/FileSelect'
import { ensureCoverDir, getCoverPath } from '@/core/mySonglist'
import RNFS from 'react-native-fs'

export default memo(({ picUrl, onChange }: {
  picUrl: string | undefined
  onChange: (url: string | undefined) => void
}) => {
  const theme = useTheme()
  const fileSelectRef = useRef<FileSelectType>(null)

  const handleShowSelectFile = useCallback(() => {
    fileSelectRef.current?.show({
      title: '选择封面图片',
      dirOnly: false,
      filter: ['jpg', 'jpeg', 'png'],
    }, async (path) => {
      try {
        await ensureCoverDir()
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        const targetPath = getCoverPath(tempId)
        await RNFS.copyFile(path, targetPath)
        onChange(targetPath)
      } catch (err: any) {
        console.error('CoverPicker: copy file failed:', err)
        toast('选择封面失败: ' + (err.message || '未知错误'))
        onChange(undefined)
      }
    })
  }, [onChange])

  const handleRemove = useCallback(() => {
    onChange(undefined)
  }, [onChange])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label} size={14}>封面</Text>
        <View style={styles.btns}>
          <TouchableOpacity onPress={handleRemove}>
            <Text size={13} color={theme['c-button-font']}>移除</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShowSelectFile}>
            <Text size={13} color={theme['c-button-font']}>选择图片</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.picContent}>
        <Image
          url={picUrl}
          style={{ ...styles.pic, borderColor: theme['c-border-background'] }}
        />
      </View>
      <FileSelect ref={fileSelectRef} />
    </View>
  )
})

const styles = createStyle({
  container: {
    marginBottom: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 30,
  },
  label: {
    marginBottom: 2,
  },
  btns: {
    flexDirection: 'row',
    gap: 15,
  },
  picContent: {
    marginTop: 5,
    position: 'relative',
  },
  pic: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 4,
  },
})
