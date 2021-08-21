import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react'
import { Text, StyleSheet, Animated, View, TouchableOpacity } from 'react-native'
import { useTranslation } from '@/plugins/i18n'

import Input from '@/components/common/Input'

import { useGetter } from '@/store'

const Bar = memo(({ visible, onHide, children }) => {
  const { t } = useTranslation()
  // const isGetDetailFailedRef = useRef(false)
  const [show, setShow] = useState(false)
  const [animatePlayed, setAnimatPlayed] = useState(true)
  const animFade = useRef(new Animated.Value(0)).current
  const animTranslateY = useRef(new Animated.Value(0)).current

  const theme = useGetter('common', 'theme')

  useEffect(() => {
    setAnimatPlayed(true)
    if (visible) {
      animFade.setValue(0.92)
      animTranslateY.setValue(0)
      setShow(true)
    } else {
      animFade.setValue(0)
      animTranslateY.setValue(-20)
      setShow(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showList = useCallback(() => {
    // console.log('show List')
    setShow(true)
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
      setShow(false)
      setAnimatPlayed(true)
    })
  }, [animFade, animTranslateY])

  useEffect(() => {
    if (visible) {
      showList()
    } else {
      hideList()
    }
  }, [hideList, visible, showList])


  const animaStyle = useMemo(() => StyleSheet.compose(styles.container, {
    backgroundColor: theme.secondary45,
    opacity: animFade, // Bind opacity to animated value
    transform: [
      { translateY: animTranslateY },
    ],
  }), [animFade, animTranslateY, theme])

  const component = useMemo(() => (
    <Animated.View style={animaStyle}>
      <View style={styles.content}>
        {children}
      </View>
      <TouchableOpacity onPress={onHide} style={styles.btn}>
        <Text style={{ color: theme.secondary }}>{t('list_select_cancel')}</Text>
      </TouchableOpacity>
    </Animated.View>
  ), [animaStyle, children, onHide, t, theme])

  return !show && animatePlayed ? null : component
})


export default memo(({ visible, onHide, text, onChangeText }) => {
  return (
    <Bar visible={visible} onHide={onHide}>
      <Input
        onChangeText={onChangeText}
        placeholder="Find for something..."
        value={text}
        // onFocus={showTipList}
        clearBtn
        // ref={searchInputRef}
      />
    </Bar>
  )
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
  content: {
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
