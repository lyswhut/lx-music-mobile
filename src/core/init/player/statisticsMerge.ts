// 听歌统计 数据结构与合并逻辑（纯函数，无平台依赖，服务端可直接复用）
//
// 合并语义：按设备分桶的「状态型 CRDT」。
// - 每台设备的每日/各音源累计秒数，在它自己（owner）身上只增不减；
// - 因此跨副本（本地副本 vs 远程副本）合并同一设备的桶时，逐键取 max —— 幂等且可交换，
//   重复同步 / 乱序到达都不会重复计数；
// - firstUseDate 取较早（min）；totalDuration 始终由 dailyStats 求和派生，避免漂移；
// - 聚合（给 UI 展示）时跨「不同设备」求和，合并（同一设备多副本）时取 max —— 两者语义不同。

/** 单台设备的统计桶 */
export interface DeviceStatistics {
  /** = dailyStats 求和，派生字段 */
  totalDuration: number
  /** 'Y-M-D'(零填充) -> 秒，仅本设备 */
  dailyStats: Record<string, number>
  /** 音源码(kg/tx/wy/...) -> 秒，仅本设备 */
  sourceStats: Record<string, number>
  /** 本设备首次使用日期 'Y-M-D'，用于计算乐龄 */
  firstUseDate: string
  /** 平台标识，展示用，如 lx_music_mobile / lx_music */
  platform?: string
  /** 设备名，展示用 */
  deviceName?: string
}

/** 持久化与同步用的分桶结构 */
export interface StatisticsStore {
  version: 2
  /** deviceId(已同步=服务端 clientId，未同步前=LOCAL_DEVICE_KEY) -> 桶 */
  devices: Record<string, DeviceStatistics>
}

/** UI 消费的扁平聚合结构（跨设备求和后的结果） */
export interface StatisticsData {
  totalDuration: number
  dailyStats: Record<string, number>
  sourceStats: Record<string, number>
  firstUseDate: string
}

/** 配置同步前累加用的临时桶 key */
export const LOCAL_DEVICE_KEY = 'local'

const sumValues = (rec: Record<string, number>): number => {
  let sum = 0
  for (const k in rec) sum += rec[k]
  return sum
}

const minDate = (a: string, b: string): string => {
  if (!a) return b
  if (!b) return a
  return a <= b ? a : b // 'Y-M-D' 零填充，字典序即时间序
}

/** 逐键取较大值（同一设备多副本合并） */
const maxCounters = (a: Record<string, number> = {}, b: Record<string, number> = {}): Record<string, number> => {
  const out: Record<string, number> = {}
  for (const k in a) out[k] = a[k]
  for (const k in b) {
    if (out[k] == null || b[k] > out[k]) out[k] = b[k]
  }
  return out
}

/** 逐键求和（不同设备聚合） */
const addCounters = (a: Record<string, number>, b: Record<string, number> = {}): Record<string, number> => {
  const out: Record<string, number> = { ...a }
  for (const k in b) out[k] = (out[k] || 0) + b[k]
  return out
}

const pickLabels = (a: DeviceStatistics, b?: DeviceStatistics): Pick<DeviceStatistics, 'platform' | 'deviceName'> => {
  const platform = b?.platform ?? a.platform
  const deviceName = b?.deviceName ?? a.deviceName
  const out: Pick<DeviceStatistics, 'platform' | 'deviceName'> = {}
  if (platform) out.platform = platform
  if (deviceName) out.deviceName = deviceName
  return out
}

/** 补齐字段并令 totalDuration 与 dailyStats 一致（幂等） */
export const normalizeDevice = (d: DeviceStatistics): DeviceStatistics => {
  const dailyStats = d.dailyStats ?? {}
  const sourceStats = d.sourceStats ?? {}
  return {
    totalDuration: sumValues(dailyStats),
    dailyStats,
    sourceStats,
    firstUseDate: d.firstUseDate || '',
    ...pickLabels(d),
  }
}

/** 合并「同一设备」的两个副本：逐键 max，firstUseDate 取 min */
export const mergeDevice = (a?: DeviceStatistics, b?: DeviceStatistics): DeviceStatistics => {
  if (!a) return normalizeDevice(b!)
  if (!b) return normalizeDevice(a)
  const dailyStats = maxCounters(a.dailyStats, b.dailyStats)
  return {
    totalDuration: sumValues(dailyStats),
    dailyStats,
    sourceStats: maxCounters(a.sourceStats, b.sourceStats),
    firstUseDate: minDate(a.firstUseDate, b.firstUseDate),
    ...pickLabels(a, b),
  }
}

export const createEmptyStore = (): StatisticsStore => ({ version: 2, devices: {} })

export const createEmptyDevice = (firstUseDate = '', platform?: string, deviceName?: string): DeviceStatistics => {
  const out: DeviceStatistics = { totalDuration: 0, dailyStats: {}, sourceStats: {}, firstUseDate }
  if (platform) out.platform = platform
  if (deviceName) out.deviceName = deviceName
  return out
}

/** 合并两个分桶 store：并集设备 id，逐桶 mergeDevice */
export const mergeStore = (a: StatisticsStore | null, b: StatisticsStore | null): StatisticsStore => {
  const aDev = a?.devices ?? {}
  const bDev = b?.devices ?? {}
  const devices: Record<string, DeviceStatistics> = {}
  const ids = new Set([...Object.keys(aDev), ...Object.keys(bDev)])
  for (const id of ids) devices[id] = mergeDevice(aDev[id], bDev[id])
  return { version: 2, devices }
}

/** 跨设备聚合成扁平结构，供 UI 展示 */
export const aggregate = (store: StatisticsStore | null): StatisticsData => {
  let dailyStats: Record<string, number> = {}
  let sourceStats: Record<string, number> = {}
  let firstUseDate = ''
  const devices = store?.devices ?? {}
  for (const id in devices) {
    const d = devices[id]
    dailyStats = addCounters(dailyStats, d.dailyStats)
    sourceStats = addCounters(sourceStats, d.sourceStats)
    firstUseDate = minDate(firstUseDate, d.firstUseDate)
  }
  return { totalDuration: sumValues(dailyStats), dailyStats, sourceStats, firstUseDate }
}

/**
 * 把任意持久化数据迁移成 v2 分桶结构。
 * - v2：原样规范化；
 * - v1 扁平 { totalDuration, dailyStats, firstUseDate, sourceStats }：包进 devices[localKey]；
 * - 空：返回空 store。
 */
export const migrate = (
  raw: any,
  localKey: string = LOCAL_DEVICE_KEY,
  meta?: { platform?: string, deviceName?: string },
): StatisticsStore => {
  if (!raw || typeof raw != 'object') return createEmptyStore()
  if (raw.version == 2 && raw.devices) {
    const devices: Record<string, DeviceStatistics> = {}
    for (const id in raw.devices) devices[id] = normalizeDevice(raw.devices[id] as DeviceStatistics)
    return { version: 2, devices }
  }
  // v1 扁平结构
  const flat: DeviceStatistics = {
    totalDuration: Number(raw.totalDuration) || 0,
    dailyStats: (raw.dailyStats ?? {}) as Record<string, number>,
    sourceStats: (raw.sourceStats ?? {}) as Record<string, number>,
    firstUseDate: typeof raw.firstUseDate == 'string' ? raw.firstUseDate : '',
  }
  if (meta?.platform) flat.platform = meta.platform
  if (meta?.deviceName) flat.deviceName = meta.deviceName
  return { version: 2, devices: { [localKey]: normalizeDevice(flat) } }
}

/** 把 fromKey 桶并入 toKey 桶（本地桶 -> clientId 桶），幂等 */
export const rekeyDevice = (store: StatisticsStore, fromKey: string, toKey: string): StatisticsStore => {
  if (fromKey == toKey || !store.devices[fromKey]) return store
  const devices = { ...store.devices }
  const from = devices[fromKey]
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete devices[fromKey]
  devices[toKey] = mergeDevice(devices[toKey], from)
  return { version: 2, devices }
}

/** 规范化序列化（设备 id / 日期 / 音源 key 全排序），用于跨端一致的 MD5 */
export const stableStringify = (store: StatisticsStore): string => {
  const sortRecord = (rec: Record<string, number>): Record<string, number> => {
    const out: Record<string, number> = {}
    for (const k of Object.keys(rec).sort()) out[k] = rec[k]
    return out
  }
  const obj: any = { version: 2, devices: {} }
  for (const id of Object.keys(store.devices).sort()) {
    const d = store.devices[id]
    obj.devices[id] = {
      totalDuration: d.totalDuration,
      firstUseDate: d.firstUseDate,
      platform: d.platform ?? '',
      deviceName: d.deviceName ?? '',
      dailyStats: sortRecord(d.dailyStats ?? {}),
      sourceStats: sortRecord(d.sourceStats ?? {}),
    }
  }
  return JSON.stringify(obj)
}
