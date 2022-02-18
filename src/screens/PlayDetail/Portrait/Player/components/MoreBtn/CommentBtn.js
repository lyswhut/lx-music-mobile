import React, { useCallback, memo, useMemo, useEffect, useState, useRef } from 'react'
import { Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Icon } from '@/components/common/Icon'
import { useGetter, useDispatch } from '@/store'
import { navigations } from '@/navigation'


export default memo(() => {
  const theme = useGetter('common', 'theme')
  const componentIds = useGetter('common', 'componentIds')

  const handleShowCommentScreen = () => {
    navigations.pushCommentScreen(componentIds.home)
  }

  return (
    <TouchableOpacity style={{ ...styles.cotrolBtn }} activeOpacity={0.5} onPress={handleShowCommentScreen}>
      <Icon name="comment" style={{ color: theme.normal30 }} size={24} />
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  cotrolBtn: {
    marginLeft: 5,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',

    // backgroundColor: '#ccc',
    shadowOpacity: 1,
    textShadowRadius: 1,
  },
})
