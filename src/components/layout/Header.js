import React from 'react'
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native'

const Header = state => {
  return (
    <View style={style.header}>
      <StatusBar backgroundColor="rgba(0,0,0,0)" barStyle="dark-content" translucent={true} />
      <SafeAreaView style={style.container}>
        {state.menu.map((item, index) => <View style={style.btn} key={item.id}><Text style={style.btnText} onPress={() => this.handlePress(item, index)}>{item.name}</Text></View>)}
      </SafeAreaView>
    </View>
  )
}


const style = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    height: 50 + StatusBar.currentHeight,
    paddingTop: StatusBar.currentHeight,
    // Android shadow
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.23,
    // shadowRadius: 2.62,
    // elevation: 4,
  },
  container: {
    // width: '100%',
    flexDirection: 'row',
  },
  btn: {
    // flex: 1,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: 'rgba(0,0,0,0);',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  btnText: {
    fontSize: 16,
    color: 'white',
  },
})


export default Header
