import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import React, { useMemo } from 'react'
import { View, FlatList } from 'react-native'

import ListItem, { type PathItem } from './ListItem'


export default ({ list, onSetPath, toParentDir }: {
  list: PathItem[]
  onSetPath: (item: PathItem) => void
  toParentDir: () => void
}) => {
  const t = useI18n()
  const theme = useTheme()

  const ParentItemComponent = useMemo(() => (
    <View style={{ backgroundColor: theme['c-primary-light-700-alpha-900'] }}>
      <ListItem item={{
        name: '..',
        desc: t('parent_dir_name'),
        isDir: true,
        path: '',
      }} onPress={toParentDir} />
    </View>
  ), [t, theme, toParentDir])

  const ListComponent = useMemo(() => (
    <FlatList
      keyboardShouldPersistTaps={'always'}
      style={styles.list}
      data={list}
      renderItem={({ item }) => <ListItem item={item} onPress={onSetPath} />}
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

