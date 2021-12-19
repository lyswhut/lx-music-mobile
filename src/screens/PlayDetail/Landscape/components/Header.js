import React, { memo, useState, useCallback } from 'react'

import { View, StyleSheet, StatusBar, TouchableOpacity, Text } from 'react-native'

import Icon from '@/components/common/Icon'
import { useGetter, useDispatch } from '@/store'
import { pop } from '@/navigation'
import Popup from '@/components/common/Popup'
import Slider from '@/components/common/Slider'
// import { AppColors } from '@/theme'

const LrcFontSizeStyles = StyleSheet.create({
  content: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 15,
  },
})
const LrcFontSize = () => {
  const theme = useGetter('common', 'theme')
  const playerLandscapeStyle = useGetter('common', 'playerLandscapeStyle')
  const setPlayerLandscapeStyle = useDispatch('common', 'setPlayerLandscapeStyle')
  const [sliderSize, setSliderSize] = useState(playerLandscapeStyle.lrcFontSize)
  const [isSliding, setSliding] = useState(false)

  const handleSlidingStart = useCallback(value => {
    setSliding(true)
  }, [])
  const handleValueChange = useCallback(value => {
    setSliderSize(value)
  }, [])
  const handleSlidingComplete = useCallback(value => {
    if (playerLandscapeStyle.lrcFontSize == value) return
    setPlayerLandscapeStyle({ ...playerLandscapeStyle, lrcFontSize: value })
    setSliding(false)
  }, [playerLandscapeStyle, setPlayerLandscapeStyle])

  return (
    <View style={LrcFontSizeStyles.content}>
      <Text style={{ color: theme.secondary10 }}>{isSliding ? sliderSize : playerLandscapeStyle.lrcFontSize}</Text>
      <Slider
        minimumValue={120}
        maximumValue={380}
        onSlidingComplete={handleSlidingComplete}
        onValueChange={handleValueChange}
        onSlidingStart={handleSlidingStart}
        step={2}
        value={playerLandscapeStyle.lrcFontSize}
      />
    </View>
  )
}

const Setting = ({ visible, hide }) => {
  return (
    <Popup
        visible={visible}
        hideDialog={hide}
        position='left'
        style={{ width: '35%' }}
      >
        <LrcFontSize />
      </Popup>
  )
}

export default memo(() => {
  const theme = useGetter('common', 'theme')
  const playMusicInfo = useGetter('player', 'playMusicInfo')
  const componentIds = useGetter('common', 'componentIds')

  const [settingVisible, setSettingVisible] = useState(false)

  const back = () => {
    pop(componentIds.playDetail)
  }
  const showSetting = () => {
    setSettingVisible(true)
  }

  return (
    <View style={{ ...styles.header, backgroundColor: theme.primary }} nativeID="header">
      <View style={{ ...styles.container }}>
        <TouchableOpacity onPress={back} style={styles.button}>
          <Icon name="chevron-left" style={{ color: theme.normal }} size={24} />
        </TouchableOpacity>
        <View style={styles.titleContent}>
          <Text numberOfLines={1} style={{ ...styles.title, color: theme.normal10 }}>{playMusicInfo.musicInfo?.name}</Text>
          <Text numberOfLines={1} style={{ ...styles.title, color: theme.normal20, fontSize: 12 }}>{playMusicInfo.musicInfo?.singer}</Text>
        </View>
        <TouchableOpacity onPress={showSetting} style={styles.button}>
          <Icon name="font-size" style={{ color: theme.normal30 }} size={24} />
        </TouchableOpacity>
      </View>
      <Setting visible={settingVisible} hide={() => setSettingVisible(false)} />
    </View>
  )
})


const styles = StyleSheet.create({
  header: {
    height: 40,
  },
  container: {
    flexDirection: 'row',
    // justifyContent: 'center',
    height: 40,
  },
  button: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 0,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    flex: 1,
    // textAlign: 'center',
    fontSize: 14,
  },
  icon: {
    paddingLeft: 4,
    paddingRight: 4,
  },
})
