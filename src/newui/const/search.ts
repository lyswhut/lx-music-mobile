/**
 * 搜索层的界面文案常量；结果数据来自既有 core/search 与 core/hotSearch。
 */

/** 输入框占位 */
export const NEW_UI_SEARCH_INPUT_PLACEHOLDER = '搜歌名、歌手、歌单'

export const NEW_UI_SEARCH_CANCEL = '取消'

/** 两类结果标签 */
export const NEW_UI_SEARCH_TAB_LABELS = {
  song: '单曲',
  pl: '歌单',
} as const

/** 空输入态的两组词标签与清空按钮 */
export const NEW_UI_SEARCH_LABELS = {
  history: '搜索历史',
  hot: '大家都在搜',
  clear: '清空',
} as const

/** 热搜词条显示上限（各平台合并后屏上取前 10 个） */
export const NEW_UI_SEARCH_HOT_LIMIT = 10

/** 搜过的词留存条数（定长 8） */
export const NEW_UI_SEARCH_HISTORY_LIMIT = 8

/** 一条历史都没有时的空态行 */
export const NEW_UI_SEARCH_HISTORY_EMPTY = '还没有搜过的词 · 输入歌名或歌手就能搜'

/** 「清空」文字链的无障碍文案：与输入框内的清除钮区分开 */
export const NEW_UI_SEARCH_CLEAR_HISTORY_LABEL = '清空搜索历史'

/** 热搜拉取失败 / 为空时的说明 */
export const NEW_UI_SEARCH_HOT_EMPTY = '热搜暂时载入失败 · 直接输入关键词搜索'

/** 空输入态尾注 */
export const NEW_UI_SEARCH_IDLE_HINT =
  '搜索各平台曲库的歌曲与歌单 · 能否播放在点播放时确认'

/** 结果尾注（按 tab 各一条） */
export const newUiSearchSongHint = (total: number, playable: number): string =>
  `${total} 首单曲 · 其中 ${playable} 首现在这个音源能播`
export const newUiSearchPlHint = (total: number): string =>
  `${total} 份歌单 · 点进去看每首先能不能播`

/** 空结果（两行） */
export const newUiSearchEmptyTitle = (query: string): string =>
  `没找到和「${query}」对得上的歌或歌单`
export const NEW_UI_SEARCH_EMPTY_SUB = '换个词试试，比如歌手名、歌名里的两个字'

/** 词里带「音源 / 平台」时，空态追加一枚指回设定页的胶囊 */
export const NEW_UI_SEARCH_SOURCE_HINT_PATTERN = /音源|平台/
export const NEW_UI_SEARCH_GOTO_SETTING = '到设定页查看音源'

/** 单类空、另一类有结果的空态 */
export const newUiSearchOneSideEmptyTitle = (query: string): string =>
  `这一类里没有「${query}」的结果`
export const newUiSearchOneSideSub = (count: number, toPlaylist: boolean): string =>
  `${toPlaylist ? '歌单' : '单曲'}那边有 ${count} 条`

/** 「跳过去」胶囊 */
export const newUiSearchJumpLabel = (count: number, toPlaylist: boolean): string =>
  `看 ${count} ${toPlaylist ? '份歌单' : '首单曲'}`

/** 搜索中 */
export const NEW_UI_SEARCH_LOADING = '正在搜索…'

/** 点不可播曲目的提示 */
export const NEW_UI_SEARCH_UNPLAYABLE_TOAST = '这首歌的来源平台未接入当前音源 · 换个音源试试'

/** 歌单结果坐标不全时的提示：不进详情页，避免点开就炸 */
export const NEW_UI_SEARCH_PL_INVALID_TOAST = '这份歌单没带对得上的地址，先打不开 · 换一份试试'
