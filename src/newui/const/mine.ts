/**
 * 「我的」页固定文案常量；统计数与预览行随数据变化，在页面里拼接。
 */
import { NEW_UI_RECENT_CLEARED_TOAST } from './app'

/** 各区块 / 卡片标题 */
export const NEW_UI_MINE_TITLES = {
  love: '我喜欢',
  offline: '已缓存',
  recent: '最近播放',
  lists: '我的歌单',
} as const

/** 区块右侧动作 */
export const NEW_UI_MINE_MORES = {
  recent: '清空记录',
  lists: '新建歌单',
} as const

/**
 * 新建歌单浮层（CreateListSheet）文案。校验：空名报错、超 100 字截断、同名先确认，都过才落库。
 */
export const NEW_UI_SHEET_CREATE_LIST = {
  title: '新建歌单',
  sub: '起个名字就能建，建好就出现在「我的歌单」这一排里。',
  placeholder: '你想起啥名...',
  go: '创建',
  /** 落库进行中的按钮态 */
  busy: '创建中',
  errEmpty: '请先填写歌单名称 · 单个汉字也可以',
  dupTitle: '同名歌单',
  dupConfirm: '已存在同名歌单 · 确认继续创建？',
  dupOk: '继续建',
  hint: '新歌单只存在这台设备上，进入后即可添加歌曲。',
  created: (name: string): string => `歌单「${name}」已创建`,
} as const

/** 歌单名长度上限：超 100 字截断 */
export const NEW_UI_CREATE_LIST_NAME_MAX = 100

/** 统计三格标签 */
export const NEW_UI_MINE_STAT_LABELS = {
  love: '喜欢',
  lists: '歌单',
  recent: '最近播放',
} as const

/** 「修改」胶囊（昵称 + 头像） */
export const NEW_UI_MINE_EDIT = '修改'

/** 空态文案 */
export const NEW_UI_MINE_EMPTY = {
  recent: '暂无播放记录',
  /** 合一卡左半的空态：副行只留名词与数字，长句留在详情层 */
  love: '还没有收藏 · 点歌曲右侧的爱心',
} as const

/** 头像副行：本项目没有账号概念，数据全在本机 */
export const NEW_UI_MINE_HEAD_SUB = '没有账号 · 收听都记在这台设备上'

/** 动作反馈提示 */
export const NEW_UI_MINE_TOAST = {
  /** 与首页「继续收听」清空共用同一键 */
  recentCleared: NEW_UI_RECENT_CLEARED_TOAST,
} as const

/**
 * 「我的歌单」两种单子的副行：自建报「几首 / 几首可播」，收藏来自平台只读、只报「收藏自哪家 · 几首」。
 */
export const NEW_UI_MINE_PL_SUB = {
  tallying: '还在数有几首',
  mine: (count: number, playable: number | null): string =>
    playable == null ? `${count} 首` : `${count} 首 · ${playable} 首可播`,
  collected: (platformShort: string, count: number): string =>
    `收藏自 ${platformShort} · ${count} 首`,
} as const
