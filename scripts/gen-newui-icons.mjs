#!/usr/bin/env node
/**
 * 从 new_design/index.html 的 SVG sprite 生成 RN 图标数据
 * 用法：node scripts/gen-newui-icons.mjs
 * 输出：src/newui/components/Icon/icons.ts（生成文件，请勿手改）
 *
 * 说明：原型图标以 <symbol id="i-xxx"> 形式内联在 index.html 中，
 * 本脚本将其转成 react-native-svg 可渲染的节点数据，保证与原型 1:1。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const html = readFileSync(resolve(root, 'new_design/index.html'), 'utf8')
const outFile = resolve(root, 'src/newui/components/Icon/icons.ts')

// 1. 取出 sprite 内全部 symbol
const symbolRxp = /<symbol\s+id="([^"]+)"\s+viewBox="([^"]+)"\s*>([\s\S]*?)<\/symbol>/g
const symbols = []
let match
while ((match = symbolRxp.exec(html)) != null) {
  symbols.push({ id: match[1], viewBox: match[2], inner: match[3] })
}
if (symbols.length === 0) {
  console.error('未在 new_design/index.html 中找到 SVG sprite symbol，脚本终止')
  process.exit(1)
}

// 2. 属性解析：kebab-case → camelCase；纯数字值转 number
const toCamel = name => name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
const parseAttrs = str => {
  const props = {}
  const rxp = /([\w-]+)="([^"]*)"/g
  let a
  while ((a = rxp.exec(str)) != null) {
    const key = toCamel(a[1])
    const raw = a[2]
    const num = Number(raw)
    props[key] = raw !== '' && !Number.isNaN(num) ? num : raw
  }
  return props
}

// 3. 解析 symbol 内部（结构为浅层：自闭合元素 / <g> / <text>）
const parseNodes = inner => {
  const nodes = []
  const rxp = /<(path|circle|rect|g|text)([^>]*?)(\/?)>/g
  let cur
  while ((cur = rxp.exec(inner)) != null) {
    const type = cur[1]
    const props = parseAttrs(cur[2])
    if (cur[3] === '/') {
      nodes.push({ type, props })
      continue
    }
    if (type === 'g') {
      const end = inner.indexOf('</g>', rxp.lastIndex)
      nodes.push({ type, props, children: parseNodes(inner.slice(rxp.lastIndex, end)) })
      rxp.lastIndex = end + 4
      continue
    }
    if (type === 'text') {
      const end = inner.indexOf('</text>', rxp.lastIndex)
      nodes.push({ type, props, text: inner.slice(rxp.lastIndex, end) })
      rxp.lastIndex = end + 6
    }
  }
  return nodes
}

// 4. 序列化为 TS
const serializeProps = props =>
  '{ ' + Object.entries(props).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ') + ' }'

const serializeNode = (node, indent) => {
  const pad = ' '.repeat(indent)
  const parts = [`type: ${JSON.stringify(node.type)}`, `props: ${serializeProps(node.props)}`]
  if (node.children != null) {
    const children = node.children.map(c => serializeNode(c, indent + 2)).join(',\n')
    parts.push(`children: [\n${children},\n${pad}]`)
  }
  if (node.text !== undefined) parts.push(`text: ${JSON.stringify(node.text)}`)
  return `${pad}{ ${parts.join(', ')} }`
}

const names = symbols.map(s => toCamel(s.id.replace(/^i-/, '')))
const lines = []
lines.push('/**')
lines.push(' * 本文件由 scripts/gen-newui-icons.mjs 从 new_design/index.html 的 SVG sprite 自动生成，请勿手改。')
lines.push(` * 共 ${symbols.length} 个图标；重新生成：node scripts/gen-newui-icons.mjs`)
lines.push(' */')
lines.push("import type { IconDef } from './types'")
lines.push('')
lines.push(`export type IconName = ${names.map(n => JSON.stringify(n)).join(' | ')}`)
lines.push('')
lines.push('export const ICON_DATA: Record<IconName, IconDef> = {')
for (const symbol of symbols) {
  const name = toCamel(symbol.id.replace(/^i-/, ''))
  const nodes = parseNodes(symbol.inner)
  lines.push(`  ${JSON.stringify(name)}: {`)
  lines.push(`    viewBox: ${JSON.stringify(symbol.viewBox)},`)
  lines.push('    nodes: [')
  for (const node of nodes) lines.push(serializeNode(node, 6) + ',')
  lines.push('    ],')
  lines.push('  },')
}
lines.push('}')
lines.push('')

writeFileSync(outFile, lines.join('\n'))
console.log(`已生成 ${symbols.length} 个图标 -> ${outFile}`)
