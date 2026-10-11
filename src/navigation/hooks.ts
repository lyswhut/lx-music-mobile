/**
 * 页面生命周期 hooks(原 RNN registerComponentListener)。
 * 迁移后用 react-navigation 的 useFocusEffect 近似:componentDidAppear≈focus,
 * componentDidDisappear≈blur(focus effect 的清理)。componentId 参数保留以兼容签名。
 */
import { useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'

export const useNavigationCommandComplete = (_callback = () => {}) => {
  // RNN 的 command-completed 无直接等价,且业务未使用 —— 置空以兼容导出。
}

export const useNavigationComponentDidAppear = (_componentId: string, callback = () => {}) => {
  useFocusEffect(
    useCallback(() => {
      callback()
    }, [callback]),
  )
}

export const onNavigationComponentDidDisappearEvent = (_componentId: string, _callback = () => {}) => {
  // 仅定义,业务无活跃调用 —— 返回可移除句柄以兼容签名。
  return { remove: () => {} }
}

export const useNavigationComponentDidDisappear = (_componentId: string, callback = () => {}) => {
  useFocusEffect(
    useCallback(() => {
      return () => { callback() }
    }, [callback]),
  )
}
