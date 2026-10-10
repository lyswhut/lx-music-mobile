/**
 * RNOH 原生插桩验证入口（最小）
 *
 * 不引入 ./src —— 现有 App 用 Wix react-native-navigation 注册根组件，
 * 与 RNOH 的 AppRegistry 机制不兼容（见 Task 1.2 导航替换）。本入口仅注册
 * 一个最小组件，用来单独验证「RNOH 原生插桩 + 加载 harmony bundle + 渲染」
 * 这条链路是否打通，与导航问题解耦。
 *
 * 构建: npm run bundle-harmony:probe
 * native 侧 appKey = 'lxmusic'（见 harmony/.../pages/Index.ets）
 */
import './shim'
import React from 'react'
import { AppRegistry, View, Text, StyleSheet } from 'react-native'

function HarmonyProbe() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Hello from RN on HarmonyOS ✅</Text>
      <Text style={styles.sub}>RNOH 原生插桩已跑通</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  sub: { marginTop: 8, fontSize: 14, color: '#888' },
})

AppRegistry.registerComponent('lxmusic', () => HarmonyProbe)
