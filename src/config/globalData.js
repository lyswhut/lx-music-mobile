import { version } from '../../package.json'
process.versions.app = version

global.playerStatus = {
  isInitialized: false,
  isRegisteredService: false,
  isIniting: false,
}

global.restorePlayInfo = null
global.allList = null
global.globalObj = null
global.listScrollPosition = {}
global.listSort = {}

global.isScreenKeepAwake = false
