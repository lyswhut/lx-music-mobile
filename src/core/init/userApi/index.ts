import { type InitParams, onScriptAction, sendAction, type ResponseParams, type UpdateInfoParams } from '@/utils/nativeModules/userApi'
import { log, setUserApiList, setUserApiStatus } from '@/core/userApi'
import settingState from '@/store/setting/state'
import BackgroundTimer from 'react-native-background-timer'
import { fetchData } from './request'
import { getUserApiList } from '@/utils/data'
import { confirmDialog, openUrl, tipDialog } from '@/utils/tools'


export default async(setting: LX.AppSetting) => {
  const requestQueue = new Map<string, { resolve: (value: ResponseParams['result']) => void, reject: (error: Error) => void, timeout: number }>()

  const cancelRequest = (requestKey: string, message: string) => {
    const target = requestQueue.get(requestKey)
    if (!target) return
    requestQueue.delete(requestKey)
    BackgroundTimer.clearTimeout(target.timeout)
    target.reject(new Error(message))
  }
  const sendUserApiRequest = async(data: LX.UserApi.UserApiRequestParams) => new Promise<ResponseParams['result']>((resolve, reject) => {
    requestQueue.set(data.requestKey, {
      resolve,
      reject,
      timeout: BackgroundTimer.setTimeout(() => {
        const target = requestQueue.get(data.requestKey)
        if (!target) return
        requestQueue.delete(data.requestKey)
        target.reject(new Error('request timeout'))
      }, 30_000),
    })
    sendAction('request', data)
  })
  const handleUserApiResponse = ({ status, result, requestKey, errorMessage }: ResponseParams) => {
    const target = requestQueue.get(requestKey)
    if (!target) return
    requestQueue.delete(requestKey)
    BackgroundTimer.clearTimeout(target.timeout)
    if (status) target.resolve(result)
    else target.reject(new Error(errorMessage ?? 'failed'))
  }
  const handleStateChange = ({ status, errorMessage, info, id }: InitParams) => {
    // console.log(status, message, info)
    setUserApiStatus(status, errorMessage)
    if (!status || !info?.sources || id !== settingState.setting['common.apiSource']) return

    let apis: any = {}
    let qualitys: LX.QualityList = {}
    for (const [source, { actions, type, qualitys: sourceQualitys }] of Object.entries(info.sources)) {
      if (type != 'music') continue
      apis[source as LX.Source] = {}
      for (const action of actions) {
        switch (action) {
          case 'musicUrl':
            apis[source].getMusicUrl = (songInfo: LX.Music.MusicInfo, type: LX.Quality) => {
              const requestKey = `request__${Math.random().toString().substring(2)}`
              return {
                canceleFn() {
                  // userApiRequestCancel(requestKey)
                },
                promise: sendUserApiRequest({
                  requestKey,
                  data: {
                    source,
                    action: 'musicUrl',
                    info: {
                      type,
                      musicInfo: songInfo,
                    },
                  },
                  // eslint-disable-next-line @typescript-eslint/promise-function-async
                }).then(res => {
                  // console.log(res)
                  if (!/^https?:/.test(res.data.url)) return Promise.reject(new Error('Get url failed'))
                  return { type, url: res.data.url }
                }).catch(async err => {
                  console.log(err.message)
                  return Promise.reject(err)
                }),
              }
            }
            break

          default:
            break
        }
      }
      qualitys[source as LX.Source] = sourceQualitys
    }
    global.lx.qualityList = qualitys
    global.lx.apis = apis
    global.state_event.apiSourceUpdated(settingState.setting['common.apiSource'])
  }
  const showUpdateAlert = ({ name, log, updateUrl }: UpdateInfoParams) => {
    if (updateUrl) {
      void confirmDialog({
        message: `${global.i18n.t('user_api_update_alert', { name })}\n${log}`,
        // selection: true,
        // showCancel: true,
        confirmButtonText: global.i18n.t('user_api_update_alert_open_url'),
        cancelButtonText: global.i18n.t('close'),
      }).then(confirm => {
        if (!confirm) return
        setTimeout(() => {
          void openUrl(updateUrl)
        }, 300)
      })
    } else {
      void tipDialog({
        message: `${global.i18n.t('user_api_update_alert', { name })}\n${log}`,
        // selection: true,
        btnText: global.i18n.t('ok'),
      })
    }
  }

  onScriptAction((event) => {
    // console.log('script actuon: ', event)
    switch (event.action) {
      case 'init':
        handleStateChange(event.data)
        break
      case 'response':
        handleUserApiResponse(event.data)
        break
      case 'request':
        fetchData(event.data.url, event.data.options).request.then(response => {
          // console.log(response)
          sendAction('response', {
            error: null,
            requestKey: event.data.requestKey,
            response,
          })
        }).catch(err => {
          sendAction('response', {
            error: err.message,
            requestKey: event.data.requestKey,
            response: null,
          })
        })
        break
      case 'cancelRequest':
        cancelRequest(event.data, 'request canceled')
        break
      case 'showUpdateAlert':
        showUpdateAlert(event.data)
        break
      case 'log':
        switch ((event as unknown as { type: keyof typeof log }).type) {
          case 'log':
          case 'info':
            log.info((event as unknown as { log: string }).log)
            break
          case 'error':
            log.error((event as unknown as { log: string }).log)
            break
          case 'warn':
            log.warn((event as unknown as { log: string }).log)
            break
          default:
            break
        }
        break
      default:
        break
    }
  })

  setUserApiList(await getUserApiList())
}
