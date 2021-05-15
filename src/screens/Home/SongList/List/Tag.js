import React, { memo, useMemo, useEffect, useCallback, useState } from 'react'
import { StyleSheet, Text, View, ScrollView } from 'react-native'

import { useGetter, useDispatch } from '@/store'
// import { useTranslation } from '@/plugins/i18n'
import DorpDownPanel from '@/components/common/DorpDownPanel'
import Button from '@/components/common/Button'
import { BorderWidths } from '@/theme'

const TagType = ({ name, list, setTagInfo, activeId }) => {
  const theme = useGetter('common', 'theme')
  return (
    <View>
      <Text style={{ ...styles.tagTypeTitle, color: theme.normal30 }}>{name}</Text>
      <View style={styles.tagTypeList}>
        {list.map(item => (
          <Button style={{ ...styles.tagButton, backgroundColor: theme.secondary45 }} key={item.id} onPress={() => setTagInfo(item.name, item.id)}>
            <Text style={{ ...styles.tagButtonText, color: activeId == item.id ? theme.secondary : theme.normal10 }}>{item.name}</Text>
          </Button>
        ))}
      </View>
    </View>
  )
}

const Tags = memo(({ setVisiblePanel }) => {
  const theme = useGetter('common', 'theme')
  const tags = useGetter('songList', 'tags')
  const songListSource = useGetter('songList', 'songListSource')
  const setSongList = useDispatch('common', 'setSongList')
  const songListTagInfo = useGetter('songList', 'songListTagInfo')
  // console.log('render')
  const tagsList = useMemo(() => {
    let tagInfo = tags[songListSource]
    return tagInfo ? [{ name: '热门', list: [...tagInfo.hotTag] }, ...tagInfo.tags] : []
  }, [songListSource, tags])
  const setTagInfo = useCallback((name, id) => {
    setVisiblePanel(false)
    setSongList({ tagInfo: { name, id } })
  }, [setSongList, setVisiblePanel])
  return (
    <View style={{ ...styles.container, borderBottomColor: theme.secondary10 }}>
      <ScrollView style={{ flexShrink: 1, flexGrow: 0 }} keyboardShouldPersistTaps={'always'}>
        <View style={{ ...styles.tagContainer, backgroundColor: theme.primary }} onStartShouldSetResponder={() => true}>
          <View style={{ ...styles.tagTypeList, marginTop: 10 }}>
            <Button style={{ ...styles.tagButton, backgroundColor: theme.secondary45 }} onPress={() => setTagInfo('默认', null)}>
              <Text style={{ ...styles.tagButtonText, color: songListTagInfo.id == null ? theme.secondary : theme.normal10 }}>默认</Text>
            </Button>
          </View>
          {tagsList.map((type, index) => <TagType key={index} name={type.name} list={type.list} activeId={songListTagInfo.id} setTagInfo={setTagInfo} />)}
        </View>
      </ScrollView>
    </View>
  )
})


export default memo(() => {
  const songListSource = useGetter('songList', 'songListSource')
  const songListTagInfo = useGetter('songList', 'songListTagInfo')
  // const currentSourceName = useGetter('search', 'currentSourceName')
  const theme = useGetter('common', 'theme')
  const getTags = useDispatch('songList', 'getTags')
  const [visiblePanel, setVisiblePanel] = useState(false)

  // useEffect(() => {
  //   getTags()
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [])
  useEffect(() => {
    getTags()
  }, [getTags, songListSource])


  // console.log('render tags')

  return (
    <DorpDownPanel
      visible={visiblePanel}
      setVisible={setVisiblePanel}
      PanelContent={<Tags setVisiblePanel={setVisiblePanel} />}
    >
      <Text style={{ ...styles.sourceMenu, color: theme.normal }}>{songListTagInfo.name}</Text>
    </DorpDownPanel>
  )
})


const styles = StyleSheet.create({
  sourceMenu: {
    height: 38,
    lineHeight: 38,
    textAlign: 'center',
    minWidth: 70,
    paddingLeft: 10,
    paddingRight: 10,
  },

  container: {
    borderBottomWidth: BorderWidths.normal2,
  },
  tagContainer: {
    paddingLeft: 15,
    paddingBottom: 15,
  },
  tagTypeTitle: {
    marginTop: 15,
    marginBottom: 10,
  },
  tagTypeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagButton: {
    // marginRight: 10,
    borderRadius: 4,
    marginRight: 10,
    marginBottom: 10,
  },
  tagButtonText: {
    fontSize: 13,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
})
