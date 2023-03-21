import React from 'react'
import { View } from 'react-native'
import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import { BorderWidths } from '@/theme'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'

export default ({ listInfo, onPress, width }: {
  listInfo: LX.List.MyListInfo
  onPress: (listInfo: LX.List.MyListInfo) => void
  width: number
}) => {
  const theme = useTheme()

  const handlePress = () => {
    onPress(listInfo)
  }

  return (
    <View style={{ ...styles.listItem, width }}>
      <Button
        style={{ ...styles.button, backgroundColor: theme['c-button-background'], borderColor: theme['c-primary-light-200-alpha-700'] }}
        onPress={handlePress}
      >
        <Text numberOfLines={1} size={14} color={theme['c-button-font']}>{listInfo.name}</Text>
      </Button>
    </View>
  )
}

export const styles = createStyle({
  listItem: {
    // width: '50%',
    paddingRight: 13,
  },
  button: {
    height: 36,
    paddingLeft: 10,
    paddingRight: 10,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BorderWidths.normal2,
  },
})
