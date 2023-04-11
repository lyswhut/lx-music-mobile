import { useTheme } from '@/store/theme/hook'
import React from 'react'
import { StatusBar as RNStatusBar } from 'react-native'

const StatusBar = function() {
  const theme = useTheme()
  const statusBarStyle = theme.isDark ? 'light-content' : 'dark-content'
  return <RNStatusBar backgroundColor="rgba(0,0,0,0)" barStyle={statusBarStyle} translucent={true} />
}

StatusBar.currentHeight = RNStatusBar.currentHeight ?? 0

export default StatusBar
