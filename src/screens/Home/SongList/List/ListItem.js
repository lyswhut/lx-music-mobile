import React, { memo } from 'react'
import { View, Text, Image, StyleSheet, Platform, TouchableOpacity } from 'react-native'
import { AppColors } from '@/theme'

export default memo(({ data: { index, item }, width, onPress = () => {} }) => {
  const handlePress = () => {
    onPress(item, index)
  }
  return (
    item.source
      ? (
          <View style={{ ...styles.listItem, width: width - 20 }}>
            <View style={{ ...styles.listItemImg, backgroundColor: AppColors.primary }}>
              <TouchableOpacity activeOpacity={0.5} onPress={handlePress}>
                <Image source={{ uri: item.img }} style={{ width: width - 20, height: width - 20 }} borderRadius={4} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity activeOpacity={0.5} onPress={handlePress}>
              <Text style={{ ...styles.listItemTitle, color: AppColors.normal }} numberOfLines={ 2 }>{item.name}</Text>
            </TouchableOpacity>
            {/* <Text>{JSON.stringify(item)}</Text> */}
          </View>
        )
      : <View style={styles.listItem} />
  )
})

const styles = StyleSheet.create({
  listItem: {
    width: 90,
    margin: 10,
  },
  listItemImg: {
    backgroundColor: '#eee',
    borderRadius: 4,
    marginBottom: 5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  listItemTitle: {
    fontSize: 12,
    // overflow: 'hidden',
    marginBottom: 5,
  },
})
