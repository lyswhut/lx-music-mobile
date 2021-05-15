import React, { useMemo } from 'react'
import { View, StyleSheet, FlatList, Text } from 'react-native'
import { useTranslation } from '@/plugins/i18n'

import ListItem from './ListItem'


export default ({ granted, list, onSetPath, toParentDir }) => {
  const { t } = useTranslation()

  const ParentItemComponent = useMemo(() => (
    <ListItem style={{ flexGrow: 0, flexShrink: 0 }} item={{
      name: '..',
      desc: t('parent_dir_name'),
      isDir: true,
    }} onPress={toParentDir} />
  ), [t, toParentDir])

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
      {
        granted
          ? <>
              {ParentItemComponent}
              {ListComponent}
            </>
          : null
      }
    </View>
  )
}


const styles = StyleSheet.create({
  main: {
    flexGrow: 1,
    flexShrink: 1,
  },
  list: {
    flexGrow: 1,
    flexShrink: 1,
  },
})

