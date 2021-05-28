import React, { memo, useMemo } from 'react'
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native'

import { useGetter, useDispatch } from '@/store'
import { useTranslation } from '@/plugins/i18n'


export default memo(() => {
  const setSongList = useDispatch('common', 'setSongList')
  const sortList = useGetter('songList', 'sortList')
  const songListSource = useGetter('songList', 'songListSource')
  const songListSortId = useGetter('songList', 'songListSortId')
  // const currentSourceName = useGetter('search', 'currentSourceName')
  const theme = useGetter('common', 'theme')
  const { t } = useTranslation()

  const sorts = useMemo(() => {
    const list = songListSource ? [...sortList[songListSource]] : []
    // switch (songListSource) {
    //   case 'wy':
    //   case 'kw':
    //   case 'tx':
    //   case 'mg':
    //   case 'kg':
    //     list.push({
    //       name: t('view.song_list.open_list', { name: sources.find(s => s.id == songListSource).name }),
    //       id: 'importSongList',
    //     })
    // }
    return list.map(s => ({ label: t(`songlist_${s.tid}`), id: s.id }))
  }, [songListSource, sortList, t])


  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps={'always'} horizontal={true}>
      {
        sorts.map(s => (
          <TouchableOpacity style={styles.button} onPress={() => setSongList({ sortId: s.id })} key={s.id}>
            <Text style={{ ...styles.buttonText, color: songListSortId == s.id ? theme.secondary : theme.normal }}>{s.label}</Text>
          </TouchableOpacity>
        ))
      }
    </ScrollView>
    // <DorpDownMenu
    //   menus={sorts}
    //   width={80}
    //   onPress={({ id }) => setSongList({ sortId: id })}
    // >
    //   <Text style={styles.sourceMenu}>{currentSortName}</Text>
    // </DorpDownMenu>
  )
})


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    paddingLeft: 5,
    paddingRight: 5,
  },
  button: {
    // height: 38,
    // lineHeight: 38,
    // textAlign: 'center',
    // width: 80,
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
  buttonText: {
    // height: 38,
    // lineHeight: 38,
    textAlign: 'center',
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 10,
    paddingBottom: 10,
    // width: 80,
  },
})
