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
  },
})
const LrcFontSize = () => {
  const theme = useGetter('common', 'theme')
  const playerPortraitStyle = useGetter('common', 'playerPortraitStyle')
  const setPlayerPortraitStyle = useDispatch('common', 'setPlayerPortraitStyle')
  const [sliderSize, setSliderSize] = useState(playerPortraitStyle.lrcFontSize)
  const [isSliding, setSliding] = useState(false)

  const handleSlidingStart = useCallback(value => {
    setSliding(true)
  }, [])
  const handleValueChange = useCallback(value => {
    setSliderSize(value)
  }, [])
  const handleSlidingComplete = useCallback(value => {
    if (playerPortraitStyle.lrcFontSize == value) return
    setPlayerPortraitStyle({ ...playerPortraitStyle, lrcFontSize: value })
    setSliding(false)
  }, [playerPortraitStyle, setPlayerPortraitStyle])

  return (
    <View style={LrcFontSizeStyles.content}>
      <Text style={{ color: theme.secondary10 }}>{isSliding ? sliderSize : playerPortraitStyle.lrcFontSize}</Text>
      <Slider
        minimumValue={100}
        maximumValue={300}
        onSlidingComplete={handleSlidingComplete}
        onValueChange={handleValueChange}
        onSlidingStart={handleSlidingStart}
        step={2}
        value={playerPortraitStyle.lrcFontSize}
      />
    </View>
  )
}

const Setting = ({ visible, hide }) => {
  return (
    <Popup
        visible={visible}
        hideDialog={hide}
        title=''
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
      <StatusBar backgroundColor="rgba(0,0,0,0)" barStyle="dark-content" translucent={true} />
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
    height: 40 + StatusBar.currentHeight,
    paddingTop: StatusBar.currentHeight,
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
    textAlign: 'center',
    fontSize: 15,
  },
  icon: {
    paddingLeft: 4,
    paddingRight: 4,
  },
})
