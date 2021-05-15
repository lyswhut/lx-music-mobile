import React, { memo, useMemo } from 'react'
import { StyleSheet, Text } from 'react-native'
import { useGetter } from '@/store'
// const menuItemHeight = 42
// const menuItemWidth = 100

const styles = StyleSheet.create({
  text: {
    // paddingLeft: 4,
    // paddingRight: 4,
    fontSize: 9,
    // borderRadius: 2,
    // lineHeight: 12,
    marginTop: 2,
    marginLeft: 5,
    marginBottom: 2,
    alignSelf: 'flex-start',
  },
})


export default memo(({ type, children }) => {
  const theme = useGetter('common', 'theme')
  // console.log(visible)
  const colors = useMemo(() => {
    const colors = {}
    switch (type) {
      case 'normal':
        // colors.bgColor = theme.primary
        colors.textColor = theme.normal10
        break
      case 'secondary':
        // colors.bgColor = theme.primary
        colors.textColor = theme.secondary10
        break
      case 'tertiary':
        // colors.bgColor = theme.primary
        colors.textColor = theme.tertiary10
        break
    }
    return colors
  }, [type, theme])

  return <Text style={{ ...styles.text, color: colors.textColor }}>{children}</Text>
})

