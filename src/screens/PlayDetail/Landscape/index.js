import React, { useEffect, useCallback } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useGetter, useDispatch } from '@/store'

import Header from './components/Header'

export default () => {
  return (
    <>
      <Header />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>此界面还不支持横屏显示哦😜</Text></View>
    </>
  )
}
