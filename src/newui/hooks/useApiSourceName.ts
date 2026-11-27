import { useSettingValue } from '@/store/setting/hook'
import { useUserApiList } from '@/store/userApi'

/** 当前音源脚本的名字：只读 `common.apiSource` 与 useUserApiList，认不到就显示 id */
export const useApiSourceName = (): string => {
  const apiSource = useSettingValue('common.apiSource')
  const userApiList = useUserApiList()
  if (!apiSource) return ''
  return userApiList.find(api => api.id === apiSource)?.name ?? apiSource
}
