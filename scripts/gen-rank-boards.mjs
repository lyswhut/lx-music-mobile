#!/usr/bin/env node
/* 生成原型 data.js 里的 BOARDS 块：五平台真实榜单目录，直接抄内置 SDK
 * （src/utils/musicSdk/{平台}/leaderboard.js 的 boardList / topList，顺序也照它）。
 * 用法：node scripts/gen-rank-boards.mjs [--check]
 * --check 只比对，不写文件。 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'new_design/data.js');
const PLATFORMS = [
  ['tx', 'QQ音乐'], ['wy', '网易云'], ['kw', '酷我音乐'], ['kg', '酷狗音乐'], ['mg', '咪咕音乐'],
];

const names = (key) => {
  const src = fs.readFileSync(path.join(ROOT, 'src/utils/musicSdk', key, 'leaderboard.js'), 'utf8');
  const m = src.match(/(?:boardList|topList)\s*=\s*(\[[\s\S]*?\])\s*\n/);
  if (!m) throw new Error(`${key}: 没找到榜目录`);
  return new Function('return ' + m[1])().map((x) => String(x.name).trim());
};

const arr = (list) => {
  const rows = [];
  for (let i = 0; i < list.length; i += 4) rows.push('    ' + list.slice(i, i + 4).map((n) => `'${n}'`).join(', ') + ',');
  return rows.join('\n');
};

const total = PLATFORMS.reduce((s, [k]) => s + names(k).length, 0);
const entries = PLATFORMS.map(([k, l]) => {
  const list = names(k);
  return `  ${k}: [\n${arr(list)}\n  ], // ${l} ${list.length} 张`;
}).join('\n');
const block = `/* 每个平台的真实榜单目录直接抄内置 SDK（src/utils/musicSdk/{平台}/leaderboard.js 的
 * boardList / topList），一张不编——原来这里每人只写 9 个假榜名，界面上「这个平台到底有哪些榜」
 * 全是被编出来的。共 ${total} 张：${PLATFORMS.map(([k, l]) => l + ' ' + names(k).length).join(' / ')}。
 * 重跑：\`node scripts/gen-rank-boards.mjs\`（改动只应在 SDK 目录变化时发生） */
const BOARDS = {
${entries}
};`;

const src = fs.readFileSync(DATA, 'utf8');
const from = src.indexOf('/* 每个平台的真实榜单目录');
const to = src.indexOf('\n};', from);
const anchor = '/* 首页「热门单曲」的榜单 tab';
const ai = src.indexOf(anchor);
if (from < 0) { if (ai < 0) throw new Error('找不到插入锚点'); }
const current = from < 0 ? '' : src.slice(from, to + 3);

if (process.argv.includes('--check')) {
  console.log(current === block ? 'BOARDS 与 SDK 目录一致' : 'BOARDS 需要重跑生成');
  process.exit(current === block ? 0 : 1);
}
const out = from < 0
  ? src.slice(0, ai) + block + '\n\n' + src.slice(ai)
  : src.slice(0, from) + block + src.slice(to + 3);
fs.writeFileSync(DATA, out);
console.log(`new_design/data.js：BOARDS 已生成，共 ${total} 张榜`);
