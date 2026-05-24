import { memo, useCallback, useMemo, useState } from 'react'
import { FlatList, TouchableOpacity, View } from 'react-native'
import { useKeyboard } from '@/utils/hooks'
import { Icon } from '@/components/common/Icon'
import Modal from '@/components/common/Modal'
import Text from '@/components/common/Text'
import { createStyle, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'
import { locatePlayingSong, type LocateResult } from '@/core/locateMusic'

import Pic from './components/Pic'
import Title from './components/Title'
import PlayInfo from './components/PlayInfo'
import ControlBtn from './components/ControlBtn'

const LocateBtn = ({ onResult }: { onResult: (result: LocateResult) => void }) => {
  const theme = useTheme()

  const handlePress = useCallback(() => {
    onResult(locatePlayingSong())
  }, [onResult])

  return (
    <TouchableOpacity style={styles.locateBtn} activeOpacity={0.5} onPress={handlePress}>
      <Icon name="search-2" color={theme['c-button-font']} size={20} />
    </TouchableOpacity>
  )
}

const MultiListModal = ({ listInfos, visible, onHide }: {
  listInfos: LX.List.UserListInfo[]
  visible: boolean
  onHide: () => void
}) => {
  const theme = useTheme()
  const t = useI18n()

  const handleSelect = useCallback((listId: string) => {
    onHide()
    navigations.pushMySonglistDetailScreen(commonState.componentIds.home!, listId)
  }, [onHide])

  if (!visible) return null

  return (
    <Modal onHide={onHide} bgColor="rgba(0,0,0,0.4)">
      <View style={styles.modalContent}>
        <Text size={15} style={styles.modalTitle}>{t('belongs_to_songlist')}</Text>
        <FlatList
          data={listInfos}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.modalItem} onPress={() => handleSelect(item.id)}>
              <Text size={14} color={theme['c-font']}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity style={styles.modalCancel} onPress={onHide}>
          <Text size={14} color={theme['c-primary']}>{t('cancel')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

export default memo(({ isHome = false }: { isHome?: boolean }) => {
  const { keyboardShown } = useKeyboard()
  const theme = useTheme()
  const autoHidePlayBar = useSettingValue('common.autoHidePlayBar')
  const t = useI18n()

  const [showMultiList, setShowMultiList] = useState(false)
  const [multiListInfos, setMultiListInfos] = useState<LX.List.UserListInfo[]>([])

  const handleLocateResult = useCallback((result: LocateResult) => {
    switch (result.type) {
      case 'direct':
      case 'found':
        navigations.pushMySonglistDetailScreen(commonState.componentIds.home!, result.listId!)
        break
      case 'notFound':
        toast(result.reason === 'noMusic' ? t('no_playing_music') : t('not_in_any_songlist'))
        break
      case 'multiple':
        setMultiListInfos(result.listInfos!)
        setShowMultiList(true)
        break
    }
  }, [t])

  const playerComponent = useMemo(() => (
    <View style={{ ...styles.container, backgroundColor: theme['c-content-background'] }}>
      <Pic isHome={isHome} />
      <View style={styles.center}>
        <Title isHome={isHome} />
        <PlayInfo isHome={isHome} />
      </View>
      <View style={styles.right}>
        <LocateBtn onResult={handleLocateResult} />
        <ControlBtn />
      </View>
    </View>
  ), [theme, isHome, handleLocateResult])

  return autoHidePlayBar && keyboardShown ? null : (
    <>
      {playerComponent}
      <MultiListModal
        listInfos={multiListInfos}
        visible={showMultiList}
        onHide={() => setShowMultiList(false)}
      />
    </>
  )
})

const styles = createStyle({
  container: {
    width: '100%',
    paddingVertical: 5,
    paddingLeft: 5,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 10,
  },
  center: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 5,
    height: '100%',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 0,
    flexShrink: 0,
    paddingLeft: 5,
    paddingRight: 5,
  },
  locateBtn: {
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: '40%',
    padding: 16,
  },
  modalTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  modalCancel: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
})
