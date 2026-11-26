import { USER_API_SCRIPT_MAX_SIZE } from '@/config/constant'
import { action, state } from '@/store/userApi'
import { addUserApi, getUserApiScript, removeUserApi as removeUserApiFromStore, setUserApiAllowShowUpdateAlert as setUserApiAllowShowUpdateAlertFromStore, updateUserApiScript } from '@/utils/data'
import { destroy, loadScript } from '@/utils/nativeModules/userApi'
import { log as writeLog } from '@/utils/log'
import { httpFetch } from '@/utils/request'


export const setUserApi = async(apiId: string) => {
  global.lx.qualityList = {}
  setUserApiStatus(false, 'initing')

  const target = state.list.find(api => api.id === apiId)
  if (!target) throw new Error('api not found')
  const script = await getUserApiScript(target.id)
  loadScript({ ...target, script })
}

export const destroyUserApi = () => {
  destroy()
}


export const setUserApiStatus: typeof action['setStatus'] = (status, message) => {
  action.setStatus(status, message)
}

export const setUserApiList: typeof action['setUserApiList'] = (list) => {
  action.setUserApiList(list)
}

export const importUserApi = async(script: string, url?: string) => {
  const info = await addUserApi(script, url)
  action.addUserApi(info)
}

/** 按导入时缓存的链接重抓脚本并覆盖本地，不切源；是否重载交给 apiSource 层 */
export const refreshUserApi = async(id: string): Promise<LX.UserApi.UserApiInfo> => {
  const target = state.list.find(api => api.id === id)
  if (!target?.importUrl) throw new Error('No cached import URL')
  const script = await httpFetch(target.importUrl).promise.then(resp => resp.body) as string
  if (script.length > USER_API_SCRIPT_MAX_SIZE) throw new Error('Script too large')
  const updated = await updateUserApiScript(id, script)
  action.setUserApiList(state.list.map(api => api.id === id ? updated : api))
  return updated
}

export const removeUserApi = async(ids: string[]) => {
  const list = await removeUserApiFromStore(ids)
  action.setUserApiList(list)
}

export const setUserApiAllowShowUpdateAlert = async(id: string, enable: boolean) => {
  await setUserApiAllowShowUpdateAlertFromStore(id, enable)
  action.setUserApiAllowShowUpdateAlert(id, enable)
}

export const log = {
  r_info(...params: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    writeLog.info(...params)
  },
  r_warn(...params: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    writeLog.warn(...params)
  },
  r_error(...params: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    writeLog.error(...params)
  },
  log(...params: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (global.lx.isEnableUserApiLog) writeLog.info(...params)
  },
  info(...params: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (global.lx.isEnableUserApiLog) writeLog.info(...params)
  },
  warn(...params: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (global.lx.isEnableUserApiLog) writeLog.warn(...params)
  },
  error(...params: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (global.lx.isEnableUserApiLog) writeLog.error(...params)
  },
}
