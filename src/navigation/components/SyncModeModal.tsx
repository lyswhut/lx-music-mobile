import { useEffect, useState } from 'react'
import { View, ScrollView } from 'react-native'

import Button from '@/components/common/Button'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import ModalContent from './ModalContent'
import syncState from '@/store/sync/state'
import CheckBox from '@/components/common/CheckBox'
import { setSyncModeComponentId } from '@/core/sync'


const styles = createStyle({
  main: {
    // flexGrow: 0,
    flexShrink: 1,
    marginTop: 15,
    marginLeft: 15,
    // marginRight: 15,
    marginBottom: 15,
  },
  content: {
    flexGrow: 0,
  },
  title: {
    textAlign: 'center',
    marginBottom: 10,
    marginRight: 15,
  },
  btnGroup: {
    marginTop: 10,
  },
  btns: {
    flexDirection: 'row',
    // justifyContent: 'center',
    justifyContent: 'flex-start',
    marginTop: 5,
    marginBottom: 5,
    // paddingBottom: 15,
    // paddingLeft: 15,
    // paddingRight: 15,
  },
  btn: {
    // flex: 1,
    paddingTop: 9,
    paddingBottom: 9,
    paddingLeft: 8,
    paddingRight: 8,
    alignItems: 'center',
    borderRadius: 4,
    marginRight: 15,
    minWidth: 100,
  },
  tips: {
    paddingLeft: 15,
    paddingRight: 15,
    paddingBottom: 10,
  },
  tipTitle: {
    fontWeight: 'bold',
  },
  tip: {
    // paddingLeft: 15,
    // paddingRight: 15,
    paddingBottom: 5,
  },
})


const ListModeModal = () => {
  const theme = useTheme()
  const t = useI18n()
  const [isOverwrite, setOverwrite] = useState(false)

  const handleSelectMode = (mode: LX.Sync.List.SyncMode) => {
    if (mode.startsWith('overwrite') && isOverwrite) mode += '_full'
    global.app_event.selectSyncMode({ type: 'list', mode })
  }

  return (
    <>
      <View style={styles.main}>
        <Text style={styles.title} size={16}>{t('sync__list_mode_title', { name: syncState.serverName })}</Text>
        <ScrollView style={styles.content} keyboardShouldPersistTaps={'always'}>
          <View style={{ ...styles.btnGroup, marginTop: 0 }}>
            <Text size={14}>{t('sync__mode_merge_tip')}</Text>
            <View style={styles.btns}>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={() => { handleSelectMode('merge_local_remote') }}>
                <Text size={13} color={theme['c-button-font']}>{t('sync__mode_merge_btn_local_remote')}</Text>
              </Button>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={() => { handleSelectMode('merge_remote_local') }}>
                <Text size={13} color={theme['c-button-font']}>{t('sync__mode_merge_btn_remote_local')}</Text>
              </Button>
            </View>
          </View>
          <View style={styles.btnGroup}>
            <Text size={14}>{t('sync__mode_overwrite_label')}</Text>
            <View style={styles.btns}>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={() => { handleSelectMode('overwrite_local_remote') }}>
                <Text size={13} color={theme['c-button-font']}>{t('sync__mode_overwrite_btn_local_remote')}</Text>
              </Button>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={() => { handleSelectMode('overwrite_remote_local') }}>
                <Text size={13} color={theme['c-button-font']}>{t('sync__mode_overwrite_btn_remote_local')}</Text>
              </Button>
            </View>
            <View>
              <CheckBox check={isOverwrite} onChange={setOverwrite} label={t('sync__mode_overwrite')} />
            </View>
          </View>
          <View style={styles.btnGroup}>
            <Text size={14}>{t('sync__mode_other_label')}</Text>
            <View style={styles.btns}>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={() => { handleSelectMode('cancel') }}>
                <Text size={13} color={theme['c-button-font']}>{t('sync__mode_overwrite_btn_cancel')}</Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </View>
      <View style={styles.tips}>
        <Text style={styles.tip} size={12} color={theme['c-600']}>
          <Text style={styles.tipTitle} size={12}>{t('sync__mode_merge_tip')}</Text>
          {t('sync__list_mode_merge_tip_desc')}
        </Text>
        <Text style={styles.tip} size={12} color={theme['c-600']}>
          <Text style={styles.tipTitle} size={12}>{t('sync__mode_overwrite_tip')}</Text>
          {t('sync__list_mode_overwrite_tip_desc')}
        </Text>
        <Text style={styles.tip} size={12} color={theme['c-600']}>
          <Text style={styles.tipTitle} size={12}>{t('sync__mode_other_tip')}</Text>
          {t('sync__list_mode_other_tip_desc')}
        </Text>
      </View>
    </>
  )
}


const DislikeModeModal = () => {
  const theme = useTheme()
  const t = useI18n()
  const handleSelectMode = (mode: LX.Sync.Dislike.SyncMode) => {
    global.app_event.selectSyncMode({ type: 'dislike', mode })
  }

  return (
    <>
      <View style={styles.main}>
        <Text style={styles.title} size={16}>{t('sync__dislike_mode_title', { name: syncState.serverName })}</Text>
        <ScrollView style={styles.content} keyboardShouldPersistTaps={'always'}>
          <View style={{ ...styles.btnGroup, marginTop: 0 }}>
            <Text size={14}>{t('sync__mode_merge_tip')}</Text>
            <View style={styles.btns}>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={() => { handleSelectMode('merge_local_remote') }}>
                <Text size={13} color={theme['c-button-font']}>{t('sync__mode_merge_btn_local_remote')}</Text>
              </Button>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={() => { handleSelectMode('merge_remote_local') }}>
                <Text size={13} color={theme['c-button-font']}>{t('sync__mode_merge_btn_remote_local')}</Text>
              </Button>
            </View>
          </View>
          <View style={styles.btnGroup}>
            <Text size={14}>{t('sync__mode_overwrite_label')}</Text>
            <View style={styles.btns}>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={() => { handleSelectMode('overwrite_local_remote') }}>
                <Text size={13} color={theme['c-button-font']}>{t('sync__mode_overwrite_btn_local_remote')}</Text>
              </Button>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={() => { handleSelectMode('overwrite_remote_local') }}>
                <Text size={13} color={theme['c-button-font']}>{t('sync__mode_overwrite_btn_remote_local')}</Text>
              </Button>
            </View>
          </View>
          <View style={styles.btnGroup}>
            <Text size={14}>{t('sync__mode_other_label')}</Text>
            <View style={styles.btns}>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={() => { handleSelectMode('cancel') }}>
                <Text size={13} color={theme['c-button-font']}>{t('sync__mode_overwrite_btn_cancel')}</Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </View>
      <View style={styles.tips}>
        <Text style={styles.tip} size={12} color={theme['c-600']}>
          <Text style={styles.tipTitle} size={12}>{t('sync__mode_merge_tip')}</Text>
          {t('sync__dislike_mode_merge_tip_desc')}
        </Text>
        <Text style={styles.tip} size={12} color={theme['c-600']}>
          <Text style={styles.tipTitle} size={12}>{t('sync__mode_overwrite_tip')}</Text>
          {t('sync__dislike_mode_overwrite_tip_desc')}
        </Text>
        <Text style={styles.tip} size={12} color={theme['c-600']}>
          <Text style={styles.tipTitle} size={12}>{t('sync__mode_other_tip')}</Text>
          {t('sync__dislike_mode_other_tip_desc')}
        </Text>
      </View>
    </>
  )
}

export default ({ componentId }: { componentId: string }) => {
  useEffect(() => {
    setSyncModeComponentId(componentId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ModalContent>
      {
        syncState.type == 'list' ? <ListModeModal />
          : syncState.type == 'dislike' ? <DislikeModeModal />
            : null
      }
    </ModalContent>
  )
}

