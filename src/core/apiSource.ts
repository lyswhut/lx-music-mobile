// import { setUserApi as setUserApiAction } from '@renderer/utils/ipc'
import musicSdk from '@/utils/musicSdk'
// import apiSourceInfo from '@renderer/utils/musicSdk/api-source-info'
import { updateSetting } from './common'
import settingState from '@/store/setting/state'


export const setUserApi = (apiId: string) => {
  if (/^user_api/.test(apiId)) {
    // qualityList.value = {}
    // userApi.status = false
    // userApi.message = 'initing'

    // await setUserApiAction(apiId).then(() => {
    //   apiSource.value = apiId
    // }).catch(err => {
    //   console.log(err)
    //   let api = apiSourceInfo.find(api => !api.disabled)
    //   if (!api) return
    //   apiSource.value = api.id
    //   if (api.id != appSetting['common.apiSource']) setApiSource(api.id)
    // })
  } else {
    // @ts-expect-error
    global.lx.qualityList = musicSdk.supportQuality[apiId] as LX.QualityList
    // apiSource.value = apiId
    // void setUserApiAction(apiId)
  }

  if (apiId != settingState.setting['common.apiSource']) {
    updateSetting({ 'common.apiSource': apiId })
  }
}

