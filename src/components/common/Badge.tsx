import React, { memo, useMemo } from 'react'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from './Text'
// const menuItemHeight = 42
// const menuItemWidth = 100

const styles = createStyle({
  text: {
    // paddingLeft: 4,
    // paddingRight: 4,
    // borderRadius: 2,
    // lineHeight: 12,
    // marginTop: 2,
    marginLeft: 5,
    // marginRight: 5,
    // marginBottom: 2,
    // alignSelf: 'flex-start',
    alignSelf: 'center',
  },
})

export type BadgeType = 'normal' | 'secondary' | 'tertiary'

export default memo(({ type = 'normal', children }: {
  type?: BadgeType
  children: string
}) => {
  const theme = useTheme()
  // console.log(visible)
  const colors = useMemo(() => {
    const colors = { textColor: '' }
    switch (type) {
      case 'normal':
        // colors.bgColor = theme.primary
        colors.textColor = theme['c-badge-primary']
        break
      case 'secondary':
        // colors.bgColor = theme.primary
        colors.textColor = theme['c-badge-secondary']
        break
      case 'tertiary':
        // colors.bgColor = theme.primary
        colors.textColor = theme['c-badge-tertiary']
        break
    }
    return colors
  }, [type, theme])

  return <Text style={styles.text} size={9} color={colors.textColor}>{children}</Text>
})

