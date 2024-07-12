import { useRef, useImperativeHandle, forwardRef, useState, useCallback, memo, useEffect } from 'react'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import Dialog, { type DialogType } from '@/components/common/Dialog'
import { FlatList, View, type FlatListProps as _FlatListProps } from 'react-native'
import { scaleSizeH } from '@/utils/pixelRatio'
import { useTheme } from '@/store/theme/hook'
import { type DuplicateMusicItem, filterDuplicateMusic } from './utils'
import { getListMusics, removeListMusics } from '@/core/list'
import Button from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { useUnmounted } from '@/utils/hooks'
import { playList } from '@/core/player/player'
import { useI18n } from '@/lang'

type FlatListProps = _FlatListProps<DuplicateMusicItem>
const ITEM_HEIGHT = scaleSizeH(56)

const Title = ({ title }: {
  title: string
}) => {
  return (
    <Text style={styles.title} size={16}>
      {title}
    </Text>
  )
}

const Empty = () => {
  const theme = useTheme()
  const t = useI18n()

  return (
    <View style={styles.noitem}>
      <Text color={theme['c-font-label']}>{t('no_item')}</Text>
    </View>
  )
}

const ListItem = memo(({ info, index, onRemove, onPlay }: {
  info: DuplicateMusicItem
  index: number
  onPlay: (info: DuplicateMusicItem) => void
  onRemove: (idx: number) => void
}) => {
  const theme = useTheme()

  return (
    <View style={{ ...styles.listItem, height: ITEM_HEIGHT }} onStartShouldSetResponder={() => true}>
      <View style={styles.listItemLabel}>
        <Text style={styles.sn} size={13} color={theme['c-300']}>{info.index + 1}</Text>
      </View>
      <View style={styles.listItemInfo}>
        <Text color={theme['c-font']} size={14} numberOfLines={1}>{info.musicInfo.name}</Text>
        <View style={styles.listItemAlbum}>
          <Text color={theme['c-font']} size={12} numberOfLines={1}>
            {info.musicInfo.singer}
            {
              info.musicInfo.meta.albumName ? (
                <Text color={theme['c-font-label']} size={12} numberOfLines={1}> ({info.musicInfo.meta.albumName})</Text>
              ) : null
            }
          </Text>
        </View>
      </View>
      <View style={styles.listItemLabel}>
        <Text style={styles.sn} size={13} color={theme['c-300']}>{ info.musicInfo.source }</Text>
      </View>
      <View style={styles.listItemLabel}>
        <Text style={styles.sn} size={13} color={theme['c-300']}>{info.musicInfo.interval}</Text>
      </View>
      <View style={styles.listItemBtns}>
        <Button style={styles.listItemBtn} onPress={() => { onPlay(info) }}>
          <Icon name="play-outline" style={{ color: theme['c-button-font'] }} size={18} />
        </Button>
        <Button style={styles.listItemBtn} onPress={() => { onRemove(index) }}>
          <Icon name="remove" style={{ color: theme['c-button-font'] }} size={18} />
        </Button>
      </View>
    </View>
  )
})

const List = ({ listId }: { listId: string }) => {
  const [list, setList] = useState<DuplicateMusicItem[]>([])
  const isUnmountedRef = useUnmounted()

  const handleFilterList = useCallback(() => {
    if (isUnmountedRef.current) return
    void getListMusics(listId).then((list) => {
      if (isUnmountedRef.current) return
      void filterDuplicateMusic(list).then((l) => {
        if (isUnmountedRef.current) return
        setList(l)
      })
    })
  }, [isUnmountedRef, listId])
  const handlePlay = useCallback((info: DuplicateMusicItem) => {
    const { index: musicInfoIndex } = info
    void playList(listId, musicInfoIndex)
  }, [listId])
  const handleRemove = useCallback((index: number) => {
    setList(list => {
      const { musicInfo: targetMusicInfo } = list.splice(index, 1)[0]
      void removeListMusics(listId, [targetMusicInfo.id]).then(() => {
        handleFilterList()
      })
      return [...list]
    })
  }, [handleFilterList, listId])

  useEffect(handleFilterList, [handleFilterList])

  const renderItem = useCallback(({ item, index }: { item: DuplicateMusicItem, index: number }) => {
    return <ListItem info={item} index={index} onPlay={handlePlay} onRemove={handleRemove} />
  }, [handlePlay, handleRemove])
  const getkey = useCallback<NonNullable<FlatListProps['keyExtractor']>>(item => item.id, [])
  const getItemLayout = useCallback<NonNullable<FlatListProps['getItemLayout']>>((data, index) => {
    return { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
  }, [])

  return (
    list.length ? (
      <FlatList
        style={styles.list}
        removeClippedSubviews={true}
        keyboardShouldPersistTaps={'always'}
        data={list}
        renderItem={renderItem}
        keyExtractor={getkey}
        getItemLayout={getItemLayout}
      />
    ) : (
      <Empty />
    )
  )
}

export interface ModalType {
  show: (info: LX.List.MyListInfo) => void
}
const initInfo = {}

const Modal = forwardRef<ModalType, {}>((props, ref) => {
  const [info, setInfo] = useState<LX.List.MyListInfo>(initInfo as LX.List.MyListInfo)
  const dialogRef = useRef<DialogType>(null)
  useImperativeHandle(ref, () => ({
    show(info) {
      setInfo(info)

      requestAnimationFrame(() => {
        dialogRef.current?.setVisible(true)
      })
    },
  }))
  const handleHide = () => {
    requestAnimationFrame(() => {
      const ninfo = { ...info, name: '' }
      setInfo(ninfo as LX.List.MyListInfo)
    })
  }

  return (
    <Dialog ref={dialogRef} onHide={handleHide}>
      {
        info.name
          ? (<>
              <Title title={info.name} />
              <List listId={info.id} />
            </>)
          : null
      }
    </Dialog>
  )
})

export interface DuplicateMusicType {
  show: (info: LX.List.MyListInfo) => void
}

export default forwardRef<DuplicateMusicType, {}>((props, ref) => {
  const musicAddModalRef = useRef<ModalType>(null)
  const [visible, setVisible] = useState(false)

  useImperativeHandle(ref, () => ({
    show(listInfo) {
      if (visible) musicAddModalRef.current?.show(listInfo)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          musicAddModalRef.current?.show(listInfo)
        })
      }
    },
  }))

  return (
    visible
      ? <Modal ref={musicAddModalRef} />
      : null
  )
})


const styles = createStyle({
  container: {
    // flexGrow: 1,
  },
  title: {
    textAlign: 'center',
    paddingVertical: 15,
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  list: {
    flexGrow: 0,
  },
  listItem: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  sn: {
    width: 38,
    // fontSize: 12,
    textAlign: 'center',
    // backgroundColor: 'rgba(0,0,0,0.2)',
    paddingLeft: 3,
    paddingRight: 3,
  },
  listItemInfo: {
    flexGrow: 1,
    flexShrink: 1,
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  listItemAlbum: {
    flexDirection: 'row',
    marginTop: 3,
  },
  listItemLabel: {
    flex: 0,
  },
  listItemBtns: {
    flex: 0,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
  },
  listItemBtn: {
    padding: 5,
  },
  noitem: {
    paddingVertical: 35,
    alignItems: 'center',
  },
})


