import React, { useState, useCallback, memo, useMemo, useRef, useEffect } from 'react'
import { StyleSheet, Animated, Text } from 'react-native'
import { useGetter } from '@/store'
import { useTranslation } from '@/plugins/i18n'

export default memo(({ visible }) => {
  const theme = useGetter('common', 'theme')
  const animFade = useRef(new Animated.Value(0)).current
  const [maskVisible, setMaskVisible] = useState(false)
  const { t } = useTranslation()

  const handleShow = useCallback(() => {
    // console.log('handleShow')
    setMaskVisible(true)

    Animated.parallel([
      Animated.timing(animFade, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }, [animFade])

  const handleHide = useCallback(() => {
    // Will change fadeAnim value to 0 in 5 seconds
    // console.log('handleHide')
    Animated.parallel([
      Animated.timing(animFade, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start((finished) => {
      // console.log(finished)
      if (!finished) return
      setMaskVisible(false)
    })
  }, [animFade])

  useEffect(() => {
    if (visible === maskVisible) return
    visible ? handleShow() : handleHide()
  }, [handleHide, handleShow, maskVisible, visible])

  const maskComponent = useMemo(() => (
    <Animated.View style={{ ...styles.container, backgroundColor: theme.primary, opacity: animFade }}>
      <Text style={{ ...styles.text, color: theme.normal40 }}>{t('list_loading')}</Text>
    </Animated.View>
  ), [animFade, t, theme])

  return maskVisible ? maskComponent : null
})

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
  },
})
