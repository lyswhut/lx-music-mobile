import React, { memo } from 'react'
import { View } from 'react-native'
import Button from '@/components/common/Button'

import { createStyle } from '@/utils/tools'
import { pop } from '@/navigation'
import { useTheme } from '@/store/theme/hook'
import commonState from '@/store/common/state'
import Text from '@/components/common/Text'
import { handleCollect, handlePlay } from './listAction'
import songlistState from '@/store/songlist/state'
import { useI18n } from '@/lang'
// import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()

  const back = () => {
    void pop(commonState.componentIds.songlistDetail as string)
  }

  const handlePlayAll = () => {
    if (!songlistState.listDetailInfo.info.name) return
    void handlePlay(songlistState.selectListInfo.id, songlistState.selectListInfo.source, songlistState.listDetailInfo.list)
  }

  const handleCollection = () => {
    if (!songlistState.listDetailInfo.info.name) return
    void handleCollect(songlistState.selectListInfo.id, songlistState.selectListInfo.source, songlistState.listDetailInfo.info.name || songlistState.selectListInfo.name)
  }

  return (
    <View style={styles.container}>
      <Button onPress={handleCollection} style={styles.controlBtn}>
        <Text style={{ ...styles.controlBtnText, color: theme['c-button-font'] }}>{t('collect_songlist')}</Text>
      </Button>
      <Button onPress={handlePlayAll} style={styles.controlBtn}>
        <Text style={{ ...styles.controlBtnText, color: theme['c-button-font'] }}>{t('play_all')}</Text>
      </Button>
      <Button onPress={back} style={styles.controlBtn}>
        <Text style={{ ...styles.controlBtnText, color: theme['c-button-font'] }}>{t('back')}</Text>
      </Button>
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    width: '100%',
    flexGrow: 0,
    flexShrink: 0,
  },
  controlBtn: {
    flexGrow: 1,
    flexShrink: 1,
    width: '33%',
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 10,
    paddingRight: 10,
  },
  controlBtnText: {
    fontSize: 13,
    textAlign: 'center',
  },
})

