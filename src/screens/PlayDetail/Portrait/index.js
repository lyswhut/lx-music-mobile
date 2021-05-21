import React, { useEffect, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { useGetter, useDispatch } from '@/store'

import Player from './Player'

export default () => {
  return (
    <>
      <Player />
    </>
  )
}
