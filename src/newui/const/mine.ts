/**
 * 「我的」页文案常量（对应原型 #page-mine 的屏内文字）。
 * 统计数、预览行等随数据变化的字符串在页面里拼接，这里只放固定文案。
 */
import { NEW_UI_RECENT_CLEARED_TOAST } from './app'

/** 各区块 / 卡片标题（.fav-card h3 / .section-sub） */
export const NEW_UI_MINE_TITLES = {
  love: '我喜欢',
  /** 合一卡的右半（原型 renderMinePage L1301，整半进 U86 那一屏） */
  offline: '已缓存',
  recent: '最近播放',
  lists: '我的歌单',
} as const

/** 区块右侧动作（.section-more） */
export const NEW_UI_MINE_MORES = {
  recent: '清空记录',
  // 2026-10-13（bug-fix「我的」7a）：入口由「去歌单页」换成「新建歌单」。
  // 视觉口径不变——原型这一角本就是 .section-more 文字 + chevron（index.html L244 #createListBtn），
  // 原型的建单只走内存数组（MY_PLAYLISTS），真实侧落 core/list；动作与文案按 bug-fix 换。
  lists: '新建歌单',
} as const

/**
 * 新建歌单浮层（CreateListSheet，2026-10-13 bug-fix「我的」7a）。
 * 原型对应层是 #createSheet（index.html L431-445；逻辑 app.js L1268-1300 的 CREATE_TXT /
 * submitCreateList，建单结果只写进内存里的 MY_PLAYLISTS）；校验规则逐条抄旧屏
 * ListNameEdit.handleRename（src/screens/Home/Views/Mylist/MyList/ListNameEdit.tsx L95-111）：
 * 空名不创建（旧屏静默 return，这里按新 UI 浮层惯例给一句 .op-err 人话报错，语义同）、
 * 超 100 字截断（L98）、同名先问「继续吗」（L102-105，zh-cn list_duplicate_tip 的说人话版）、
 * 都过才落 createUserList（经 core/list 的 createList）。
 */
export const NEW_UI_SHEET_CREATE_LIST = {
  /** .sheet-title（index.html L436） */
  title: '新建歌单',
  /** .sheet-sub（index.html L437 原句） */
  sub: '起个名字就能建，建好就出现在「我的歌单」这一排里。',
  /** .op-input placeholder（index.html L439；旧屏 list_create_input_placeholder「你想起啥名...」同款口吻） */
  placeholder: '你想起啥名...',
  /** .op-go（index.html L440） */
  go: '创建',
  /** 落库进行中的按钮态（原型 CREATE_TXT.busy app.js L1275，真实异步补，同 OpInputRow busy 口径） */
  busy: '创建中',
  /** 空名报错（.op-err，原型 app.js L1273 CREATE_TXT.errEmpty） */
  errEmpty: '请先填写歌单名称 · 单个汉字也可以',
  /** 同名确认浮层标题（原型 app.js L1297 askConfirm title「同名歌单」，QA D-09 载体换回 Sheet 家族） */
  dupTitle: '同名歌单',
  /** 同名确认浮层正文（原型 app.js L1274 dupConfirm） */
  dupConfirm: '已存在同名歌单 · 确认继续创建？',
  /** 同名确认浮层右键（原型 app.js L1297 okLabel「继续建」） */
  dupOk: '继续建',
  /** .sc-hint 底部灰字（原型 index.html L443 原句） */
  hint: '新歌单只存在这台设备上，进入后即可添加歌曲。',
  /** 建好 toast（原型 app.js L1276） */
  created: (name: string): string => `歌单「${name}」已创建`,
} as const

/** 歌单名长度上限：旧屏 ListNameEdit L98 对超 100 字的名字截断 */
export const NEW_UI_CREATE_LIST_NAME_MAX = 100

/** 统计三格标签（原型 renderMinePage 的 .stat span：喜欢 / 歌单 / 最近播放） */
export const NEW_UI_MINE_STAT_LABELS = {
  love: '喜欢',
  lists: '歌单',
  recent: '最近播放',
} as const

/**
 * 「修改」胶囊（.mh-edit，原型 index.html L230）。
 * 2026-10-24 原型把浮层扩成「昵称 + 头像」两件事，入口钮文案随之从「改昵称」改成「修改」，
 * 这里逐字跟上——钮上还叫「改昵称」就盖不住浮层里那一行头像。
 */
export const NEW_UI_MINE_EDIT = '修改'

/** 空态文案（原型 .empty-tip / .fav-card p 原句优先照抄） */
export const NEW_UI_MINE_EMPTY = {
  recent: '暂无播放记录',
  /**
   * 合一卡左半的空态（原型 renderMinePage L1278 逐字）：卡片只有半宽，副行只留名词与数字，
   * 长句（「…收进来的都会留在这里」）留在详情层的 NEW_UI_PLD_EMPTY.fav，这一格不重复摆。
   */
  love: '还没有收藏 · 点歌曲右侧的爱心',
} as const

/**
 * 头像副行（.mh-sub）。原型是 mock 的「听众 ID 8842 0613」，
 * 本项目没有用户 ID 概念（数据全在本机），换成一句如实说明。
 */
export const NEW_UI_MINE_HEAD_SUB = '没有账号 · 收听都记在这台设备上'

/** 页尾说明（原型 .foot-note 原句） */
export const NEW_UI_MINE_FOOT_NOTE = '收藏 · 播放记录 · 自建歌单都只存在这台设备上'

/** 还没接上的动作用一句话提示（说人话，别漏开发术语） */
export const NEW_UI_MINE_TOAST = {
  // 「修改」浮层（昵称 + 头像）已在阶段 9e 落地，2026-10-24 扩成两件事（NameSheet），原过渡 toast 删除
  // 卡片那颗直接开播的圆钮本轮随「两张卡合一」撤掉，原「收藏里的歌当前音源都放不出来」
  // 这条预览期提示（loveUnplayable）一并删除——开播回到详情层的「播放全部」，口径归它
  /** 原型 #recentClear 点击后的原句 */
  // 与首页「继续收听」清空共用全局共通键（原型两处入口共用一条实现，app.js L283-289）
  recentCleared: NEW_UI_RECENT_CLEARED_TOAST,
  // 纯自建歌单已换活（2026-10-12，详情层 kind='local' 形态，见 pushNewUiLocalListDetail），原「随后就来」占位文案删除
} as const

/**
 * 「我的歌单」两种单子的副行（件 parts/mine/my-pl-mine.html U46；
 * 原型 app.js plCardMine L1276 / plCardCollected L1292，两者都写进 .ps 行）。
 * 口径差别在明面上：自建能加能移，副行报「几首 / 几首可播」；
 * 收藏来的是平台只读的那份，副行只说清「收藏自哪家 · 几首」，不与自建的比可播数。
 */
export const NEW_UI_MINE_PL_SUB = {
  /** 首数还没数出来时的如实一句（原内联在 MinePage，本轮收敛进常量） */
  tallying: '还在数有几首',
  /** 自建：原型 `${p.tracks.length} 首 · ${can} 首可播`；可播数没回时只报首数 */
  mine: (count: number, playable: number | null): string =>
    playable == null ? `${count} 首` : `${count} 首 · ${playable} 首可播`,
  /** 收藏来的平台歌单：原型逐句 `收藏自 ${SOURCES[p.home].short} · ${p.tracks.length} 首` */
  collected: (platformShort: string, count: number): string =>
    `收藏自 ${platformShort} · ${count} 首`,
} as const
