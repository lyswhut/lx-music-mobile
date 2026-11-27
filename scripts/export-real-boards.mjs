#!/usr/bin/env node
/* 一次性导出：从内置 musicSdk 的五家 leaderboard.js 里抽出全量真实榜名，
 * 生成给榜单封面设计用的清单（new_design/rank-boards-real.md）。
 * 用法：node scripts/export-real-boards.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLATFORMS = [
  { key: 'tx', label: 'QQ音乐' },
  { key: 'wy', label: '网易云音乐' },
  { key: 'kw', label: '酷我音乐' },
  { key: 'kg', label: '酷狗音乐' },
  { key: 'mg', label: '咪咕音乐' },
];

const readBoards = (p) => {
  const src = fs.readFileSync(path.join(ROOT, 'src/utils/musicSdk', p, 'leaderboard.js'), 'utf8');
  const m = src.match(/(?:boardList|topList)\s*=\s*(\[[\s\S]*?\])\s*\n/);
  if (!m) throw new Error(`${p}: 没找到榜目录`);
  return new Function('return ' + m[1])().map((x) => ({ name: String(x.name).trim(), bangid: String(x.bangid) }));
};

/* 现有 15 张插画的关键词表，直接读原型，免得两边各写一份对不上 */
const COVER_WORDS = new Function('return ' + fs.readFileSync(path.join(ROOT, 'new_design/data.js'), 'utf8')
  .match(/RANK_COVER_WORDS\s*=\s*(\[[\s\S]*?\n\]);/)[1])();
const coverKey = (n) => {
  const u = n.toUpperCase();
  const hit = COVER_WORDS.find(([, w]) => w.some((x) => u.includes(x.toUpperCase())));
  return hit ? hit[0] : '';
};

const all = PLATFORMS.map((p) => ({ ...p, boards: readBoards(p.key) }));
const uniq = new Map();
for (const p of all) for (const b of p.boards) {
  if (!uniq.has(b.name)) uniq.set(b.name, []);
  if (!uniq.get(b.name).includes(p.label)) uniq.get(b.name).push(p.label);
}

/* 分组按「封面要画的东西」分，一类一类开画比按平台开画省手 */
const GROUPS = [
  ['主打 / 排名机制', ['热歌', '新歌', '飙升', '上升', '流行', '指数', '原创', '音乐人', '翻唱', '网络', '红歌', '爆款', 'TOP', '尖叫', '编辑推荐', '雷达', '分享', '赏音', '新专辑', 'MV', '热评', '真声音', '5sing', '繁星', 'BEAT', '神曲']],
  ['曲风', ['摇滚', '说唱', '嘻哈', '电音', '电子', '舞曲', 'DJ', '国电', '国风', '古风', '民谣', '乡村', '古典', '经典', '纯音乐', '爵士', 'R&B', 'ACG', '动漫', '游戏', 'VOCALOID', '儿歌', '轻音乐', '喊麦', '影视', '综艺', '原声', '主题曲']],
  ['语种 / 地区', ['内地', '华语', '粤语', '港台', '台湾', '香港', '欧美', '英国', '美国', '韩国', '韩语', '日本', '日语', '泰国', '泰语', '越南', '俄语', '俄罗斯', '法语', '法国', '闽南语', '日韩', '小语种', 'Billboard', 'UK', 'iTunes', 'Oricon', 'Melon', 'KKBOX', 'Genie', 'M-net', 'Beatport', 'SHOWER', 'Hito', 'YouTube', 'joox']],
  ['场景 / 情绪', ['抖音', '快手', '抖快', 'Vlog', '短视频', '车载', '巴士', '随身听', 'KTV', 'K歌', '唛', '铃声', '彩铃', '助眠', '熬夜', '修仙', '冬日', '暖心', '家务', '伤感', '现场', '直播', '校园', '有声', '听歌识曲', '识曲', '会员', '黑胶', '畅听', '专享', 'VIP']],
];
const groupOf = (name) => {
  const u = name.toUpperCase();
  const hit = GROUPS.find(([, words]) => words.some((w) => u.includes(w.toUpperCase())));
  return hit ? hit[0] : '其它 / 未归类';
};

const lines = [];
lines.push('# 五平台真实榜单全量清单（封面设计用）');
lines.push('');
lines.push(`> 来源：\`src/utils/musicSdk/{平台}/leaderboard.js\`。QQ音乐 ${all[0].boards.length} / 网易云 ${all[1].boards.length} / 酷我 ${all[2].boards.length} / 酷狗 ${all[3].boards.length} / 咪咕 ${all[4].boards.length}，共 ${all.reduce((s, p) => s + p.boards.length, 0)} 张；跨平台重名合并后 **${uniq.size} 个榜名**。`);
lines.push('> 重跑：`node scripts/export-real-boards.mjs`。「有图」那一列是现在这 15 张插画按关键词命中的结果，空着就是要新画的。');
lines.push('');
lines.push('## 一、去重后的榜名，按要画的东西分组');
lines.push('');
for (const g of [...GROUPS.map(([x]) => x), '其它 / 未归类']) {
  const names = [...uniq.keys()].filter((n) => groupOf(n) === g)
    .sort((a, b) => (coverKey(a) ? 1 : 0) - (coverKey(b) ? 1 : 0) || uniq.get(b).length - uniq.get(a).length || a.localeCompare(b, 'zh'));
  if (!names.length) continue;
  lines.push(`### ${g}（${names.length} 个）`);
  lines.push('');
  names.forEach((n) => lines.push(`- ${n}　\`${uniq.get(n).length}家\`　${coverKey(n) ? '有图:' + coverKey(n) : '**待画**'}`));
  lines.push('');
}
lines.push('## 二、逐平台全量（含 bangid，RN 取数坐标 = `{平台}__{bangid}`）');
lines.push('');
for (const p of all) {
  lines.push(`### ${p.label}（${p.key}，${p.boards.length} 张）`);
  lines.push('');
  lines.push('| # | 榜名 | bangid | 有图 |');
  lines.push('|---|---|---|---|');
  p.boards.forEach((b, i) => lines.push(`| ${i + 1} | ${b.name} | ${b.bangid} | ${coverKey(b.name) || '—'} |`));
  lines.push('');
}
fs.writeFileSync(path.join(ROOT, 'new_design/rank-boards-real.md'), lines.join('\n') + '\n');

const need = [...uniq.keys()].filter((n) => !coverKey(n));
console.log(`new_design/rank-boards-real.md：${all.reduce((s, p) => s + p.boards.length, 0)} 张 / 去重 ${uniq.size} 个`);
for (const g of [...GROUPS.map(([x]) => x), '其它 / 未归类']) {
  const names = [...uniq.keys()].filter((n) => groupOf(n) === g);
  console.log(`  ${g}: ${names.length} 个（待画 ${names.filter((n) => !coverKey(n)).length}）`);
}
console.log(`  合计待画（去重）: ${need.length} 个`);
