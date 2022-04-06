import React from 'react'
import { StatusBar as RNStatusBar } from 'react-native'
import { useGetter } from '@/store'

const StatusBar = function() {
  const statusBarStyle = useGetter('common', 'statusBarStyle')
  return <RNStatusBar backgroundColor="rgba(0,0,0,0)" barStyle={statusBarStyle} translucent={true} />
}

StatusBar.currentHeight = RNStatusBar.currentHeight ?? 0

export default StatusBar
