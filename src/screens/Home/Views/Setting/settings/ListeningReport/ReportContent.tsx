import { memo, useState, useEffect, useCallback } from 'react'
import { View, FlatList, type FlatListProps } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { getYearlyListening, type ListeningSongEntry } from '@/utils/data'
import ListItem, { ITEM_HEIGHT } from './ListItem'

type FlatListType = FlatListProps<ListeningSongEntry>

const formatTotalDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const [songs, setSongs] = useState<ListeningSongEntry[]>([])
  const [maxDuration, setMaxDuration] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    void getYearlyListening().then(data => {
      setYear(data.year)
      const sorted = Object.values(data.songs)
        .sort((a, b) => b.duration - a.duration || b.lastPlayed - a.lastPlayed)
      setSongs(sorted)
      const max = sorted.length > 0 ? sorted[0].duration : 0
      setMaxDuration(max)
      const total = sorted.reduce((sum, s) => sum + s.duration, 0)
      setTotalDuration(total)
    })
  }, [])

  const renderItem: FlatListType['renderItem'] = useCallback(({ item, index }) => (
    <ListItem
      item={item}
      index={index}
      maxDuration={maxDuration}
    />
  ), [maxDuration])

  const keyExtractor: FlatListType['keyExtractor'] = useCallback(item => item.id, [])

  const getItemLayout: FlatListType['getItemLayout'] = useCallback((data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), [])

  return (
    <View>
      <View style={styles.summary}>
        <Text size={14} color={theme['c-font']}>
          {t('setting_listening_report_summary', {
            year: year.toString(),
            count: songs.length.toString(),
            duration: formatTotalDuration(totalDuration),
          })}
        </Text>
      </View>

      {songs.length > 0 ? (
        <FlatList
          data={songs}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          scrollEnabled={false}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
        />
      ) : (
        <Text style={styles.empty} color={theme['c-300']}>
          {t('setting_listening_report_empty')}
        </Text>
      )}
    </View>
  )
})

const styles = createStyle({
  summary: {
    paddingLeft: 15,
    paddingRight: 15,
    paddingBottom: 15,
  },
  empty: {
    paddingLeft: 15,
    paddingRight: 15,
    paddingBottom: 15,
    textAlign: 'center',
  },
})
