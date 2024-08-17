import { useRef, useImperativeHandle, forwardRef, useState, useCallback, memo, useEffect } from 'react'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import Dialog, { type DialogType } from '@/components/common/Dialog'
import { FlatList, ScrollView, TouchableOpacity, View, type FlatListProps as _FlatListProps } from 'react-native'
import { scaleSizeH } from '@/utils/pixelRatio'
import { useTheme } from '@/store/theme/hook'
import { Icon } from '@/components/common/Icon'
import { useHorizontalMode, useUnmounted } from '@/utils/hooks'
import { useI18n } from '@/lang'
import Button from '@/components/common/Button'
import { useSourceListI18n } from '@/components/SourceSelector'
import { searchMusic } from '@/utils/musicSdk'
import { toNewMusicInfo } from '@/utils'
import { handleShowMusicSourceDetail, handleToggleSource } from './listAction'
import { BorderRadius, BorderWidths } from '@/theme'

type FlatListProps = _FlatListProps<LX.Music.MusicInfoOnline>
const ITEM_HEIGHT = scaleSizeH(56)


const Tabs = <T extends LX.OnlineSource>({ list, source, onChangeSource }: {
  list: T[]
  source: T | ''
  onChangeSource: (source: T) => void
}) => {
  const list_t = useSourceListI18n(list)
  const theme = useTheme()
  const scrollViewRef = useRef<ScrollView>(null)

  return (
    <ScrollView ref={scrollViewRef} style={styles.tabContainer} keyboardShouldPersistTaps={'always'} horizontal>
      {
        list_t.map(s => (
          <TouchableOpacity
            style={{ ...styles.tabButton, borderBottomColor: source == s.action ? theme['c-primary-background-active'] : 'transparent' }}
            onPress={() => {
              onChangeSource(s.action as T)
            }}
            key={s.action}
          >
            <Text style={styles.tabButtonText} color={source == s.action ? theme['c-primary-font-active'] : theme['c-font']}>{s.label}</Text>
          </TouchableOpacity>
        ))
      }
    </ScrollView>
  )
}

const Empty = ({ loading, error, onReload }: { loading: boolean, error: boolean, onReload: () => void }) => {
  const theme = useTheme()
  const t = useI18n()
  const label = loading
    ? t('list_loading')
    : error
      ? t('list_error')
      : t('no_item')
  return (
    <View style={styles.noitem}>
      {
        error ? (
          <Text onPress={onReload} color={theme['c-font-label']}>{label}</Text>
        ) : (
          <Text color={theme['c-font-label']}>{label}</Text>
        )
      }
    </View>
  )
}

const ListItem = memo(({ info, onToggleSource, onOpenDetail }: {
  info: LX.Music.MusicInfoOnline
  onToggleSource: (info: LX.Music.MusicInfoOnline) => void
  onOpenDetail: (info: LX.Music.MusicInfoOnline) => void
}) => {
  const theme = useTheme()

  return (
    <View style={{ ...styles.listItem, height: ITEM_HEIGHT }} onStartShouldSetResponder={() => true}>
      {/* <View style={styles.listItemLabel}>
        <Text style={styles.sn} size={13} color={theme['c-300']}>{info.index + 1}</Text>
      </View> */}
      <View style={styles.listItemInfo}>
        <Text color={theme['c-font']} size={14} numberOfLines={1}>{info.name}</Text>
        <View style={styles.listItemAlbum}>
          <Text color={theme['c-font']} size={12} numberOfLines={1}>
            {info.singer}
            {
              info.meta.albumName ? (
                <Text color={theme['c-font-label']} size={12} numberOfLines={1}> ({info.meta.albumName})</Text>
              ) : null
            }
          </Text>
        </View>
      </View>
      <View style={styles.listItemLabel}>
        {/* <Text style={styles.listItemLabelText} size={13} color={theme['c-300']}>{ info.source }</Text> */}
        <Text style={styles.listItemLabelText} size={13} color={theme['c-300']}>{info.interval}</Text>
      </View>
      <View style={styles.listItemBtns}>
        <Button style={styles.listItemBtn} onPress={() => { onOpenDetail(info) }}>
          <Icon name="share" style={{ color: theme['c-button-font'] }} size={18} />
        </Button>
        <Button style={styles.listItemBtn} onPress={() => { onToggleSource(info) }}>
          <Icon name="play" style={{ color: theme['c-button-font'] }} size={18} />
        </Button>
      </View>
    </View>
  )
}, (prevProps, nextProps) => {
  return prevProps.info === nextProps.info
})

const List = ({ source, lists, onToggleSource }: {
  source: LX.OnlineSource | ''
  lists: Partial<Record<LX.OnlineSource, LX.Music.MusicInfoOnline[]>>
  onToggleSource: (info?: LX.Music.MusicInfoOnline | null) => void
}) => {
  const [list, setList] = useState<LX.Music.MusicInfoOnline[]>([])
  const isFirstRef = useRef(true)
  useEffect(() => {
    if (isFirstRef.current) {
      setList(lists[source as LX.OnlineSource] ?? [])
      isFirstRef.current = false
      return
    }
    requestAnimationFrame(() => {
      setList(lists[source as LX.OnlineSource] ?? [])
    })
  }, [lists, source])

  const openDetail = useCallback((musicInfo: LX.Music.MusicInfoOnline) => {
    void handleShowMusicSourceDetail(musicInfo)
  }, [])

  const renderItem = useCallback(({ item }: { item: LX.Music.MusicInfoOnline, index: number }) => {
    return <ListItem info={item} onToggleSource={onToggleSource} onOpenDetail={openDetail} />
  }, [onToggleSource, openDetail])
  const getkey = useCallback<NonNullable<FlatListProps['keyExtractor']>>(item => item.id, [])
  const getItemLayout = useCallback<NonNullable<FlatListProps['getItemLayout']>>((data, index) => {
    return { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
  }, [])

  return (
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
  )
}

const SourceDetail = ({ info, onToggleSource }: { info: LX.Music.MusicInfo, onToggleSource: (info?: LX.Music.MusicInfoOnline | null) => void }) => {
  const theme = useTheme()
  const isHorizontalMode = useHorizontalMode()

  const cleanToggle = useCallback(() => {
    onToggleSource(null)
  }, [onToggleSource])

  const toggleSource = info.meta.toggleMusicInfo
  return isHorizontalMode ? (
    <View style={styles.detailContainer}>
      <View style={styles.detailContainerX}>
      <View style={styles.detailInfo}>
        <View style={styles.detailInfoName}>
          <Text style={styles.detailInfoNameText} color={theme['c-font']} size={13} numberOfLines={2}>
            {info.name}
          </Text>
          <Text style={styles.detailInfoLabelText} size={12} color={theme['c-primary']}>{info.source}</Text>
          <Text style={styles.detailInfoLabelText} size={12} color={theme['c-primary']}>{info.interval}</Text>
        </View>
        <View style={styles.listItemAlbum}>
          <Text color={theme['c-font']} size={12} numberOfLines={1}>
            {info.singer}
            {
              info.meta.albumName ? (
                <Text color={theme['c-font-label']} size={12} numberOfLines={1}> ({info.meta.albumName})</Text>
              ) : null
            }
          </Text>
        </View>
      </View>
      {
        toggleSource ? (
          <>
            <Text>→</Text>
            <View style={styles.detailInfo}>
              <View style={styles.detailInfoName}>
                <Text style={styles.detailInfoNameText} color={theme['c-font']} size={13} numberOfLines={2}>
                  {toggleSource.name}
                </Text>
                <Text style={styles.detailInfoLabelText} size={12} color={theme['c-primary']}>{toggleSource.source}</Text>
                <Text style={styles.detailInfoLabelText} size={12} color={theme['c-primary']}>{toggleSource.interval}</Text>
              </View>
              <View style={styles.listItemAlbum}>
                <Text color={theme['c-font']} size={12} numberOfLines={1}>
                  {toggleSource.singer}
                  {
                    toggleSource.meta.albumName ? (
                      <Text color={theme['c-font-label']} size={12} numberOfLines={1}> ({toggleSource.meta.albumName})</Text>
                    ) : null
                  }
                </Text>
              </View>
            </View>
          </>
        ) : null
      }
      </View>
      <Button
        onPress={cleanToggle}
        style={{ ...styles.button, backgroundColor: theme['c-button-background'] }}
        disabled={!toggleSource}
      >
        <Text color={theme['c-button-font']}>取消换源</Text>
      </Button>
    </View>
  ) : (
    <View style={styles.detailContainer}>
      <View style={styles.detailContainerY}>
        <View style={styles.detailInfo}>
          <View style={styles.detailInfoName}>
            <Text style={styles.detailInfoNameText} color={theme['c-font']} size={14} numberOfLines={2}>
              {info.name}
            </Text>
            <Text style={styles.detailInfoLabelText} size={12} color={theme['c-primary']}>{info.source}</Text>
            <Text style={styles.detailInfoLabelText} size={12} color={theme['c-primary']}>{info.interval}</Text>
          </View>
          <View style={styles.listItemAlbum}>
            <Text color={theme['c-font']} size={12} numberOfLines={1}>
              {info.singer}
              {
                info.meta.albumName ? (
                  <Text color={theme['c-font-label']} size={12} numberOfLines={1}> ({info.meta.albumName})</Text>
                ) : null
              }
            </Text>
          </View>
        </View>
        {
          toggleSource ? (
            <>
              <Text>↓</Text>
              <View style={styles.detailInfo}>
                <View style={styles.detailInfoName}>
                  <Text style={styles.detailInfoNameText} color={theme['c-font']} size={14} numberOfLines={2}>
                    {toggleSource.name}
                  </Text>
                  <Text style={styles.detailInfoLabelText} size={12} color={theme['c-primary']}>{toggleSource.source}</Text>
                  <Text style={styles.detailInfoLabelText} size={12} color={theme['c-primary']}>{toggleSource.interval}</Text>
                </View>
                <View style={styles.listItemAlbum}>
                  <Text color={theme['c-font']} size={12} numberOfLines={1}>
                    {toggleSource.singer}
                    {
                      toggleSource.meta.albumName ? (
                        <Text color={theme['c-font-label']} size={12} numberOfLines={1}> ({toggleSource.meta.albumName})</Text>
                      ) : null
                    }
                  </Text>
                </View>
              </View>
            </>
          ) : null
        }
      </View>
      <Button
        onPress={cleanToggle}
        style={{ ...styles.button, backgroundColor: theme['c-button-background'] }}
        disabled={!toggleSource}
      >
        <Text color={theme['c-button-font']}>取消换源</Text>
      </Button>
    </View>
  )
}


interface ModalType {
  show: (info: SelectInfo) => void
}
const initInfo = {}

const Modal = forwardRef<ModalType, {}>((props, ref) => {
  const [info, setInfo] = useState<SelectInfo>(initInfo as SelectInfo)
  const [sourceInfo, setSourceInfo] = useState<{
    sourceInfo: LX.OnlineSource[]
    lists: Partial<Record<LX.OnlineSource, LX.Music.MusicInfoOnline[]>>
    loading: boolean
    error: boolean
  }>({ sourceInfo: [], lists: {}, loading: false, error: false })
  const [source, setSource] = useState<LX.OnlineSource | ''>('')
  const dialogRef = useRef<DialogType>(null)
  const isUnmountedRef = useUnmounted()

  const loadData = useCallback((selectInfo: SelectInfo = info) => {
    setSourceInfo({ sourceInfo: [], lists: {}, loading: true, error: false })
    searchMusic({
      name: selectInfo.musicInfo.name,
      singer: selectInfo.musicInfo.singer,
      source: '',
    }).then((result: Array<{ source: LX.OnlineSource, list: LX.Music.MusicInfoOnline[] }>) => {
      if (isUnmountedRef.current) return
      const tags: LX.OnlineSource[] = []
      const lists: Partial<Record<LX.OnlineSource, LX.Music.MusicInfoOnline[]>> = {}
      for (const s of result) {
        tags.push(s.source)
        lists[s.source] = s.list.map(s => toNewMusicInfo(s) as LX.Music.MusicInfoOnline)
      }
      setSourceInfo({ sourceInfo: tags, lists, loading: false, error: false })
      if (tags.length) setSource(tags[0])
    }).catch(() => {
      if (isUnmountedRef.current) return
      setSourceInfo({ ...sourceInfo, error: true })
    })
  }, [info, isUnmountedRef, sourceInfo])
  useImperativeHandle(ref, () => ({
    show(info) {
      setInfo(info)
      setSource('')
      loadData(info)
      requestAnimationFrame(() => {
        dialogRef.current?.setVisible(true)
      })
    },
  }))

  const toggleSource = useCallback((musicInfo?: LX.Music.MusicInfoOnline | null) => {
    const newInfo = handleToggleSource(info.listId, info.musicInfo, musicInfo)
    if (newInfo) {
      setInfo({ ...info, musicInfo: newInfo })
    } else dialogRef.current?.setVisible(false)
  }, [info])

  return (
    <Dialog ref={dialogRef}>
      <View style={styles.container}>
        {
          sourceInfo.sourceInfo.length
            ? (<>
                <Tabs
                  list={sourceInfo.sourceInfo}
                  source={source}
                  onChangeSource={setSource}
                />
                <List
                  source={source}
                  lists={sourceInfo.lists}
                  onToggleSource={toggleSource}
                />
              </>)
            : <Empty loading={sourceInfo.loading} error={sourceInfo.error} onReload={loadData} />
        }
        <SourceDetail info={info.musicInfo} onToggleSource={toggleSource} />
      </View>
    </Dialog>
  )
})

export interface SelectInfo {
  musicInfo: LX.Music.MusicInfo
  listId: string
}
export interface MusicToggleModalType {
  show: (listInfo: SelectInfo) => void
}

export default forwardRef<MusicToggleModalType, {}>((props, ref) => {
  const musicAddModalRef = useRef<ModalType>(null)
  const [visible, setVisible] = useState(false)

  useImperativeHandle(ref, () => ({
    show(musicInfo) {
      if (visible) musicAddModalRef.current?.show(musicInfo)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          musicAddModalRef.current?.show(musicInfo)
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
    flexGrow: 1,
    flexShrink: 1,
    width: 600,
    maxWidth: '100%',
  },
  tabContainer: {
    flexGrow: 0,
    flexShrink: 0,
    // paddingLeft: 5,
    // paddingRight: 5,
    paddingVertical: 6,
  },
  tabButton: {
    // height: 38,
    // lineHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 6,
    // width: 80,
    // backgroundColor: 'rgba(0,0,0,0.1)',
    borderBottomWidth: BorderWidths.normal3,
  },
  tabButtonText: {
    // height: 38,
    // lineHeight: 38,
    textAlign: 'center',
    paddingHorizontal: 2,
    paddingVertical: 5,
  },
  list: {
    flexGrow: 1,
    flexShrink: 1,
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

  detailContainer: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  detailContainerY: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    gap: 5,
  },
  detailContainerX: {
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 1,
    gap: 5,
    alignItems: 'center',
  },
  detailInfo: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'column',
    // width: '50%',
    justifyContent: 'center',
  },
  detailInfoName: {
    gap: 5,
    flexDirection: 'row',
    flexGrow: 0,
    flexShrink: 1,
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  detailInfoNameText: {
    // backgroundColor: 'rgba(0,0,0,0.2)',
    flexShrink: 1,
    flexGrow: 0,
  },
  detailInfoLabelText: {
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  noitem: {
    flexGrow: 1,
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    borderRadius: BorderRadius.normal,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
})


