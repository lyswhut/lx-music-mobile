import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle, getRowInfo } from '@/utils/tools'
import { useMemo, useRef } from 'react'
import { View, FlatList } from 'react-native'

import ListItem, { type PathItem } from './ListItem'


export default ({ list, onSetPath, toParentDir }: {
  list: PathItem[]
  onSetPath: (item: PathItem) => void
  toParentDir: () => void
}) => {
  const t = useI18n()
  const theme = useTheme()
  const rowInfo = useRef(getRowInfo('full'))
  const fullRow = useRef({ rowNum: undefined, rowWidth: '100%' } as const)

  const ParentItemComponent = useMemo(() => (
    <View style={{ backgroundColor: theme['c-primary-light-700-alpha-900'] }}>
      <ListItem item={{
        name: '..',
        desc: t('parent_dir_name'),
        isDir: true,
        path: '',
      }} rowInfo={fullRow.current} onPress={toParentDir} />
    </View>
  ), [t, theme, toParentDir])

  const ListComponent = useMemo(() => (
    <FlatList
      keyboardShouldPersistTaps={'always'}
      style={styles.list}
      data={list}
      numColumns={rowInfo.current.rowNum}
      renderItem={({ item }) => <ListItem item={item} rowInfo={rowInfo.current} onPress={onSetPath} />}
      keyExtractor={item => item.path + '/' + item.name}
      removeClippedSubviews={true}
    />
  ), [list, onSetPath])

  // const dirList = useMemo(() => [parentDir, ...list], [list, parentDir])

  return (
    <View style={styles.main}>
      {ParentItemComponent}
      {ListComponent}
    </View>
  )
}


const styles = createStyle({
  main: {
    flexGrow: 1,
    flexShrink: 1,
  },
  list: {
    flexGrow: 1,
    flexShrink: 1,
  },
})

