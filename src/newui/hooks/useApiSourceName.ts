import { useSettingValue } from '@/store/setting/hook'
import { useUserApiList } from '@/store/userApi'

/**
 * 当前音源脚本的名字（原型播放页「来自 XX 音源」、首页音源轮播共用）。
 * 只读 `common.apiSource` 设置与既有 useUserApiList；内置音源表在本项目为空，
 * 实际都指向用户导入的音源脚本，名字从这份列表里认，认不到就显示 id。
 */
export const useApiSourceName = (): string => {
  const apiSource = useSettingValue('common.apiSource')
  const userApiList = useUserApiList()
  if (!apiSource) return ''
  return userApiList.find(api => api.id === apiSource)?.name ?? apiSource
}
