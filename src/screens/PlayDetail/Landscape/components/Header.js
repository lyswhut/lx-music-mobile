import React, { memo } from 'react'

import { View, StyleSheet, StatusBar, TouchableOpacity, Text } from 'react-native'

import Icon from '@/components/common/Icon'
import { useGetter, useDispatch } from '@/store'
import { pop } from '@/navigation'

// import { AppColors } from '@/theme'


export default memo(() => {
  const theme = useGetter('common', 'theme')
  const componentIds = useGetter('common', 'componentIds')
  const back = () => {
    pop(componentIds.playDetail)
  }

  return (
    <View style={{ ...styles.header, backgroundColor: theme.primary }}>
      <StatusBar backgroundColor="rgba(0,0,0,0)" barStyle="dark-content" translucent={true} />
      <View style={{ ...styles.container }}>
        <TouchableOpacity onPress={back} style={{ ...styles.button }}>
          <Icon name="chevron-left" style={{ color: theme.normal }} size={24} />
        </TouchableOpacity>
        {/* <Text style={{ ...styles.title, color: theme.normal }}></Text> */}
      </View>
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
    paddingRight: 40,
  },
  button: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    lineHeight: 40,
    textAlign: 'center',
    fontSize: 16,
  },
  icon: {
    paddingLeft: 4,
    paddingRight: 4,
  },
})
