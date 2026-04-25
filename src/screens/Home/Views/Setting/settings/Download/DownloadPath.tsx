import { memo, useRef, useState } from 'react'

import { View, TouchableOpacity } from 'react-native'

import SubTitle from '../../components/SubTitle'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import ChoosePath, { type ChoosePathType } from '@/components/common/ChoosePath'
import { setDownloadSavePath } from '@/utils/data'
import { useTheme } from '@/store/theme/hook'
import { BorderRadius } from '@/theme'
import { selectManagedFolder, getExternalStoragePaths } from '@/utils/fs'
import settingState from '@/store/setting/state'

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const savePath = useSettingValue('download.savePath')
  const choosePathRef = useRef<ChoosePathType>(null)
  const [visible, setVisible] = useState(false)

  const handleSelectPath = async() => {
    if (settingState.setting['common.useSystemFileSelector']) {
      const paths = await getExternalStoragePaths()
      if (!paths || paths.length === 0) {
        return
      }
      const uri = await selectManagedFolder(false)
      if (!uri) {
        return
      }
      const path = uri.path || paths[0]
      await setDownloadSavePath(path)
      updateSetting({ 'download.savePath': path })
    } else {
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
  }

  const handlePathSelected = (path: string) => {
    void setDownloadSavePath(path)
    updateSetting({ 'download.savePath': path })
  }

  const handleResetPath = async() => {
    await setDownloadSavePath(null)
    updateSetting({ 'download.savePath': null })
  }

  return (
    <SubTitle title={t('download_path_label')}>
      <View style={styles.content}>
        <View style={styles.pathContainer}>
          <Text numberOfLines={1} size={13} color={theme['c-font-label']}>
            {savePath ?? t('download_path_default')}
          </Text>
        </View>
        <View style={styles.btnGroup}>
          {savePath ? (
            <TouchableOpacity style={styles.btn} onPress={handleResetPath}>
              <Text size={13} color={theme['c-primary-font']}>{t('download_path_reset')}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.btn} onPress={handleSelectPath}>
            <Text size={14} color={theme['c-primary-font']}>{t('download_path_btn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {
        visible
          ? <ChoosePath ref={choosePathRef} onConfirm={handlePathSelected} />
          : null
      }
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
  btnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    padding: 8,
    borderRadius: BorderRadius.normal,
    flexShrink: 0,
    marginLeft: 5,
  },
})
