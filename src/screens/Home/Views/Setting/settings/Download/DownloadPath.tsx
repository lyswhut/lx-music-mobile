import { memo, useRef, useState } from 'react'

import { View, TouchableOpacity } from 'react-native'

import SubTitle from '../../components/SubTitle'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import ChoosePath, { type ChoosePathType } from '@/components/common/ChoosePath/List'
import { setDownloadSavePath } from '@/utils/data'
import { useTheme } from '@/store/theme/hook'
import { BorderRadius } from '@/theme'

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const savePath = useSettingValue('download.savePath')
  const choosePathRef = useRef<ChoosePathType>(null)
  const [visible, setVisible] = useState(false)

  const handleSelectPath = () => {
    if (visible) {
      choosePathRef.current?.show({
        title: t('download_path_btn'),
        dirOnly: true,
      })
    } else {
      setVisible(true)
      requestAnimationFrame(() => {
        choosePathRef.current?.show({
          title: t('download_path_btn'),
          dirOnly: true,
        })
      })
    }
  }

  const handlePathSelected = (path: string) => {
    void setDownloadSavePath(path)
    updateSetting({ 'download.savePath': path })
  }

  return (
    <SubTitle title={t('download_path_label')}>
      <View style={styles.content}>
        <View style={styles.pathContainer}>
          <Text numberOfLines={1} size={13} color={theme['c-font-label']}>
            {savePath ?? t('download_path_default')}
          </Text>
        </View>
        <TouchableOpacity style={styles.btn} onPress={handleSelectPath}>
          <Text size={14} color={theme['c-primary-font']}>{t('download_path_btn')}</Text>
        </TouchableOpacity>
      </View>
      <ChoosePath
        ref={choosePathRef}
        onConfirm={handlePathSelected}
        onHide={() => {
          setVisible(false)
        }}
      />
    </SubTitle>
  )
})

const styles = createStyle({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  pathContainer: {
    flex: 1,
    marginRight: 10,
  },
  btn: {
    padding: 8,
    borderRadius: BorderRadius.normal,
    flexShrink: 0,
  },
})
