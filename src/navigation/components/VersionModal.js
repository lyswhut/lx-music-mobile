import React, { useMemo, useState, useEffect } from 'react'
import { StyleSheet, View, Text, ScrollView } from 'react-native'
import { Navigation } from 'react-native-navigation'

import { compareVer, sizeFormate } from '@/utils'

import Button from '@/components/common/Button'
import { useTranslation } from '@/plugins/i18n'
import { useGetter, useDispatch } from '@/store'
import { VERSION_STATUS } from '@/config/constant'
import { downloadNewVersion, updateApp } from '@/utils/version'
import { openUrl } from '@/utils/tools'

const VersionItem = ({ version, desc }) => {
  const theme = useGetter('common', 'theme')
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ ...styles.label, color: theme.normal, marginBottom: 2 }}>v{version}</Text>
      <Text style={{ ...styles.desc, color: theme.normal }}>{desc}</Text>
    </View>
  )
}

const currentVer = process.versions.app
const VersionModal = ({ componentId }) => {
  const theme = useGetter('common', 'theme')
  const { t } = useTranslation()
  const versionInfo = useGetter('common', 'versionInfo')
  const setVersionInfo = useDispatch('common', 'setVersionInfo')
  const setIgnoreVersion = useDispatch('common', 'setIgnoreVersion')
  const [ignoreBtn, setIgnoreBtn] = useState({ text: t('version_btn_ignore'), show: true, disabled: false })
  // const [closeBtn, setCloseBtn] = useState({ text: t('version_btn_close'), show: true, disabled: false })
  const [confirmBtn, setConfirmBtn] = useState({ text: t('version_btn_confirm'), show: true, disabled: false })
  const [title, setTitle] = useState('')
  const [tip, setTip] = useState('')

  const history = useMemo(() => {
    if (!versionInfo.history) return []
    let arr = []
    for (const ver of versionInfo.history) {
      if (compareVer(currentVer, ver.version) < 0) arr.push(ver)
    }
    return arr
  }, [versionInfo])

  const handleCancel = () => {
    setVersionInfo({ showModal: false })
    Navigation.dismissOverlay(componentId)
  }

  const handleIgnore = () => {
    setIgnoreVersion(versionInfo.version)
    handleCancel()
  }

  const handleDownload = () => {
    setVersionInfo({
      status: VERSION_STATUS.downloading,
      downloadProgress: {
        total: 0,
        current: 0,
      },
    })
    downloadNewVersion(versionInfo.version, (total, current) => {
      // console.log(total, current)
      setVersionInfo({
        status: VERSION_STATUS.downloading,
        downloadProgress: {
          total,
          current,
        },
      })
    }).then(() => {
      setVersionInfo({
        status: VERSION_STATUS.downloaded,
      })
    }).catch(err => {
      console.log(err)
      setVersionInfo({
        status: VERSION_STATUS.failed,
      })
    })
  }
  const handleConfirm = () => {
    switch (versionInfo.status) {
      case VERSION_STATUS.available:
        handleDownload()
        break
      case VERSION_STATUS.downloaded:
        updateApp().catch(() => {
          setVersionInfo({
            status: VERSION_STATUS.failed,
          })
        })
        break
      case VERSION_STATUS.failed:
        handleDownload()
        break

      case VERSION_STATUS.unknown:
      default:
        openUrl('https://reactnative.dev/')
        break
    }
    // setVersionInfo({ showModal: false })
    // Navigation.dismissOverlay(componentId)
  }

  useEffect(() => {
    switch (versionInfo.status) {
      case VERSION_STATUS.available:
        setTitle(t('version_title_new'))
        setTip('')
        setIgnoreBtn({ text: t('version_btn_ignore'), show: true, disabled: false })
        setConfirmBtn({ text: t('version_btn_new'), show: true, disabled: false })
        // setTip(t('version_btn_new'))
        break
      case VERSION_STATUS.downloading:
        setTitle(t('version_title_new'))
        setTip(t('version_btn_downloading', {
          total: sizeFormate(versionInfo.downloadProgress.total),
          current: sizeFormate(versionInfo.downloadProgress.current),
          progress: versionInfo.downloadProgress.total ? (versionInfo.downloadProgress.current / versionInfo.downloadProgress.total * 100).toFixed(2) : '0',
        }))
        if (ignoreBtn.show) setIgnoreBtn({ text: t('version_btn_ignore'), show: false, disabled: true })
        if (!confirmBtn.disabled) setConfirmBtn({ text: t('version_btn_update'), show: true, disabled: true })
        break
      case VERSION_STATUS.downloaded:
        setTitle(t('version_title_update'))
        setTip('')
        if (ignoreBtn.show) setIgnoreBtn({ text: t('version_btn_ignore'), show: false, disabled: true })
        setConfirmBtn({ text: t('version_btn_update'), show: true, disabled: false })
        break
      case VERSION_STATUS.checking:
        setTitle(t('version_title_checking'))
        setTip(t(''))
        setIgnoreBtn({ text: t('version_btn_ignore'), show: false, disabled: true })
        setConfirmBtn({ text: t('version_btn_new'), show: false, disabled: true })
        break
      case VERSION_STATUS.failed:
        setTitle(t('version_title_failed'))
        setTip(t('version_tip_failed'))
        setIgnoreBtn({ text: t('version_btn_ignore'), show: true, disabled: false })
        setConfirmBtn({ text: t('version_btn_failed'), show: true, disabled: false })
        break
      case VERSION_STATUS.unknown:
        setTitle(t('version_title_unknown'))
        setTip(t('version_tip_unknown'))
        setIgnoreBtn({ text: t('version_btn_ignore'), show: false, disabled: true })
        setConfirmBtn({ text: t('version_btn_unknown'), show: true, disabled: false })
        break
      case VERSION_STATUS.latest:
      default:
        setTitle(t('version_title_latest'))
        setTip('')
        setIgnoreBtn({ text: t('version_btn_ignore'), show: false, disabled: true })
        setConfirmBtn({ text: t('version_btn_new'), show: false, disabled: true })
        break
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, versionInfo])

  return (
    <View style={{ ...styles.centeredView }}>
      <View style={styles.modalView}>
        <View style={{ ...styles.header, backgroundColor: theme.secondary }}></View>
        <View style={styles.main}>
          <Text style={{ ...styles.title, color: theme.normal }}>{title}</Text>
          <ScrollView style={styles.content} keyboardShouldPersistTaps={'always'}>
            <Text style={{ ...styles.label, color: theme.normal }}>{t('version_label_latest_ver')}{versionInfo.version}</Text>
            <Text style={{ ...styles.label, color: theme.normal }}>{t('version_label_current_ver')}{currentVer}</Text>
            {
              versionInfo.desc
                ? (
                    <View>
                      <Text style={{ ...styles.label, color: theme.normal }}>{t('version_label_change_log')}</Text>
                      <View style={{ paddingLeft: 10, marginTop: 5 }}>
                        <Text style={{ ...styles.desc, color: theme.normal }}>{versionInfo.desc}</Text>
                      </View>
                    </View>
                  )
                : null
            }
            {
              history.length
                ? (
                    <View style={styles.history}>
                      <Text style={{ ...styles.label, color: theme.normal }}>{t('version_label_history')}</Text>
                      <View style={{ paddingLeft: 10, marginTop: 5 }}>
                        {history.map((item, index) => <VersionItem key={index} version={item.version} desc={item.desc} />)}
                      </View>
                    </View>
                  )
                : null
            }
          </ScrollView>
          { tip.length ? <Text style={{ marginTop: 10, fontSize: 14, color: theme.secondary }}>{tip}</Text> : null }
        </View>
        <View style={styles.btns}>
          {
            ignoreBtn.show
              ? (
                  <Button disabled={ignoreBtn.disabled} style={{ ...styles.btn, backgroundColor: theme.secondary45 }} onPress={handleIgnore}>
                    <Text style={{ fontSize: 14, color: theme.secondary_5 }}>{ignoreBtn.text}</Text>
                  </Button>
                )
              : null
          }
          <Button style={{ ...styles.btn, backgroundColor: theme.secondary45 }} onPress={handleCancel}>
            <Text style={{ fontSize: 14, color: theme.secondary_5 }}>{t('version_btn_close')}</Text>
          </Button>
          {
            confirmBtn.show
              ? (
                  <Button disabled={confirmBtn.disabled} style={{ ...styles.btn, backgroundColor: theme.secondary45 }} onPress={handleConfirm}>
                    <Text style={{ fontSize: 14, color: theme.secondary_5 }}>{confirmBtn.text}</Text>
                  </Button>
                )
              : null
          }
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  modalView: {
    maxWidth: '90%',
    minWidth: '75%',
    // minHeight: '36%',
    maxHeight: '78%',
    backgroundColor: 'white',
    borderRadius: 4,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.25,
    // shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: 'row',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    height: 20,
  },

  main: {
    // flexGrow: 0,
    flexShrink: 1,
    marginTop: 15,
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 20,
  },
  content: {
    flexGrow: 0,
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
  },
  history: {
    marginTop: 15,
  },
  label: {
    fontSize: 14,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 15,
    paddingLeft: 15,
    // paddingRight: 15,
  },
  btn: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
    alignItems: 'center',
    borderRadius: 4,
    marginRight: 15,
  },
})

export default VersionModal

