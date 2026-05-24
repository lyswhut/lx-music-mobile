import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { playList } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'
import { toast } from '@/utils/tools'
import MusicAddSonglistModal, { type MusicAddSonglistModalType } from '@/components/MusicAddSonglistModal'
import { allMusicList } from '@/utils/listManage'

export interface SelectInfo {
  musicInfo: LX.Music.MusicInfoLocal
}

export interface ListMenuType {
  show: (selectInfo: SelectInfo) => void
}

/** 菜单动作联合类型 */
type MenuAction = 'play' | 'playLater' | 'copyName' | 'addToSonglist'

type MenuItem = {
  action: MenuAction
  label: string
  icon: string
}

export default forwardRef<ListMenuType>((_, ref) => {
  const t = useI18n()
  const theme = useTheme()
  const [visible, setVisible] = useState(false)
  const [selectInfo, setSelectInfo] = useState<SelectInfo | null>(null)
  const musicAddSonglistModalRef = useRef<MusicAddSonglistModalType>(null)

  useImperativeHandle(ref, () => ({
    show(info: SelectInfo) {
      setSelectInfo(info)
      setVisible(true)
    },
  }))

  const menuItems: MenuItem[] = useMemo(
    () => [
      { action: 'play', label: t('play'), icon: 'play' },
      { action: 'playLater', label: t('play_later'), icon: 'playback-rate' },
      { action: 'copyName', label: t('copy_name'), icon: 'share' },
      { action: 'addToSonglist', label: t('add_to_songlist'), icon: 'add' },
    ],
    [t],
  )

  const handleSelect = useCallback(
    async (action: MenuAction) => {
      setVisible(false)
      if (!selectInfo) return

      switch (action) {
        case 'play': {
          const musics = allMusicList.get(LIST_IDS.TEMP) ?? []
          const originalIndex = musics.findIndex(m => m.id === selectInfo.musicInfo.id)
          if (originalIndex >= 0) await playList(LIST_IDS.TEMP, originalIndex)
          break
        }
        case 'playLater':
          toast(t('feature_coming_soon'))
          break
        case 'copyName':
          toast(t('feature_coming_soon'))
          break
        case 'addToSonglist':
          musicAddSonglistModalRef.current?.show({
            musicInfo: selectInfo.musicInfo,
            listId: LIST_IDS.TEMP,
          })
          break
      }
    },
    [selectInfo],
  )

  if (!visible || !selectInfo) return null

  return (
    <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
      <TouchableOpacity style={styles.menu} activeOpacity={1}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.action}
            style={styles.menuItem}
            onPress={() => handleSelect(item.action)}
          >
            <Icon name={item.icon} size={18} color={theme['c-font']} />
            <Text style={styles.menuItemText} size={14} color={theme['c-font']}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </TouchableOpacity>
      <MusicAddSonglistModal ref={musicAddSonglistModalRef} />
    </TouchableOpacity>
  )
})

const styles = createStyle({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    width: 200,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  menuItemText: {
    marginLeft: 12,
  },
})
