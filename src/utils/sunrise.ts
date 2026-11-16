/**
 * 日出日落：标准太阳位置算法（与 SunCalc 同源），只依赖数学，不联网、不需要按周更新时刻表。
 * 已对过广州 2026 年 10~11 月的公开时刻表，误差 1~4 分钟。
 * 算不出升落（极圈等）返回 null，调用方按白天处理。
 * 坐标来自 IP 定位（见 `@/utils/sunLocation`），这里只管算。
 */
const RAD = Math.PI / 180
const PI2 = Math.PI * 2
const DAY_MS = 86400000
const J1970 = 2440588
const J2000 = 2451545
const OBLIQUITY = 23.4397 * RAD
const HOUR_ANGLE = -0.83 * RAD

const toDays = (date: Date) => date.getTime() / DAY_MS - 0.5 + J1970 - J2000
const solarMeanAnomaly = (d: number) => (357.5291 + 0.98560028 * d) * RAD
const eclipticLongitude = (m: number) => Math.PI + 102.9372 * RAD +
  1.9148 * RAD * Math.sin(m) +
  0.02 * RAD * Math.sin(2 * m) +
  0.0003 * RAD * Math.sin(3 * m) +
  m
const declination = (l: number) => Math.asin(Math.sin(l) * Math.sin(OBLIQUITY))

/**
 * 某个本地日历日在该地的日出/日落时刻。返回的 Date 就代表那个瞬间，比较时不用再转时区。
 * 以本地正午为基准取儒略周期，避开「本地日」与「UTC 日」错位，所以代码里没有任何时区常量。
 */
export const getSunTimes = (year: number, month: number, day: number, lat: number, lng: number) => {
  const noon = new Date(year, month, day, 12, 0, 0, 0)
  const lw = -lng * RAD
  const phi = lat * RAD
  const n = Math.round(toDays(noon))
  const jStar = J2000 + n - 0.0009 + lw / PI2
  const m = solarMeanAnomaly(jStar - J2000)
  const l = eclipticLongitude(m)
  const dec = declination(l)
  const jTransit = jStar + 0.0053 * Math.sin(m) - 0.0069 * Math.sin(2 * l)
  const cosH = (Math.sin(HOUR_ANGLE) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec))
  if (cosH > 1 || cosH < -1) return null
  const h = Math.acos(cosH) / PI2
  const fromJulian = (j: number) => new Date((j - J1970 + 0.5) * DAY_MS)
  return { rise: fromJulian(jTransit - h), set: fromJulian(jTransit + h) }
}

const timesOf = (date: Date, point: { lat: number, lng: number }) =>
  getSunTimes(date.getFullYear(), date.getMonth(), date.getDate(), point.lat, point.lng)

/**
 * 离现在最近的那个切换点（前后可各看一天，所以深夜会指向明天的日出、凌晨会指向今天的日出）。
 * 状态行按它显示「几点日出/日落」：离日出近就说日出，离日落近就说日落。
 * 算不出升落（极圈）返回 null。
 */
export const nearestSwitch = (now: Date, point: { lat: number, lng: number }) => {
  let best: { at: Date, isSunrise: boolean } | null = null
  let bestMinutes: number | null = null
  for (const offset of [-DAY_MS, 0, DAY_MS]) {
    const times = timesOf(new Date(now.getTime() + offset), point)
    if (!times) continue
    for (const cand of [{ at: times.rise, isSunrise: true }, { at: times.set, isSunrise: false }]) {
      const minutes = Math.abs(cand.at.getTime() - now.getTime()) / 60000
      if (bestMinutes == null || minutes < bestMinutes) {
        bestMinutes = minutes
        best = cand
      }
    }
  }
  return best
}

/**
 * 离最近那个切换点（日出或日落）还有多少分钟。
 * 算不出升落时返回 null，调用方按"离切换点很远"处理。
 */
export const minutesToNearestSwitch = (now: Date, point: { lat: number, lng: number }) => {
  const nearest = nearestSwitch(now, point)
  return nearest == null ? null : Math.abs(nearest.at.getTime() - now.getTime()) / 60000
}

/**
 * 现在是不是夜里：当天日落之后，或当天日出之前（且昨天已过日落）。
 * 算不出升落（极圈）返回 false，调用方按白天处理。
 */
export const isNightNow = (now: Date, point: { lat: number, lng: number }) => {
  const today = timesOf(now, point)
  if (!today) return false
  if (now.getTime() >= today.set.getTime()) return true
  if (now.getTime() >= today.rise.getTime()) return false
  const yest = timesOf(new Date(now.getTime() - DAY_MS), point)
  return !!yest && now.getTime() >= yest.set.getTime()
}
