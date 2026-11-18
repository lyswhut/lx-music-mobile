/**
 * 搜节目层（原型 `#podcastSearchLayer`，U83）的界面文案常量。
 *
 * 句子全部逐字取自拆件与 app.js 原文：
 * - 壳与占位：`new_design/parts/radio/search.html`（index.html L403-L413）＋
 *   `new_design/parts/search/sc-top.html` 的第二处根（`#podSearchInput` / `#podSearchClear` / `#podSearchCancel`）
 * - 屏内各态：`new_design/app.js` `renderPodSearch`（L2100-L2135）/ `submitPodSearch`（L2137-L2152）
 *
 * **热搜不做**（件头：播客没有「热搜」这件事，三条接口都不给）；
 * 原先那句能力说明（「按节目名或作者搜 · 点进去看最近几集，听到的位置记在这台设备上」）
 * 本轮原型整条撤掉，这里也不再放——无输入时只给本机搜过的词。
 *
 * 用词按 Apple 官方简体中文（契约 `src/newui/PROTOTYPE_INVENTORY.md` 7.6）：
 * 一个 show = 「节目」，一期内容 = 「单集」，量词是「N 个节目」（「档」已换掉）；
 * 「播客」只作频道名，屏上只留名词与数字。
 */

/** .sc-input 占位（件内逐字：`placeholder="搜节目名或作者"`） */
export const NEW_UI_POD_SEARCH_PLACEHOLDER = '搜节目名或作者'

/** .sc-cancel（件内逐字：`<button class="sc-cancel">取消</button>`） */
export const NEW_UI_POD_SEARCH_CANCEL = '取消'

/** .sc-x 的无障碍文案（件内逐字：`aria-label="清空"`） */
export const NEW_UI_POD_SEARCH_CLEAR_INPUT_LABEL = '清空'

/** .sc-label 的标题（app.js L2106 `head.innerHTML = '<b>搜过的词</b>'`） */
export const NEW_UI_POD_SEARCH_HISTORY_LABEL = '搜过的词'

/** .sc-clear 的文字（app.js L2107：close 图标 +「清空」） */
export const NEW_UI_POD_SEARCH_CLEAR_LABEL = '清空'

/**
 * 「清空」文字链的无障碍文案（原型该钮是纯文字按钮，没有 aria-label，这句是 RN 侧自补的）。
 * 同屏还有一颗输入框内的清除钮（`aria-label="清空"`，见 NEW_UI_POD_SEARCH_CLEAR_INPUT_LABEL），
 * 两颗都叫「清空」读屏分不开，这一句带上范围。
 */
export const NEW_UI_POD_SEARCH_CLEAR_HISTORY_LABEL = '清空搜过的词'

/** .empty-tip（app.js L2122 `el('div', 'empty-tip', '正在搜索…')`） */
export const NEW_UI_POD_SEARCH_LOADING = '正在搜索…'

/** .sc-empty 第一行（app.js L2125，逐字：b = 没找到和「X」对得上的节目） */
export const newUiPodSearchEmptyTitle = (query: string): string =>
  `没找到和「${query}」对得上的节目`

/** .sc-empty 第二行（app.js L2125 同行后半句，逐字） */
export const NEW_UI_POD_SEARCH_EMPTY_SUB = '换个词试试，或者只打节目名里的两个字'

/** .sc-hint：命中后底部只留这一个数（app.js L2134 `` `${hits.length} 个节目` ``） */
export const newUiPodSearchHint = (count: number): string => `${count} 个节目`

/**
 * 取数失败的状态行（原型是本地 mock 瞬间出结果，没有这一态；真实接口必须给如实的重试入口）。
 * 措辞沿用项目状态行一族（`.pl-status`）：「这一批没有载入 · 点击重试」（const/rank.ts:43）、
 * 「这一区没有取到名单 · 点击重试」，这里把范围换成搜索的这个词。
 * 注意与空结果分家：**接口失败走这一行**，接口给回零条才走 .sc-empty。
 */
export const NEW_UI_POD_SEARCH_RETRY = '这一词没有载入 · 点击重试'
