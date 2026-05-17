import { useMemo } from 'react'
import { ScrollView, View } from 'react-native'

import Text from '@/components/common/Text'
import { useMySonglists } from '@/store/list/hook'
import ListItem, { styles as listStyles } from './ListItem'
import { useWindowSize } from '@/utils/hooks'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import { scaleSizeW } from '@/utils/pixelRatio'

const styles = createStyle({
  list: {
    paddingLeft: 15,
    paddingRight: 2,
    paddingBottom: 5,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyTip: {
    textAlign: 'center',
    paddingVertical: 20,
  },
})
const MIN_WIDTH = scaleSizeW(140)
const PADDING = styles.list.paddingLeft + styles.list.paddingRight

export default ({ listId, onPress }: {
  listId: string
  onPress: (listInfo: LX.List.MyListInfo) => void
}) => {
  const windowSize = useWindowSize()
  const allList = useMySonglists().filter(l => l.id != listId)
  const t = useI18n()
  const theme = useTheme()
  const itemWidth = useMemo(() => {
    let w = Math.floor(windowSize.width * 0.9 - PADDING)
    let n = Math.floor(w / MIN_WIDTH)
    if (n > 10) n = 10
    return Math.floor((w - 1) / n)
  }, [windowSize])

  if (allList.length === 0) {
    return (
      <Text style={styles.emptyTip} size={14} color={theme['c-font-label']}>
        {t('no_songlist_tip')}
      </Text>
    )
  }

  return (
    <ScrollView style={{ flexGrow: 0 }}>
      <View style={{ ...styles.list }} onStartShouldSetResponder={() => true}>
        { allList.map(info => <ListItem key={info.id} listInfo={info} onPress={onPress} width={itemWidth} />) }
      </View>
    </ScrollView>
  )
}
