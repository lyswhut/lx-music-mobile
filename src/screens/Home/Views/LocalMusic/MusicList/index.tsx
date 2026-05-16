import { useCallback, useRef, useState } from 'react'
import { FlatList, View, type LayoutChangeEvent } from 'react-native'
import { playList } from '@/core/player/player'
import { LIST_IDS } from '@/config/constant'
import ListItem from './ListItem'
import ListMenu, { type ListMenuType } from './ListMenu'
import { createStyle } from '@/utils/tools'

const ITEM_HEIGHT = 54

type MusicListProps = {
  musics: LX.Music.MusicInfoLocal[]
}

export default ({ musics }: MusicListProps) => {
  const listMenuRef = useRef<ListMenuType>(null)
  const [listWidth, setListWidth] = useState(300)

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setListWidth(e.nativeEvent.layout.width)
  }, [])

  const handlePlay = useCallback(async (index: number) => {
    await playList(LIST_IDS.TEMP, index)
  }, [])

  const handleShowMenu = useCallback(
    (musicInfo: LX.Music.MusicInfoLocal, index: number) => {
      listMenuRef.current?.show({
        musicInfo,
        index,
      })
    },
    [],
  )

  const renderItem = useCallback(
    ({ item, index }: { item: LX.Music.MusicInfoLocal; index: number }) => (
      <ListItem
        musicInfo={item}
        index={index}
        listWidth={listWidth}
        onPlay={handlePlay}
        onShowMenu={handleShowMenu}
      />
    ),
    [listWidth, handlePlay, handleShowMenu],
  )

  return (
    <View style={{ flex: 1 }} onLayout={handleLayout}>
      <FlatList
        data={musics}
        renderItem={renderItem}
        keyExtractor={(_, index) => `${index}`}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        windowSize={10}
        removeClippedSubviews={true}
      />
      <ListMenu ref={listMenuRef} />
    </View>
  )
}

const styles = createStyle({})
