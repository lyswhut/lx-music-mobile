import React, { useEffect, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { useGetter, useDispatch } from '@/store'

import Player from './Player'

export default (props) => {
  // const theme = useGetter('common', 'theme')
  const setComponentId = useDispatch('common', 'setComponentId')
  useEffect(() => {
    setComponentId({ name: 'playDetail', id: props.componentId })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Player />
    </>
  )
}
