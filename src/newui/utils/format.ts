/**
 * 原型 fmt(sec)：秒 → m:ss。
 * 与原型一致，不换算小时（超 60 分钟的曲目会显示如 61:20）。
 */
export const formatDuration = (sec: number): string =>
  `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`

/** 两位补零 */
const pad2 = (n: number): string => String(n).padStart(2, '0')

/**
 * 今天的「日期键」与「展示文本」：
 * 每日推荐按日期做稳定推算（同一天刷新还是那批歌），卡片右上角只显示月/日。
 */
export const getToday = (): { key: string; label: string } => {
  const now = new Date()
  const month = pad2(now.getMonth() + 1)
  const date = pad2(now.getDate())
  return { key: `${now.getFullYear()}-${month}-${date}`, label: `${month}/${date}` }
}

/**
 * 计数展示（原型「4.2万」风格）：1 万以上一位小数带「万」，否则原样数字。
 * 评论点赞数等场景共用。
 */
export const formatCount = (count: number): string =>
  count >= 10000 ? `${(count / 10000).toFixed(1)}万` : String(count)

/** MB ↔ G 的进制（本机缓存按 1024 进位报数，与取数侧 toMb 的字节→MB 同一口径） */
const MB_PER_G = 1024

/**
 * 本机缓存体积（2026-10-22 用户口径）：**满 1024 MB 就换成 G 报**，别让「已缓存」下面写 3200 MB 这种数。
 * - 不足 1024 MB：原样整数 + MB；
 * - 到 1024 MB 以上：除以 1024 保留一位小数 + G（1.0 G 起，向下取整到 0.1 档，别报出比实际大的数）。
 * 单位只在这一处拼，屏上所有「占用多少」的文案都从这里出（见 const/offline.ts）。
 */
export const formatCacheSize = (mb: number): string => {
  if (!(mb > 0)) return '0 MB'
  if (mb < MB_PER_G) return `${mb} MB`
  // 一位小数按「 floor 到 0.1」：1.09 G 报 1 G 档里的 1.0，不吹成 1.1
  return `${(Math.floor((mb / MB_PER_G) * 10) / 10).toFixed(1)} G`
}
