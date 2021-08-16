import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import { Text, StyleSheet, Animated, View, TouchableOpacity } from 'react-native'
import { useTranslation } from '@/plugins/i18n'

import Button from '@/components/common/Button'
import { useGetter } from '@/store'


export default memo(({ multipleMode, onCancel, onSelectAll, selectMode, onSwitchMode, isSelectAll }) => {
  const { t } = useTranslation()
  // const isGetDetailFailedRef = useRef(false)
  const [visible, setVisible] = useState(false)
  const [animatePlayed, setAnimatPlayed] = useState(true)
  const animFade = useRef(new Animated.Value(0)).current
  const animTranslateY = useRef(new Animated.Value(0)).current

  const theme = useGetter('common', 'theme')

  useEffect(() => {
    setAnimatPlayed(true)
    if (multipleMode) {
      animFade.setValue(0.92)
      animTranslateY.setValue(0)
      setVisible(true)
    } else {
      animFade.setValue(0)
      animTranslateY.setValue(-20)
      setVisible(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showList = useCallback(() => {
    // console.log('show List')
    setVisible(true)
    setAnimatPlayed(false)
    animTranslateY.setValue(-20)

    Animated.parallel([
      Animated.timing(animFade, {
        toValue: 0.92,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animTranslateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAnimatPlayed(true)
    })
  }, [animFade, animTranslateY])

  const hideList = useCallback(() => {
    setAnimatPlayed(false)
    Animated.parallel([
      Animated.timing(animFade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animTranslateY, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(finished => {
      if (!finished) return
      setVisible(false)
      setAnimatPlayed(true)
    })
  }, [animFade, animTranslateY])

  useEffect(() => {
    if (multipleMode) {
      showList()
    } else {
      hideList()
    }
  }, [hideList, multipleMode, showList])


  const animaStyle = useMemo(() => StyleSheet.compose(styles.container, {
    backgroundColor: theme.secondary45,
    opacity: animFade, // Bind opacity to animated value
    transform: [
      { translateY: animTranslateY },
    ],
  }), [animFade, animTranslateY, theme])

  const switchModeSingle = useCallback(() => {
    onSwitchMode('single')
  }, [onSwitchMode])
  const switchModeRange = useCallback(() => {
    onSwitchMode('range')
  }, [onSwitchMode])

  const component = useMemo(() => (
    <Animated.View style={animaStyle}>
      <View style={styles.switchBtn}>
        <Button onPress={switchModeSingle} style={{ ...styles.btn, backgroundColor: selectMode == 'single' ? theme.secondary40 : 'rgba(0,0,0,0)' }}>
          <Text style={{ color: theme.secondary }}>{t('list_select_single')}</Text>
        </Button>
        <Button onPress={switchModeRange} style={{ ...styles.btn, backgroundColor: selectMode == 'range' ? theme.secondary40 : 'rgba(0,0,0,0)' }}>
          <Text style={{ color: theme.secondary }}>{t('list_select_range')}</Text>
        </Button>
      </View>
      <TouchableOpacity onPress={onSelectAll} style={styles.btn}>
        <Text style={{ color: theme.secondary }}>{t(isSelectAll ? 'list_select_unall' : 'list_select_all')}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onCancel} style={styles.btn}>
        <Text style={{ color: theme.secondary }}>{t('list_select_cancel')}</Text>
      </TouchableOpacity>
    </Animated.View>
  ), [animaStyle, isSelectAll, selectMode, onCancel, onSelectAll, switchModeRange, switchModeSingle, t, theme])

  return !visible && animatePlayed ? null : component
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    flexDirection: 'row',
  },
  switchBtn: {
    flexDirection: 'row',
    flex: 1,
  },
  btn: {
    // flex: 1,
    paddingLeft: 15,
    paddingRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
