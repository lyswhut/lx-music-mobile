/**
 * 图标数据结构：由 new_design/index.html 的 SVG sprite 转换而来。
 * 生成文件见 icons.ts（scripts/gen-newui-icons.mjs 自动生成，勿手改）。
 */

/** 单个 SVG 节点（仅覆盖原型 sprite 用到的元素类型） */
export interface IconNode {
  type: 'path' | 'circle' | 'rect' | 'g' | 'text'
  /** 已 camelCase 化的元素属性；纯数值已转 number */
  props: Record<string, string | number>
  /** <g> 的子节点 */
  children?: IconNode[]
  /** <text> 的文本内容 */
  text?: string
}

/** 一个图标的完整定义 */
export interface IconDef {
  viewBox: string
  nodes: IconNode[]
}
