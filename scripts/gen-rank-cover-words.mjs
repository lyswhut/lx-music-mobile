#!/usr/bin/env node
/* 生成 new_design/data.js 里的 RANK_COVER_WORDS 字面量。
 * 真源 = new_design/rank-covers/manifest.json（2026-10-22 这批：48 张无字方角 PNG，key + 中文榜名）。
 * 封面包里那张 default.png 不在 manifest 的 48 条里，是**有意**的：它只给判据命不中的
 * 榜名兜底（chartFace 里 ?? RANK_COVER_DEFAULT），一旦进表就变成「什么榜名都认领」的万能词根，
 * 所以这里读 manifest 而不是读目录，别改成扫 *.png。
 * 词根 = manifest 的中文榜名（去掉结尾「榜」），再叠一层别名（真实目录里同一类榜各家叫法不同，
 * 如 日本公信榜 vs 日本Oricon榜、动漫音乐榜 vs ACG榜）。
 * 排序 = 最长词根优先，同长度时按「外部授权榜 > 语种 > 地区 > 曲风 > 场景 > 权益 > 排名机制」，
 * 这样「欧美热歌榜」落 west 不落 hot、「日本Oricon榜」落 oricon 不落 japan。
 * 类别不在 manifest 里（这批只给了 key/name/file/size/format），所以下面 CATEGORY 手工点名，
 * 没点到的按「其它」排到最后。
 * 用法：node scripts/gen-rank-cover-words.mjs            （打印字面量）
 *      node scripts/gen-rank-cover-words.mjs --check    （只跑真实目录覆盖率体检） */
import fs from 'node:fs';
import path from 'node:path';

const COVERS = 'new_design/rank-covers';
const PLATFORMS = ['tx', 'wy', 'kw', 'kg', 'mg'];

/* 别名：真实目录里跟 canonical 不重名的叫法（key 必须是 manifest 里有的，否则脚本会报错） */
const ALIAS = {
  acg: ['动漫', '游戏', '二次元', '番剧', 'VOCALOID'],
  ancient_style: ['古风'],
  billboard: ['BILLBOARD'],
  bus: ['巴士'],
  cantonese: ['广东'],
  children: ['儿歌', '儿童'],
  chinese: ['国语'],
  chinese_style: ['国风'],
  classic: ['老歌', '怀旧'],
  country: ['乡村'],
  country_china: ['中国乡村'],
  electronic: ['电音', '电子', 'DJ', '舞曲', 'BEATPORT'],
  female: ['女声', '女子'],
  france: ['法国'],
  healing: ['治愈', '疗愈', '轻音乐', '睡前', '枕边'],
  hongkong: ['香港'],
  hot: ['热歌', '热门', '流行', '红歌', '爆款'],
  identify_song: ['听歌识曲', '识曲'],
  instrumental: ['纯音乐', '演奏'],
  itunes: ['ITUNES'],
  japan: ['日本'],
  japanese_language: ['日语'],
  jazz: ['爵士'],
  karaoke: ['K歌'],
  kkbox: ['KKBOX'],
  korea: ['韩国', '韩语'],
  ktv: ['KTV'],
  live: ['现场', '演唱会', 'LIVE'],
  male: ['男声'],
  melon: ['MELON'],
  new: ['新歌', '新碟', '首发'],
  oricon: ['ORICON', '公信'],
  original: ['原创', '音乐人', '独立音乐'],
  rap: ['说唱', '嘻哈', 'TRAP'],
  rising: ['飙升', '上升', '热涨', '尖叫'],
  rnb: ['R&B', 'RNB', '节奏布鲁斯'],
  ringtone: ['铃声', '彩铃'],
  rock: ['摇滚', '乐队', '朋克'],
  soundtrack: ['影视', '原声', 'OST', '主题曲', '综艺'],
  taiwan: ['台湾'],
  thai: ['泰语'],
  uk: ['英国', 'UK'],
  vip: ['VIP', '会员', '黑胶'],
  west: ['欧美'],
  winter: ['冬日', '暖心'],
  youtube: ['YOUTUBE'],
};

/* 同长度并列时谁先命中（数值小者优先）；未点名的按 9 */
const CATEGORY = {
  billboard: 'authority', itunes: 'authority', oricon: 'authority', kkbox: 'authority',
  melon: 'authority', youtube: 'authority', uk: 'authority',
  chinese: 'language', cantonese: 'language', japanese_language: 'language', thai: 'language',
  west: 'region', hongkong: 'region', taiwan: 'region', korea: 'region', japan: 'region', france: 'region',
  acg: 'genre', classic: 'genre', electronic: 'genre', folk: 'genre', rap: 'genre', rock: 'genre',
  soundtrack: 'genre', female: 'genre', male: 'genre', original: 'genre', chinese_style: 'genre',
  ancient_style: 'genre', country: 'genre', country_china: 'genre', jazz: 'genre', rnb: 'genre',
  children: 'genre', instrumental: 'genre',
  healing: 'scene', identify_song: 'scene', bus: 'scene', karaoke: 'scene', ktv: 'scene',
  live: 'scene', winter: 'scene', ringtone: 'scene',
  vip: 'membership',
  hot: 'ranking', new: 'ranking', rising: 'ranking',
};
const CAT_RANK = { authority: 0, language: 1, region: 2, genre: 3, scene: 4, membership: 5, ranking: 6 };

const realNames = () => {
  const set = new Set();
  for (const p of PLATFORMS) {
    const s = fs.readFileSync(`src/utils/musicSdk/${p}/leaderboard.js`, 'utf8');
    new Function('return ' + s.match(/(?:boardList|topList)\s*=\s*(\[[\s\S]*?\])\s*\n/)[1])()
      .forEach((b) => set.add(b.name.trim()));
  }
  return [...set];
};

const build = () => {
  const man = JSON.parse(fs.readFileSync(path.join(COVERS, 'manifest.json'), 'utf8'));
  const files = new Set(fs.readdirSync(COVERS).filter((f) => /\.(png|svg)$/.test(f)));
  const table = man.map((m) => {
    if (!files.has(m.file)) throw new Error(`manifest 里的 ${m.key} 指向 ${m.file}，封面包里没有这张`);
    const stem = m.name.replace(/榜$/, '');
    const words = [...new Set([stem, ...(ALIAS[m.key] || [])].filter(Boolean))];
    if (!words.length) throw new Error(`${m.key} 一个词根都没有`);
    return { key: m.key, words, rank: CAT_RANK[CATEGORY[m.key]] ?? 9 };
  });
  const unknown = Object.keys(ALIAS).filter((k) => !man.some((m) => m.key === k));
  if (unknown.length) throw new Error(`ALIAS 里挂了已不存在的 key：${unknown.join(' ')}`);
  const maxLen = (t) => Math.max(...t.words.map((w) => w.length));
  table.sort((a, b) => maxLen(b) - maxLen(a) || a.rank - b.rank || a.key.localeCompare(b.key));
  return table;
};

const table = build();
const lookup = (name) => {
  const n = name.toUpperCase();
  const hit = table.find((t) => t.words.some((w) => n.includes(w.toUpperCase())));
  return hit ? hit.key : null;
};

const names = realNames();
const miss = names.filter((n) => !lookup(n));
if (process.argv.includes('--check')) {
  console.log(`真实榜名 ${names.length} 个 → 命中 ${names.length - miss.length}，未命中 ${miss.length}`);
  if (miss.length) console.log('未命中：\n  ' + miss.join('\n  '));
  const dup = {};
  for (const n of names) { const k = lookup(n); if (k) (dup[k] ||= []).push(n); }
  console.log('\n每张封面顶到的榜名数：');
  Object.entries(dup).sort((a, b) => b[1].length - a[1].length)
    .forEach(([k, v]) => console.log(`  ${k.padEnd(18)}${String(v.length).padStart(3)}  ${v.join(' / ')}`));
  const unused = table.filter((t) => !Object.keys(dup).includes(t.key)).map((t) => t.key);
  console.log(`\n没顶到任何真实榜的封面（${unused.length}）: ${unused.join(' ')}`);
} else {
  const lines = table.map((t) => `  ['${t.key}', [${t.words.map((w) => `'${w}'`).join(', ')}]],`);
  console.log(lines.join('\n'));
  console.error(`共 ${table.length} 个 key，未命中 ${miss.length} 个真实榜名${miss.length ? '：' + miss.join(' / ') : ''}`);
}
