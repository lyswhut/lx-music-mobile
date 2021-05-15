import React, { useMemo, memo, useState, useEffect } from 'react'
import { StyleSheet, View, Text } from 'react-native'

import Section from './components/Section'
import SubTitle from './components/SubTitle'
import Button from './components/Button'
import { showVersionModal } from '@/navigation'

import { useTranslation } from '@/plugins/i18n'
import { useGetter, useDispatch } from '@/store'
import { VERSION_STATUS } from '@/config/constant'

const currentVer = process.versions.app
export default memo(() => {
  const theme = useGetter('common', 'theme')
  const { t } = useTranslation()
  const versionInfo = useGetter('common', 'versionInfo')
  const setVersionInfo = useDispatch('common', 'setVersionInfo')
  const [title, setTitle] = useState('')
  const handleOpenVersionModal = () => {
    setVersionInfo({ showModal: true })
    showVersionModal()
  }

  useEffect(() => {
    switch (versionInfo.status) {
      case VERSION_STATUS.available:
        setTitle(t('version_title_new'))
        // setTip(t('version_btn_new'))
        break
      case VERSION_STATUS.downloading:
        setTitle(t('version_title_new'))
        break
      case VERSION_STATUS.downloaded:
        setTitle(t('version_title_update'))
        break
      case VERSION_STATUS.checking:
        setTitle(t('version_title_checking'))
        break
      case VERSION_STATUS.failed:
        setTitle(t('version_title_failed'))
        break
      case VERSION_STATUS.unknown:
        setTitle(t('version_title_unknown'))
        break
      case VERSION_STATUS.latest:
      default:
        setTitle(t('version_tip_latest'))
        break
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, versionInfo])

  return (
    <Section title={t('setting_version')}>
      <SubTitle title={title}>
        <View style={styles.desc}>
          <Text style={{ ...styles.label, color: theme.normal }}>{t('version_label_latest_ver')}{versionInfo.version}</Text>
          <Text style={{ ...styles.label, color: theme.normal }}>{t('version_label_current_ver')}{currentVer}</Text>
        </View>
        <View style={styles.btn}>
          <Button onPress={handleOpenVersionModal}>{t('setting_version_show_ver_modal')}</Button>
        </View>
      </SubTitle>
    </Section>
  )
})

const styles = StyleSheet.create({
  desc: {
    marginBottom: 5,
  },
  label: {
    fontSize: 14,
  },
  btn: {
    flexDirection: 'row',
  },
})
