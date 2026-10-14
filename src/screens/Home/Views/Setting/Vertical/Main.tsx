import { memo, useCallback, useRef, useState } from 'react'
import { FlatList, View, type FlatListProps, type ViewToken } from 'react-native'

import Basic from '../settings/Basic'
import Player from '../settings/Player'
import LyricDesktop from '../settings/LyricDesktop'
import Search from '../settings/Search'
import List from '../settings/List'
import Sync from '../settings/Sync'
import Backup from '../settings/Backup'
import Other from '../settings/Other'
import Version from '../settings/Version'
import About from '../settings/About'
import { createStyle } from '@/utils/tools'
import { SETTING_SCREENS, type SettingScreenIds } from '../Main'
import SettingTabs from './SettingTabs'

type FlatListType = FlatListProps<SettingScreenIds>


const styles = createStyle({
  container: {
    flex: 1,
  },
  content: {
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 15,
    paddingBottom: 15,
    flex: 0,
  },
})

const ListItem = memo(({
  id,
}: { id: SettingScreenIds }) => {
  switch (id) {
    case 'player': return <Player />
    case 'lyric_desktop': return <LyricDesktop />
    case 'search': return <Search />
    case 'list': return <List />
    case 'sync': return <Sync />
    case 'backup': return <Backup />
    case 'other': return <Other />
    case 'version': return <Version />
    case 'about': return <About />
    case 'basic': return <Basic />
  }
}, () => true)

export default () => {
  const flatListRef = useRef<FlatList<SettingScreenIds>>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const renderItem: FlatListType['renderItem'] = ({ item }) => <ListItem id={item} />
  const getkey: FlatListType['keyExtractor'] = item => item

  const handleTabChange = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0, viewOffset: 4 })
    setActiveIndex(index)
  }, [])

  const handleScrollToIndexFailed = useCallback((info: {
    index: number
    highestMeasuredFrameIndex: number
    averageItemLength: number
  }) => {
    // 目标分区尚未渲染时，先按平均高度滚动到附近，待渲染完成后再精确定位
    flatListRef.current?.scrollToOffset({
      offset: info.averageItemLength * info.index,
      animated: true,
    })
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: info.index, animated: false, viewPosition: 0, viewOffset: 4 })
    }, 350)
  }, [])

  const handleViewableItemsChanged = useCallback(({ viewableItems }: {
    viewableItems: Array<ViewToken<SettingScreenIds>>
  }) => {
    const first = viewableItems[0]
    if (first?.index != null) setActiveIndex(prev => prev == first.index ? prev : first.index)
  }, [])

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 40 }).current

  return (
    <View style={styles.container}>
      <SettingTabs activeIndex={activeIndex} onChange={handleTabChange} />
      <FlatList
        ref={flatListRef}
        data={SETTING_SCREENS}
        keyboardShouldPersistTaps={'always'}
        renderItem={renderItem}
        keyExtractor={getkey}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        contentContainerStyle={styles.content}
        maxToRenderPerBatch={2}
        // updateCellsBatchingPeriod={80}
        windowSize={9}
        // removeClippedSubviews={true}
        initialNumToRender={3}
      />
    </View>
  )
}
