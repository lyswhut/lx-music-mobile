import { memo } from 'react'
import { View } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import Text from '@/components/common/Text'
import Badge from '@/components/common/Badge'
import { LIST_ITEM_HEIGHT } from '@/config/constant'
import type { ListeningSongEntry } from '@/utils/data'

export const ITEM_HEIGHT = scaleSizeH(LIST_ITEM_HEIGHT + 12)

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${secs}s`
  return `${secs}s`
}

export default memo(({ item, index, maxDuration }: {
  item: ListeningSongEntry
  index: number
  maxDuration: number
}) => {
  const theme = useTheme()
  const barWidthPercent = maxDuration > 0
    ? Math.max((item.duration / maxDuration) * 100, 2)
    : 0

  const isTopThree = index < 3

  return (
    <View style={{ ...styles.container, height: ITEM_HEIGHT }}>
      <View style={styles.topRow}>
        <Text
          style={styles.rank}
          size={13}
          color={isTopThree ? theme['c-primary-font'] : theme['c-300']}
        >
          {index + 1}
        </Text>
        <View style={styles.info}>
          <Text color={theme['c-font']} numberOfLines={1}>{item.name}</Text>
          <View style={styles.singerRow}>
            <Badge>{item.source.toUpperCase()}</Badge>
            <Text
              size={11}
              color={theme['c-500']}
              numberOfLines={1}
              style={styles.singerText}
            >
              {item.singer}
            </Text>
          </View>
        </View>
        <Text size={12} color={theme['c-250']}>{formatDuration(item.duration)}</Text>
      </View>
      <View style={styles.barContainer}>
        <View style={{ ...styles.barBackground, backgroundColor: theme['c-primary-background-hover'] }}>
          <View style={{
            ...styles.barFill,
            width: `${barWidthPercent}%`,
            backgroundColor: isTopThree ? theme['c-primary'] : theme['c-primary-alpha-400'],
          }} />
        </View>
      </View>
    </View>
  )
}, (prev, next) =>
  prev.item === next.item &&
  prev.index === next.index &&
  prev.maxDuration === next.maxDuration,
)

const styles = createStyle({
  container: {
    paddingLeft: 3,
    paddingRight: 10,
    paddingTop: 4,
    paddingBottom: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rank: {
    width: 38,
    textAlign: 'center',
    paddingLeft: 3,
    paddingRight: 3,
  },
  info: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 8,
  },
  singerRow: {
    paddingTop: 2,
    flexDirection: 'row',
  },
  singerText: {
    flexGrow: 0,
    flexShrink: 1,
    fontWeight: '300',
  },
  barContainer: {
    paddingLeft: 38,
    paddingRight: 0,
    paddingTop: 4,
  },
  barBackground: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
})
