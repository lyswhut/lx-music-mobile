import { compareVer } from '@/utils'
import { downloadNewVersion, getVersionInfo } from '@/utils/version'
import versionActions from '@/store/version/action'
import versionState, { type InitState } from '@/store/version/state'
import { getIgnoreVersion, saveIgnoreVersion } from '@/utils/data'
import { showVersionModal } from '@/navigation'
import { Navigation } from 'react-native-navigation'

export const showModal = () => {
  if (versionState.showModal) return
  versionActions.setVisibleModal(true)
  showVersionModal()
}

export const hideModal = (componentId: string) => {
  if (!versionState.showModal) return
  versionActions.setVisibleModal(false)
  void Navigation.dismissOverlay(componentId)
}

export const checkUpdate = async() => {
  versionActions.setVersionInfo({ status: 'checking' })
  let versionInfo: InitState['versionInfo'] = { ...versionState.versionInfo }
  try {
    const { version, desc, history } = await getVersionInfo()
    versionInfo.newVersion = {
      version,
      desc,
      history,
    }
  } catch (err) {
    versionInfo.newVersion = {
      version: '0.0.0',
      desc: '',
      history: [],
    }
  }
  // const versionInfo = {
  //   version: '1.9.0',
  //   desc: '- 更新xxx\n- 修复xxx123的萨达修复xxx123的萨达修复xxx123的萨达修复xxx123的萨达修复xxx123的萨达',
  //   history: [{ version: '1.8.0', desc: '- 更新xxx22\n- 修复xxx22' }, { version: '1.7.0', desc: '- 更新xxx22\n- 修复xxx22' }],
  // }
  if (versionInfo.version == '0.0.0') {
    versionInfo.isUnknown = true
    versionInfo.status = 'error'
  } else {
    versionInfo.status = 'idle'
  }
  versionInfo.isUnknown = false
  if (compareVer(versionInfo.version, versionInfo.newVersion.version) != -1) {
    versionInfo.isLatest = true
  }

  versionActions.setVersionInfo(versionInfo)

  if (!versionInfo.isLatest) {
    if (versionInfo.newVersion.version != await getIgnoreVersion()) {
      showModal()
    }
  }
  // console.log(compareVer(process.versions.app, versionInfo.version))
  // console.log(process.versions.app, versionInfo.version)
}

export const downloadUpdate = () => {
  versionActions.setVersionInfo({ status: 'downloading' })
  versionActions.setProgress({ total: 0, current: 0 })

  downloadNewVersion(versionState.versionInfo.newVersion!.version, (total: number, current: number) => {
    // console.log(total, current)
    versionActions.setProgress({ total, current })
  }).then(() => {
    versionActions.setVersionInfo({ status: 'downloaded' })
  }).catch(() => {
    versionActions.setVersionInfo({ status: 'error' })
    // console.log(err)
  })
}


export const setIgnoreVersion = (version: InitState['ignoreVersion']) => {
  versionActions.setIgnoreVersion(version)
  saveIgnoreVersion(version)
}
