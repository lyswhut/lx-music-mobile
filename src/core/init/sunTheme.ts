import BackgroundTimer from 'react-native-background-timer'
import RNFS from 'react-native-fs'
import { applyTheme } from '@/core/theme'
import { getTheme } from '@/theme/themes'
import { ensureSunLocation, sunPoint } from '@/utils/sunLocation'
import { isNightNow } from '@/utils/sunrise'
import { sunState } from '@/utils/sunState'
import settingState from '@/store/setting/state'
import themeState from '@/store/theme/state'

/** 原生写的状态文件，内容 `连着(0/1)|车机深浅(-1|0|1)`；车机一切深浅色原生立刻改写（ContentObserver），
 *  没人变化时它每 5 秒兜底查一次 */
const stateFilePath = () => {
  const dir = RNFS.ExternalDirectoryPath
  return dir ? `${dir}/carlink_state.txt` : null
}

const readCarLinkState = async(): Promise<{ connected: boolean, carMode: number }> => {
  const path = stateFilePath()
  if (!path) return { connected: false, carMode: -1 }
  try {
    const rows = (await RNFS.readFile(path)).trim().split('|')
    const carMode = Number(rows[1])
    return { connected: rows[0] === '1', carMode: carMode == 0 || carMode == 1 ? carMode : -1 }
  } catch (err) {
    return { connected: false, carMode: -1 }
  }
}

let wasConnected = false
let computing: Promise<void> | null = null
let computingSince = 0
let pendingForce = false

const computeStateNow = async(force = false) => {
  const followSun = settingState.setting['common.followSunTheme']
  const followCar = settingState.setting['common.followCarWithTheme']
  if (!followSun && !followCar) {
    // 两个都没勾就彻底收手：连状态文件都不读、不算升落、不发任何请求，
    // 主题回到列表里选的那个；下次勾上时按「刚连上」重查一次位置
    sunState.enabled = false
    sunState.night = false
    wasConnected = false
    return
  }
  const { connected, carMode } = await readCarLinkState()
  const firstConnect = connected && !wasConnected
  wasConnected = connected
  // 刚连上时无视缓存重查一次位置（车已经开到别的城市了）；
  // 车机已经报了深色时不必再定位，日出日落那条就没必要参与
  if (connected && followSun && !(followCar && carMode == 1)) await ensureSunLocation(force || firstConnect)
  sunState.enabled = connected
  // 或关系，写成短路求值：车机已经报了深色就不再去算日出日落
  sunState.night = connected && (
    (followCar && carMode == 1) ||
    (followSun && isNightNow(new Date(), sunPoint()))
  )
}

/**
 * 连着车机时该用深色还是浅色。三个来源是「或」的关系（他定的口径）：
 * 「跟随系统亮、暗模式」（在 getTheme 里）、「跟随CarWith亮、暗模式」、「连接时跟随日出日落」，
 * 任意一个报出「该深色」就变深色；都没报深色（或报的是浅色）就是列表里选的那个主题。
 * 没连着车机时后两个都不参与，断开期间除了读本地文件不发任何请求。
 * 一轮里可能有一次最长 8 秒的定位，2 秒节拍会让下一轮撞上还没跑完的那轮，所以同一段时间里只跑一轮。
 * 撞上时如果对方带的是 force（刚勾上开关、刚连上车机，必须重查位置），不能把这个要求丢掉：
 * 记成 pendingForce，等这一轮落定再补一轮 force，否则车上换城市后要按旧城市的升落时间翻主题。
 * 再加一道 30 秒的兜底：万一某一轮的 Promise 永不落定，丢掉它重开一轮，不让轮询永久停在旧状态。
 */
const computeState = async(force = false) => {
  if (force) pendingForce = true
  if (computing) {
    if (Date.now() - computingSince < 30 * 1000) return computing
    computing = null
  }
  const runForce = pendingForce
  pendingForce = false
  const round = computeStateNow(runForce)
  computing = round
  computingSince = Date.now()
  void round.catch(() => {}).then(() => {
    if (computing === round) computing = null
    if (pendingForce) void computeState(true)
  })
  return round
}

const applyCurrentTheme = () => {
  void getTheme().then(theme => {
    if (theme.id == themeState.theme.id) return
    applyTheme(theme)
  })
}

/** 勾上开关后立刻按新状态判定并套用，不用等下一次轮询；force = true 会无视缓存重查一次位置 */
export const refreshSunTheme = async(force = false) => {
  await computeState(force)
  applyCurrentTheme()
}

/**
 * 每 2 秒读一次那个状态文件（原生挂了 ContentObserver，车机一切深浅色就会立刻写文件，
 * 所以这里只需要把「文件→主题」这一段压到秒级）。只在「生效状态 / 昼夜」真的翻转时才重取主题，
 * 平时一行都不做；位置仍然只在连着 CarWith 期间用 IP 查（刚连上查一次，之后一天最多一次），
 * 断开时完全不联网，断开连接就用主题列表里选的那个。
 */
export default () => {
  let lastKey: string | null = null
  const tick = async() => {
    await computeState()
    const key = `${sunState.enabled ? 1 : 0}|${sunState.night ? 1 : 0}`
    if (key == lastKey) return
    lastKey = key
    applyCurrentTheme()
  }
  void tick()
  BackgroundTimer.setInterval(() => {
    void tick()
  }, 2 * 1000)
}
