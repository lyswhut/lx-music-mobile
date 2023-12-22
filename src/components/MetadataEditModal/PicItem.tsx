import { memo, useCallback, useRef } from 'react'

import { TouchableOpacity, View } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import Image from '@/components/common/Image'
import FileSelect, { type FileSelectType } from '@/components/common/FileSelect'
import { BorderWidths } from '@/theme'


export interface PicItemProps {
  value: string
  label: string
  onOnlineMatch: () => void
  onChanged: (text: string) => void
}

export default memo(({ value, label, onOnlineMatch, onChanged }: PicItemProps) => {
  const theme = useTheme()
  const fileSelectRef = useRef<FileSelectType>(null)
  const handleRemoveFile = useCallback(() => {
    onChanged('')
  }, [onChanged])
  const handleShowSelectFile = useCallback(() => {
    fileSelectRef.current?.show({
      title: global.i18n.t('metadata_edit_modal_form_select_pic_title'),
      dirOnly: false,
      filter: ['jpg', 'jpeg', 'png'],
    }, (path) => {
      onChanged(path)
    })
  }, [onChanged])
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label} size={14}>{label}</Text>
        <View style={styles.btns}>
          <TouchableOpacity onPress={handleRemoveFile}>
            <Text size={13} color={theme['c-button-font']}>{global.i18n.t('metadata_edit_modal_form_remove_pic')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onOnlineMatch}>
            <Text size={13} color={theme['c-button-font']}>{global.i18n.t('metadata_edit_modal_form_match_pic')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShowSelectFile}>
            <Text size={13} color={theme['c-button-font']}>{global.i18n.t('metadata_edit_modal_form_select_pic')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.picContent}>
        <Image
          url={value}
          cache={false}
          style={{ ...styles.pic, borderColor: theme['c-border-background'] }}
        />
      </View>
      <FileSelect ref={fileSelectRef} />
    </View>
  )
})

const styles = createStyle({
  container: {
    // paddingLeft: 25,
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
    // backgroundColor: 'rgba(0,0,0,0.2)',
    marginTop: 5,
    position: 'relative',
  },
  pic: {
    width: 180,
    height: 180,
    borderWidth: BorderWidths.normal,
    borderStyle: 'dashed',
  },
})
