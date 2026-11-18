#!/usr/bin/env node
/**
 * 从 new_design 的榜单封面体系生成 RN 侧的两个产物（原型是唯一真源，RN 侧不许另编一套）：
 *
 *   1. src/newui/components/RankCover/covers/<key>.webp  +  coverAssets.ts
 *      ← new_design/rank-covers/*.png（2026-10-22 这批 49 张 512×512：48 张判据封面 + 1 张 `default` 兜底，
 *      图上不带字、四角满幅方角）
 *      母图是无损 PNG，17 MB 一批全塞进 APK 包体直接从 13.9 涨到 32 MB，所以**出包的是 WebP**：
 *      这里调 scripts/encode-rank-webp.py 按 WEBP_QUALITY 有损编码一份，母图仍留在原型那侧只读不动。
 *      RN Image 直接画（.webp 在 Metro 默认 assetExts 里，安卓由 Fresco 解码，装了就能看不连 dev server）。
 *      注意：卡上两行白字不叠遮罩（2026-10-22 撤），所以换包/改画质不再需要重跑遮罩求解器；
 *      要挂回去得先对**出包这批**重证，见 scripts/rank-scrim-solver.html。
 *
 *   2. src/newui/const/rankCoverWords.ts
 *      ← new_design/data.js 里的 `RANK_COVER_WORDS` 字面量（它本身由 scripts/gen-rank-cover-words.mjs 生成）
 *      榜名 → 封面 key 的判据表：**原样搬运，顺序一字不动**（表按先后命中，最长词根优先，
 *      同长度按 外部授权榜 > 语种 > 地区 > 曲风 > 场景 > 排名机制）。
 *      RN 侧自己重编一套排序不算完成 —— 同一个榜名就会在原型和 App 落到两张不同的封面。
 *
 * 用法：node scripts/gen-newui-rank-covers.mjs        （生成）
 *      node scripts/gen-newui-rank-covers.mjs --check （只体检，不写文件）
 *
 * 输入只读：new_design/rank-covers/ 与 new_design/data.js 一律不改。
 * 断言不过直接报错退出，不开「其它/兜底」桶。
 * 生成需要 python3 + Pillow（--check 不需要）。
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const COVER_DIR = resolve(root, 'new_design/rank-covers')
const DATA_JS = resolve(root, 'new_design/data.js')
const OUT_DIR = resolve(root, 'src/newui/components/RankCover')
const OUT_ASSET_DIR = resolve(OUT_DIR, 'covers')
const OUT_ASSETS = resolve(OUT_DIR, 'coverAssets.ts')
const OUT_WORDS = resolve(root, 'src/newui/const/rankCoverWords.ts')
const ENCODER = resolve(root, 'scripts/encode-rank-webp.py')
const WEBP_QUALITY = 85
const CHECK = process.argv.includes('--check')

const errors = []
const fail = msg => errors.push(msg)

// ---------------------------------------------------------------------------
// 1. 榜名 → 封面 key 判据表：从 data.js 原文取字面量，按原顺序搬运
// ---------------------------------------------------------------------------
const dataSrc = readFileSync(DATA_JS, 'utf8')
const literal = dataSrc.match(/\nconst RANK_COVER_WORDS = \[([\s\S]*?)\n\];/)
if (!literal) fail(`${DATA_JS} 里找不到 RANK_COVER_WORDS 字面量（原型那侧改过结构？先看 gen-rank-cover-words.mjs）`)

const wordsTable = []
if (literal) {
  for (const line of literal[1].split('\n')) {
    const t = line.trim()
    if (!t) continue
    const m = t.match(/^\['([^']+)',\s*\[(.*)\],?\],$/)
    if (!m) {
      fail(`RANK_COVER_WORDS 行形如 ['key', ['词根', …]]，实际收到 ${JSON.stringify(t)}`)
      continue
    }
    wordsTable.push([m[1], m[2].split(',').map(s => s.trim()).filter(Boolean).map(s => s.replace(/^'|'$/g, ''))])
  }
  const keys = wordsTable.map(r => r[0])
  const seen = new Set()
  const dup = keys.filter(k => (seen.has(k) ? true : (seen.add(k), false)))
  if (dup.length) fail(`RANK_COVER_WORDS 有重复 key：${dup.join(' / ')}`)
}

// ---------------------------------------------------------------------------
// 2. 封面本体：母图 512×512 无损 PNG，进包的压成 WebP
// ---------------------------------------------------------------------------
const pngs = []
const files = existsSync(COVER_DIR) ? readdirSync(COVER_DIR).filter(f => f.endsWith('.png')).sort() : []
if (!files.length) fail(`${COVER_DIR} 下一张封面 PNG 都没有`)

for (const file of files) {
  const key = file.replace(/\.png$/, '')
  const buf = readFileSync(`${COVER_DIR}/${file}`)
  if (buf.subarray(1, 4).toString('latin1') !== 'PNG') fail(`${file}: 文件头不是一张 PNG`)
  const w = buf.readUInt32BE(16)
  const h = buf.readUInt32BE(20)
  if (w < 128 || h < 128) fail(`${file}: 位图只有 ${w}x${h}，小到不能用（源图分辨率问题，回头找设计要大的）`)
  if (w !== h) fail(`${file}: ${w}x${h} 不是正方图，卡片是方的，拉伸会走形`)
  pngs.push({ key, buf, w, h })
}

// 图与表一一对上：表里有的必须有图，图多出来的一张都不许留。
// 唯一的例外是 default —— 它不参与「榜名→封面」判据，是判据命不中时那张兜底脸（chartFace 直接按 key 取）。
const DEFAULT_KEY = 'default'
const artKeys = pngs.map(p => p.key)
const wordKeys = wordsTable.map(r => r[0])
const missingArt = wordKeys.filter(k => !artKeys.includes(k))
const orphanArt = artKeys.filter(k => k !== DEFAULT_KEY && !wordKeys.includes(k))
if (missingArt.length) fail(`判据表里有 ${missingArt.length} 个 key 没有对应封面文件：${missingArt.join(' / ')}`)
if (orphanArt.length) fail(`封面目录里有 ${orphanArt.length} 张图不在判据表里（榜名永远落不到它）：${orphanArt.join(' / ')}`)
if (!artKeys.includes(DEFAULT_KEY)) fail(`封面目录里没有 ${DEFAULT_KEY}.png —— 判据命不中的那三十来个榜名全靠它兜底，缺了它们就没脸了`)

if (errors.length) {
  console.error(`生成中止，${errors.length} 处不对：`)
  errors.forEach(e => console.error(`  · ${e}`))
  process.exit(1)
}

const wordsLines = [
  '/* eslint-disable */',
  '/**',
  ' * 本文件由 scripts/gen-newui-rank-covers.mjs 从 new_design/data.js 的 RANK_COVER_WORDS 原样搬运生成，请勿手改。',
  ' * 判据表：榜名里含哪个词就用哪张封面；**顺序即优先级**（最长词根优先，同长度按',
  ' * 外部授权榜 > 语种 > 地区 > 曲风 > 场景 > 排名机制），要改请改原型那侧再重跑脚本。',
  ' */',
  '',
  'export const RANK_COVER_WORDS: ReadonlyArray<readonly [string, readonly string[]]> = [',
  ...wordsTable.map(([key, words]) => `  [${JSON.stringify(key)}, [${words.map(w => JSON.stringify(w)).join(', ')}]],`),
  '] as const',
  '',
]

const masterBytes = pngs.reduce((n, p) => n + p.buf.length, 0)

const assetLines = [
  '/* eslint-disable */',
  '/**',
  ' * 本文件由 scripts/gen-newui-rank-covers.mjs 从 new_design/rank-covers/*.png 生成，请勿手改。',
  ` * ./covers/<key>.webp 是母图（无损 PNG，只留在原型那侧）按 q85 压出来的出包件；母图 ${pngs.length} 张合计 ${(masterBytes / 1024 / 1024).toFixed(2)} MB，`,
  ' * 原样进包会把 APK 从 13.9 MB 顶到 32 MB，所以打进去的是 WebP。改画质请改生成脚本 WEBP_QUALITY 再重跑。',
  ' * 卡上那两行白字直接压图，只靠紧贴字边的小投影兜可读性（ChartArt），**不叠压顶遮罩**——',
  ' * 2026-10-22 那档遮罩按用户口径撤了；要再挂得先重跑 scripts/rank-scrim-solver.html 对出包这批重证。',
  ' * 由 Metro 打进 APK（装了就能看，不连 dev server）。require 的路径必须写成字面量，动态拼路径 Metro 收不到。',
  ' */',
  '',
  "/** 封面 key → 静态资源（key = new_design/rank-covers/ 的文件名；判据见 const/rankCoverWords.ts，命不中时外层铺 default 那张） */",
  'export const RANK_COVER_ASSETS: Readonly<Record<string, number>> = {',
  ...pngs.map(p => `  ${JSON.stringify(p.key)}: require('./covers/${p.key}.webp'),`),
  '}',
  '',
]

if (CHECK) {
  console.log(`封面 ${pngs.length} 张（${Math.min(...pngs.map(p => p.w))}~${Math.max(...pngs.map(p => p.w))}px 方图），判据表 ${wordsTable.length} 行，图与表一一对上`)
  console.log(`母图（无损 PNG，原型侧）合计 ${(masterBytes / 1024 / 1024).toFixed(2)} MB`)
  const shipped = pngs.filter(p => existsSync(`${OUT_ASSET_DIR}/${p.key}.webp`))
  if (shipped.length !== pngs.length) {
    console.log(`出包目录里 WebP 只有 ${shipped.length}/${pngs.length} 张（还没生成，或换包后没重跑）`)
  } else {
    const bytes = shipped.reduce((n, p) => n + readFileSync(`${OUT_ASSET_DIR}/${p.key}.webp`).length, 0)
    console.log(`打进 APK 的 WebP 合计 ${(bytes / 1024 / 1024).toFixed(2)} MB（q85）`)
  }
  console.log('（--check 不写文件）')
  process.exit(0)
}

// 旧资源一律清掉：换包后不许留下上一批的孤儿文件（require 是字面量，漏删也打不进包，但仓库会脏）
rmSync(OUT_ASSET_DIR, { recursive: true, force: true })
mkdirSync(OUT_ASSET_DIR, { recursive: true })

const jobs = pngs.map(p => `${COVER_DIR}/${p.key}.png\t${OUT_ASSET_DIR}/${p.key}.webp\t${WEBP_QUALITY}`).join('\n') + '\n'
const enc = spawnSync('python3', [ENCODER], { input: jobs, encoding: 'utf8' })
if (enc.status !== 0) {
  console.error('WebP 编码失败（需要 python3 + Pillow）：')
  console.error(enc.stderr || enc.stdout)
  process.exit(1)
}

for (const p of pngs) {
  const out = `${OUT_ASSET_DIR}/${p.key}.webp`
  if (!existsSync(out)) {
    fail(`${p.key}: 编码器没产出 ${out}`)
    continue
  }
  const buf = readFileSync(out)
  const tag = buf.subarray(0, 4).toString('latin1') + buf.subarray(8, 12).toString('latin1')
  if (tag !== 'RIFFWEBP') fail(`${p.key}: 产出文件头是 ${JSON.stringify(tag)}，不是 WebP`)
  if (buf.length > p.buf.length) fail(`${p.key}: 压完 ${buf.length} 字节比母图 ${p.buf.length} 还大，编码参数有问题`)
}
if (errors.length) {
  console.error(`生成中止，${errors.length} 处不对：`)
  errors.forEach(e => console.error(`  · ${e}`))
  process.exit(1)
}

const shippedBytes = pngs.reduce((n, p) => n + readFileSync(`${OUT_ASSET_DIR}/${p.key}.webp`).length, 0)
writeFileSync(OUT_ASSETS, assetLines.join('\n'))
writeFileSync(OUT_WORDS, wordsLines.join('\n'))
// 上一批的矢量节点表：这批封面没有矢量，留着就是死文件
rmSync(resolve(OUT_DIR, 'coverData.ts'), { force: true })
console.log(`已压出 ${pngs.length} 张 WebP（q${WEBP_QUALITY}）-> ${OUT_ASSET_DIR}`)
console.log(`包体位图：母图 ${(masterBytes / 1024 / 1024).toFixed(2)} MB -> 出包 ${(shippedBytes / 1024 / 1024).toFixed(2)} MB`)
console.log(`已生成资源表 -> ${OUT_ASSETS}`)
console.log(`已生成判据表 ${wordsTable.length} 行 -> ${OUT_WORDS}`)
