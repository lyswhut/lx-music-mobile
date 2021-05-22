import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { StyleSheet, Animated } from 'react-native'
import List from './List'
// import { requestStoragePermission } from '@/utils/common'
import { useGetter, useDispatch } from '@/store'


export default () => {
  const [visible, setVisible] = useState(false)
  const [animatePlayed, setAnimatPlayed] = useState(true)
  const animFade = useRef(new Animated.Value(0)).current
  const animScale = useRef(new Animated.Value(0)).current

  const theme = useGetter('common', 'theme')
  const isVisibleListDetail = useGetter('songList', 'isVisibleListDetail')
  const selectListInfo = useGetter('songList', 'selectListInfo')
  const getListDetail = useDispatch('songList', 'getListDetail')

  useEffect(() => {
    setAnimatPlayed(true)
    if (isVisibleListDetail) {
      animFade.setValue(1)
      animScale.setValue(1)
      setVisible(true)
    } else {
      animFade.setValue(0)
      animScale.setValue(0)
      setVisible(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGetListDetail = useCallback((id, page) => {
    // isGetDetailFailedRef.current = false
    return getListDetail({ id, page }).catch(err => {
      // isGetDetailFailedRef.current = true
      return Promise.reject(err)
    })
  }, [getListDetail])

  const showList = useCallback(() => {
    // console.log('show List')
    if (selectListInfo.id) {
      handleGetListDetail(selectListInfo.id, 1)
    }
    setVisible(true)
    setAnimatPlayed(false)
    animScale.setValue(1.2)

    Animated.parallel([
      Animated.timing(animFade, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAnimatPlayed(true)
    })
  }, [animFade, animScale, handleGetListDetail, selectListInfo])

  const hideList = useCallback(() => {
    setAnimatPlayed(false)
    Animated.parallel([
      Animated.timing(animFade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      // Animated.timing(this.state.animates.translateY, {
      //   toValue: 20,
      //   duration: time,
      //   useNativeDriver: true,
      // }),
      // Animated.timing(animFade, {
      //   toValue: 0.8,
      //   duration: time,
      //   useNativeDriver: true,
      // }),
    ]).start(finished => {
      if (!finished) return
      setVisible(false)
      setAnimatPlayed(true)
    })
  }, [animFade])

  useEffect(() => {
    if (isVisibleListDetail) {
      showList()
    } else {
      hideList()
    }
  }, [hideList, isVisibleListDetail, showList])


  const animaStyle = useMemo(() => StyleSheet.compose(styles.container, {
    backgroundColor: theme.primary,
    opacity: animFade, // Bind opacity to animated value
    transform: [
      { scale: animScale },
      // { translateY: this.state.animates.translateY },
    ],
  }), [animFade, animScale, theme.primary])

  const ListComponent = useMemo(() => (
    <Animated.View style={animaStyle}>
      <List animatePlayed={animatePlayed} />
      {/* <View style={{ flexDirection: 'row', width: '100%', flexGrow: 0, flexShrink: 0, borderTopWidth: BorderWidths.normal, borderTopColor: AppColors.borderColor }}>
        <Button onPress={this.handleCollection} style={{ ...styles.controlBtn }}><Text style={{ ...styles.controlBtnText, color: AppColors.normal }}>收藏</Text></Button>
        <Button onPress={this.handlePlayAll} style={{ ...styles.controlBtn }}><Text style={{ ...styles.controlBtnText, color: AppColors.normal }}>播放</Text></Button>
        <Button onPress={this.handleBack} style={{ ...styles.controlBtn }}><Text style={{ ...styles.controlBtnText, color: AppColors.normal }}>返回</Text></Button>
      </View> */}
    </Animated.View>
  ), [animaStyle, animatePlayed])

  return !visible && animatePlayed ? null : ListComponent
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    flexDirection: 'column',
  },
  list: {
    flexGrow: 1,
    flexShrink: 1,
  },
})
