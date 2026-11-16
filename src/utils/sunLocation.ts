import BackgroundTimer from 'react-native-background-timer'
import { getData, saveData } from '@/plugins/storage'
import { minutesToNearestSwitch } from '@/utils/sunrise'

/**
 * 日出日落要用的位置：只在通过 CarWith 连着车机时用 IP 定位，断开期间一个请求都不发。
 * 只走 HTTPS（清单里没有 usesCleartextTraffic、targetSdk=29，明文会被系统挡）。
 * 刷新节奏跟着用途走：平时两小时一轮，进入日出/日落前后 90 分钟内加密到 30 分钟一轮
 * ——跑高速 4 小时能走 400 公里，一天不重查等于拿着几百公里外的城市算切换点。
 * 三家一起问、按投票取：运营商 IP 的地理位置库经常互相打架（实测同一个 IP 三家给三个城市），
 * 两家在 2° 以内就取这两家的平均，谁都不同就取离另外两家总和最近的那家（不让一个离谱值说了算）。
 */

export interface SunLocation {
  lat: number
  lng: number
  city: string
  source: string
  /** 定位成功的时刻；0 表示还没成功过，用的是默认坐标 */
  ts: number
}

/** 一次都没定位成功时的兜底：北京市政府所在的通州 */
export const DEFAULT_SUN_LOCATION: SunLocation = { lat: 39.9025, lng: 116.6586, city: '北京', source: '', ts: 0 }

const CACHE_KEY = '@salt_sun_location'
const BUDGET_KEY = '@salt_sun_budget'
const RETRY_AFTER = 15 * 60 * 1000
const TIMEOUT = 8000
/** 两家结果算「一致」的门槛（经纬度都差不到 2°，约 220 公里） */
const AGREE_DEG = 2
/** 连着车机期间的刷新节奏：平时 2 小时一轮；进入日出/日落前后 90 分钟内加密到 30 分钟一轮 */
const REFRESH_NORMAL = 2 * 60 * 60 * 1000
const REFRESH_NEAR_SWITCH = 30 * 60 * 1000
const NEAR_SWITCH_MINUTES = 90
/** 每轮 3 个请求，一天最多这么多轮，免得长时间连着车机把免费额度打到限流 */
const MAX_ROUNDS_PER_DAY = 24
/** 同一家当天连坏这么多次就暂时跳过它 */
const SOURCE_FAIL_LIMIT = 3

interface Hit {
  name: string
  lat: number
  lng: number
  city: string
}

interface Source {
  name: string
  url: string
  pick: (data: any) => { lat: number, lng: number, city: string } | null
}

const SOURCES: Source[] = [
  {
    name: 'ipinfo.io',
    url: 'https://ipinfo.io/json',
    pick: data => {
      const parts = String(data.loc ?? '').split(',')
      return { lat: Number(parts[0]), lng: Number(parts[1]), city: String(data.city ?? '') }
    },
  },
  {
    name: 'ipwho.is',
    url: 'https://ipwho.is/',
    pick: data => data.success === false ? null
      : { lat: Number(data.latitude), lng: Number(data.longitude), city: String(data.city ?? '') },
  },
  {
    // 这家不给城市名，只给坐标，用来投票（别拿 country_code 充当城市名，那样它会带着「CN」这种没用的名字挤掉有城市的家）
    name: 'geojs.io',
    url: 'https://get.geojs.io/v1/ip/geo.json',
    pick: data => ({
      lat: Number(data.latitude),
      lng: Number(data.longitude),
      city: String(data.city ?? ''),
    }),
  },
]

const isValid = (lat: number, lng: number) => {
  return isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat == 0 && lng == 0)
}

/**
 * 超时一律走 BackgroundTimer：连着车机播放时 App 基本在后台，普通 setTimeout 在后台
 * 不保证按时跑，一旦不跑，这一轮的 promise 就永远不落定，querying/computing 两道闸门
 * 会把之后所有轮询一起卡死（表现是「车机切深浅色再也不翻主题」，只能重启 App）。
 */
const withTimeout = async<T>(promise: Promise<T>): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    let settled = false
    const timer = BackgroundTimer.setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error('timeout'))
    }, TIMEOUT)
    promise.then(value => {
      if (settled) return
      settled = true
      BackgroundTimer.clearTimeout(timer)
      resolve(value)
    }, err => {
      if (settled) return
      settled = true
      BackgroundTimer.clearTimeout(timer)
      reject(err)
    })
  })
}

const fetchSource = async(source: Source): Promise<Hit> => {
  const resp = await withTimeout(fetch(source.url))
  if (!resp.ok) throw new Error('http ' + resp.status)
  const picked = source.pick(await resp.json())
  if (!picked) throw new Error('rejected by service')
  if (!isValid(picked.lat, picked.lng)) throw new Error('no usable coordinate')
  return { name: source.name, ...picked }
}

/** 投票：先看有没有两家一致，没有就取「离另外两家总和最近」的那家 */
const choose = (hits: Hit[]) => {
  for (let i = 0; i < hits.length; i++) {
    for (let j = i + 1; j < hits.length; j++) {
      if (Math.abs(hits[i].lat - hits[j].lat) <= AGREE_DEG && Math.abs(hits[i].lng - hits[j].lng) <= AGREE_DEG) {
        return {
          lat: (hits[i].lat + hits[j].lat) / 2,
          lng: (hits[i].lng + hits[j].lng) / 2,
          city: hits[i].city || hits[j].city,
          source: hits[i].name + ' + ' + hits[j].name,
        }
      }
    }
  }
  // 没有哪两家一致时，只在「给了城市名」的家里选，状态行才看得出按哪个城市算
  const named = hits.filter(hit => hit.city)
  const candidates = named.length ? named : hits
  let best = candidates[0]
  let bestScore = Number.MAX_VALUE
  for (const hit of candidates) {
    const score = candidates.reduce((sum, other) => sum + Math.abs(hit.lat - other.lat) + Math.abs(hit.lng - other.lng), 0)
    if (score < bestScore) {
      bestScore = score
      best = hit
    }
  }
  return { lat: best.lat, lng: best.lng, city: best.city, source: best.name }
}

export const sunLocationState = {
  location: DEFAULT_SUN_LOCATION,
  /** 最近一次为什么没定位成功，给状态行用 */
  error: '',
}

const listeners = new Set<() => void>()

export const onSunLocationChange = (listener: () => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

const notify = () => {
  listeners.forEach(listener => { listener() })
}

const applyLocation = (location: SunLocation) => {
  sunLocationState.location = location
  sunLocationState.error = ''
  notify()
  void saveData(CACHE_KEY, location)
}

/**
 * 请求配额：失败退避、一分钟插拔节流、每日封顶都记在这里，并**存到本地**。
 * 只记内存的话，App 被系统杀掉再起来这些计数就清零了，一次崩溃循环能把三家各打几十次。
 */
interface Budget {
  day: string
  rounds: number
  failTs: number
  lastAt: number
  fails: Record<string, number>
}

const budget: Budget = { day: '', rounds: 0, failTs: 0, lastAt: 0, fails: {} }

const saveBudget = () => {
  void saveData(BUDGET_KEY, { ...budget, fails: { ...budget.fails } })
}

const rollDay = () => {
  const d = new Date()
  const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  if (budget.day != key) {
    budget.day = key
    budget.rounds = 0
    budget.fails = {}
  }
  return budget
}

let storedLoading: Promise<void> | null = null
/**
 * 读上次成功的定位与请求配额（没网时靠位置撑），只做一次，并发调用等同一份结果。
 * 必须等两次读都完成才放行：提前返回的话，并发那一轮会拿着全空的配额跑下去，
 * 再用 saveBudget() 把持久化的「今天查了几轮」「一分钟节流」「失败退避」覆掉——那正是配额要防的崩溃循环。
 */
const loadStored = async() => {
  storedLoading ??= (async() => {
    try {
      const cached = await getData<SunLocation>(CACHE_KEY)
      if (cached && isValid(Number(cached.lat), Number(cached.lng))) {
        sunLocationState.location = {
          lat: Number(cached.lat),
          lng: Number(cached.lng),
          city: String(cached.city ?? ''),
          source: String(cached.source ?? ''),
          ts: Number(cached.ts) || 0,
        }
        notify()
      }
    } catch (err) {
      // 读不到就当没有，下面照常去查
    }
    try {
      const saved = await getData<any>(BUDGET_KEY)
      if (saved) {
        budget.day = String(saved.day ?? '')
        budget.rounds = Number(saved.rounds) || 0
        budget.failTs = Number(saved.failTs) || 0
        budget.lastAt = Number(saved.lastAt) || 0
        budget.fails = typeof saved.fails == 'object' && saved.fails ? saved.fails : {}
      }
    } catch (err) {
      // 读不到就当今天还没查过
    }
  })()
  return storedLoading
}

let querying: Promise<void> | null = null
/** 连续反复插拔车机时，最多一分钟查一轮 */
const MIN_ROUND_GAP = 60 * 1000

/** 位置还算不算「旧到该重查」：平时两小时一轮，越靠近日出日落越勤（切换点会被位置误差直接挪动） */
const isStale = () => {
  if (sunLocationState.location.ts == 0) return true
  const age = Date.now() - sunLocationState.location.ts
  const minutes = minutesToNearestSwitch(new Date(), sunPoint())
  const near = minutes != null && minutes <= NEAR_SWITCH_MINUTES
  return age > (near ? REFRESH_NEAR_SWITCH : REFRESH_NORMAL)
}

/**
 * 连着车机时才会被叫到：位置旧到该重查、或被 force 要求（刚连上/刚勾上）时查一轮。
 * 三家并发问，整轮不超过 8 秒；全都失败就 15 分钟内不再试；一分钟之内最多一轮；
 * 常规刷新一天封顶 24 轮，force 不受封顶（新连上车机时必须拿到当时的位置），但仍受一分钟约束。
 */
export const ensureSunLocation = async(force = false) => {
  // 读缓存这一步也套上超时：存储万一不返回，这里卡住就等于后面每一轮都进不来
  await withTimeout(loadStored()).catch(() => {})
  const now = Date.now()
  if (!force && !isStale()) return
  if (now < budget.failTs) return
  if (now - budget.lastAt < MIN_ROUND_GAP) return
  if (!force && rollDay().rounds >= MAX_ROUNDS_PER_DAY) return
  if (querying) return querying
  budget.lastAt = now
  rollDay().rounds++
  saveBudget()
  querying = (async() => {
    // 某一家当天连坏三次就暂时跳过它（省额度、也让一轮别总卡在它那 8 秒上）；
    // 三家都在黑名单时不跳，否则这天就再也没机会定位了
    const alive = SOURCES.filter(source => (budget.fails[source.name] ?? 0) < SOURCE_FAIL_LIMIT)
    const candidates = alive.length ? alive : SOURCES
    const results = await Promise.allSettled(candidates.map(fetchSource))
    results.forEach((result, i) => {
      budget.fails[candidates[i].name] = result.status == 'fulfilled' ? 0 : (budget.fails[candidates[i].name] ?? 0) + 1
    })
    const hits = results.filter(r => r.status == 'fulfilled').map(r => r.value)
    if (!hits.length) {
      budget.failTs = Date.now() + RETRY_AFTER
      saveBudget()
      sunLocationState.error = results.map((result, i) => {
        return result.status == 'rejected' ? candidates[i].name + ': ' + String(result.reason?.message ?? result.reason) : ''
      }).filter(Boolean).join(' / ')
      notify()
      return
    }
    budget.failTs = 0
    saveBudget()
    const picked = choose(hits)
    applyLocation({ ...picked, ts: Date.now() })
  })().finally(() => { querying = null })
  return querying
}

export const sunPoint = () => ({
  lat: sunLocationState.location.lat,
  lng: sunLocationState.location.lng,
})
