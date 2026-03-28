import { useRef, useImperativeHandle, forwardRef, useState, useCallback, memo, useEffect } from 'react'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import Dialog, { type DialogType } from '@/components/common/Dialog'
import { FlatList, TouchableOpacity, View, type FlatListProps as _FlatListProps } from 'react-native'
import { scaleSizeH } from '@/utils/pixelRatio'
import { useTheme } from '@/store/theme/hook'
import { type DuplicateMusicItem, filterDuplicateMusic } from './utils'
import { getListMusics, removeListMusics } from '@/core/list'
import { Icon } from '@/components/common/Icon'
import { useUnmounted } from '@/utils/hooks'
import { playList } from '@/core/player/player'
import { useI18n } from '@/lang'
import { handleRemove } from '../MusicList/listAction'
import Button from '@/components/common/Button'

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

const ListItem = memo(({ info, index, onRemove, onPlay, selectedList, onPress }: {
  info: DuplicateMusicItem
  index: number
  selectedList: DuplicateMusicItem[]
  onPlay: (info: DuplicateMusicItem) => void
  onRemove: (idx: number) => void
  onPress: (info: DuplicateMusicItem) => void
}) => {
  const theme = useTheme()
  const isSelected = selectedList.includes(info)

  return (
    <View style={{ ...styles.listItem, height: ITEM_HEIGHT, backgroundColor: isSelected ? theme['c-primary-background-hover'] : 'rgba(0,0,0,0)' }} onStartShouldSetResponder={() => true}>
      {/* <View style={styles.listItemLabel}>
        <Text style={styles.sn} size={13} color={theme['c-300']}>{info.index + 1}</Text>
      </View> */}
      <TouchableOpacity style={styles.listItemInfo} onPress={() => { onPress(info) }}>
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
      </TouchableOpacity>
      <View style={styles.listItemLabel}>
        <Text style={styles.listItemLabelText} size={13} color={theme['c-300']}>{ info.musicInfo.source }</Text>
        <Text style={styles.listItemLabelText} size={13} color={theme['c-300']}>{info.musicInfo.interval}</Text>
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
}, (prevProps, nextProps) => {
  return prevProps.info === nextProps.info &&
  prevProps.index === nextProps.index &&
  nextProps.selectedList.includes(nextProps.info) == prevProps.selectedList.includes(nextProps.info)
})

const handleRemoveList = (list: DuplicateMusicItem[], index: number) => {
  let prev = list[index - 1]
  let cur = list[index]
  let next = list[index + 1]
  let count = 1
  if (prev?.group != cur.group) {
    if (next?.group == cur.group && list[index + 2]?.group != cur.group) {
      count = 2
    }
  } else if (next?.group != cur.group) {
    if (prev?.group == cur.group && list[index - 2]?.group != cur.group) {
      index -= 1
      count = 2
    }
  }

  return list.splice(index, count)
}
const List = ({ listId }: { listId: string }) => {
  const [list, setList] = useState<DuplicateMusicItem[]>([])
  const [selectedList, setSelectedList] = useState<DuplicateMusicItem[]>([])
  const dataRef = useRef<[DuplicateMusicItem[], DuplicateMusicItem[]]>([[], []])
  const isUnmountedRef = useUnmounted()

  const handleFilterList = useCallback(() => {
    if (isUnmountedRef.current) return
    void getListMusics(listId).then((list) => {
      if (isUnmountedRef.current) return
      void filterDuplicateMusic(list).then((l) => {
        if (isUnmountedRef.current) return
        setSelectedList(dataRef.current[1] = [])
        setList(dataRef.current[0] = l)
      })
    })
  }, [isUnmountedRef, listId])
  const handlePlay = useCallback((info: DuplicateMusicItem) => {
    const { musicInfo } = info
    void getListMusics(listId).then((list) => {
      const idx = list.findIndex(m => m.id == musicInfo.id)
      if (idx < 0) return
      void playList(listId, idx)
    })
  }, [listId])
  const handleRemovePress = useCallback((index: number) => {
    const selectedList = dataRef.current[1]
    const list = dataRef.current[0]
    if (selectedList.length) {
      handleRemove(listId, list[index].musicInfo, selectedList.map(m => m.musicInfo), () => {
        let newList = [...list]
        for (const item of selectedList) {
          let idx = newList.indexOf(item)
          if (idx < 0) continue
          handleRemoveList(newList, idx)
        }
        setList(dataRef.current[0] = newList)
        setSelectedList(dataRef.current[1] = [])
      })
      return
    }
    let newList = [...list]
    let curItem = list[index]
    const rmItem = handleRemoveList(newList, index)
    let newSelectList = [...selectedList]
    for (const item of rmItem) {
      let idx = newSelectList.indexOf(item)
      if (idx < 0) continue
      newSelectList.splice(idx, 1)
    }
    setSelectedList(dataRef.current[1] = newSelectList)

    requestAnimationFrame(() => {
      void removeListMusics(listId, [curItem.musicInfo.id])
    })
    setList(dataRef.current[0] = newList)
  }, [listId])
  const handleSelect = useCallback((info: DuplicateMusicItem) => {
    setSelectedList(selectedList => {
      let nList = [...selectedList]
      let idx = nList.indexOf(info)
      if (idx < 0) nList.push(info)
      else nList.splice(idx, 1)
      dataRef.current[1] = nList
      return nList
    })
  }, [])

  useEffect(handleFilterList, [handleFilterList])

  const renderItem = useCallback(({ item, index }: { item: DuplicateMusicItem, index: number }) => {
    return <ListItem info={item} index={index} onPlay={handlePlay} onRemove={handleRemovePress} selectedList={selectedList} onPress={handleSelect} />
  }, [handlePlay, handleRemovePress, handleSelect, selectedList])
  const getkey = useCallback<NonNullable<FlatListProps['keyExtractor']>>(item => item.id, [])
  const getItemLayout = useCallback<NonNullable<FlatListProps['getItemLayout']>>((data, index) => {
    return { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
  }, [])

  return (
    list.length ? (
      <FlatList
        style={styles.list}
        maxToRenderPerBatch={4}
        windowSize={8}
        removeClippedSubviews={true}
        initialNumToRender={12}
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
  // sn: {
  //   width: 38,
  //   // fontSize: 12,
  //   textAlign: 'center',
  //   // backgroundColor: 'rgba(0,0,0,0.2)',
  //   paddingLeft: 3,
  //   paddingRight: 3,
  // },
  listItemInfo: {
    flexGrow: 1,
    flexShrink: 1,
    // backgroundColor: 'rgba(0,0,0,0.2)',
    paddingLeft: 15,
    paddingRight: 5,
  },
  listItemAlbum: {
    flexDirection: 'row',
    marginTop: 3,
  },
  listItemLabel: {
    flex: 0,
  },
  listItemLabelText: {
    paddingHorizontal: 5,
  },
  listItemBtns: {
    flex: 0,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
  },
  listItemBtn: {
    padding: 8,
  },
  noitem: {
    paddingVertical: 35,
    alignItems: 'center',
  },
})


