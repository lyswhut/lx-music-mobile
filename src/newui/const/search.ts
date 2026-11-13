/**
 * 搜索层（原型 #searchLayer，app.js L1348-1486）的界面文案常量。
 * 结果数据全部来自既有 core/search 与 core/hotSearch，这里只有文案与显示上限。
 */

/** .sc-input 占位（原型 index.html L351） */
export const NEW_UI_SEARCH_INPUT_PLACEHOLDER = '搜歌名、歌手、歌单'

/** .sc-cancel */
export const NEW_UI_SEARCH_CANCEL = '取消'

/** .sc-tabs 两类结果标签（标签名） */
export const NEW_UI_SEARCH_TAB_LABELS = {
  song: '单曲',
  pl: '歌单',
} as const

/** 空输入态的两组词标签与清空按钮（.sc-label / .sc-clear） */
export const NEW_UI_SEARCH_LABELS = {
  history: '搜索历史',
  hot: '大家都在搜',
  clear: '清空',
} as const

/** 热搜词条显示上限（真实列表是各平台合并，屏上取前 10 个足够） */
export const NEW_UI_SEARCH_HOT_LIMIT = 10

/**
 * 搜过的词留存条数（原型 `searchHistory` 定长 8：
 * 读时 `slice(0, 8)`（app.js L3548）、记词时 `length = Math.min(length, 8)`（L3568））。
 */
export const NEW_UI_SEARCH_HISTORY_LIMIT = 8

/**
 * 一条历史都没有时那一行 `.empty-tip`（原型 renderSearchIdle 的 else 支，
 * app.js L3599 逐字：「不塌成空白，也不摆『暂无数据』那种话」）。
 */
export const NEW_UI_SEARCH_HISTORY_EMPTY = '还没有搜过的词 · 输入歌名或歌手就能搜'

/**
 * 「清空」文字链的无障碍文案（原型该钮是 close 图标 + 纯文字，没有 aria-label，这句 RN 侧自补）。
 * 同屏输入框内还有一颗清除钮（`clearLabel="清空输入"`），两颗都叫「清空」读屏分不开，这句带上范围。
 */
export const NEW_UI_SEARCH_CLEAR_HISTORY_LABEL = '清空搜索历史'

/** 热搜拉取失败 / 为空时的说明（原型 mock 恒有词，真实数据需要一个如实的空态） */
export const NEW_UI_SEARCH_HOT_EMPTY = '热搜暂时载入失败 · 直接输入关键词搜索'

/** .sc-hint：空输入态尾注 */
export const NEW_UI_SEARCH_IDLE_HINT =
  '搜索各平台曲库的歌曲与歌单 · 能否播放在点播放时确认'

/** 结果尾注（原型按 tab 各一条） */
export const newUiSearchSongHint = (total: number, playable: number): string =>
  `${total} 首单曲 · 其中 ${playable} 首现在这个音源能播`
export const newUiSearchPlHint = (total: number): string =>
  `${total} 份歌单 · 点进去看每首先能不能播`

/** 空结果（.sc-empty 两行） */
export const newUiSearchEmptyTitle = (query: string): string =>
  `没找到和「${query}」对得上的歌或歌单`
export const NEW_UI_SEARCH_EMPTY_SUB = '换个词试试，比如歌手名、歌名里的两个字'

/**
 * 词里带「音源 / 平台」时，原型在两类皆空的空态里追加一枚指回设定页的胶囊
 * （app.js scEmpty L2329-2333，index.html notes L608「把搜不到的东西指回它该在的地方」）。
 * 措辞与榜单/音源一族同口径「到设定页…」（原型按钮原句「到设定页查看音源」）。
 */
export const NEW_UI_SEARCH_SOURCE_HINT_PATTERN = /音源|平台/
export const NEW_UI_SEARCH_GOTO_SETTING = '到设定页查看音源'

/** 单类空、另一类有结果的空态（原型 app.js L1451-1461） */
export const newUiSearchOneSideEmptyTitle = (query: string): string =>
  `这一类里没有「${query}」的结果`
export const newUiSearchOneSideSub = (count: number, toPlaylist: boolean): string =>
  `${toPlaylist ? '歌单' : '单曲'}那边有 ${count} 条`

/** 单类为空、另一类有结果的「跳过去」胶囊 */
export const newUiSearchJumpLabel = (count: number, toPlaylist: boolean): string =>
  `看 ${count} ${toPlaylist ? '份歌单' : '首单曲'}`

/** 搜索中（原型无此态：真实数据是异步的，需要如实的 loading） */
export const NEW_UI_SEARCH_LOADING = '正在搜索…'

/** 点不可播曲目的提示（与首页口径一致：原型 app.js L458 同一句，两处共用本键） */
export const NEW_UI_SEARCH_UNPLAYABLE_TOAST = '这首歌的来源平台未接入当前音源 · 换个音源试试'

/** 歌单结果坐标不全（平台缺失 / 没有有效编号）时的提示：不进详情页，避免点开就炸（2026-10-12 清单第 6 条） */
export const NEW_UI_SEARCH_PL_INVALID_TOAST = '这份歌单没带对得上的地址，先打不开 · 换一份试试'
