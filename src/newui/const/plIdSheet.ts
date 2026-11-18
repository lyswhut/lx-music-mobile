/**
 * 「打开歌单」浮层（原型 #plIdSheet，index.html L411-427；文案表 PLID 与逻辑
 * plIdError / renderPlIdPlats / renderPlIdSamples / tryOpenByPid，app.js L1087-1162）的界面文案。
 * 每条标注原型行号；原型没有、真实侧语义必须补的条目单独注明。
 * 本层文案在 2026-07-30 审计轮按 `AUDIT_REPORT.md` D52–D57 逐字回到原句。
 */

export const NEW_UI_SHEET_PL_ID = {
  /** .sheet-title（index.html L415，原句照抄） */
  title: '打开歌单',
  /** .sheet-sub（index.html L416，原句照抄） */
  sub: '把平台上分享出来的歌单链接贴进来，或者只填那串歌单 ID。',
  /** .op-input placeholder（index.html L418） */
  placeholder: '歌单链接 / ID',
  /** .op-go（index.html L419） */
  go: '打开',

  /**
   * 裸 ID 先选平台组（组文案是 index.html L423 的静态 .group-label 原句；
   * PLID.groupPlatform（app.js L1088）虽定义却从未注入 DOM，屏上显的就是这一句，
   * 故实现与实际渲染一致（AUDIT_REPORT 四·1 记为不算偏离）。
   * 真实侧必须有 source 坐标才能 getListDetail(id, source, page)，且新 UI 没有
   * 全局「当前平台」状态可猜（搜索页自带来源 tab）——如实显式让用户选。
   */
  groupPlatform: '只填 ID 的话，先点这份歌单来自哪个平台',

  /** .group-label「可以试试这几个」（index.html L425，原句照抄） */
  groupSamples: '可以试试这几个',

  /** .sc-hint（index.html L427 原句逐字，QA D57——此前注释自称照抄、实为改写句） */
  hint: '歌单包含哪些平台的歌曲取决于歌单本身 · 能否播放在点播放时确认。',

  /**
   * 报错文案（.op-err，index.html L421 / plIdError，app.js L1102；四句原文见 PLID.err L1089-1094）。
   * 四条都是原型本有的分支（含「没选平台」「域名不认」「ID 形不对」），此前注作「真实侧新增分支」不确，
   * 本轮按 D52–D55 逐字回到原句。
   */
  err: {
    /** 原型 PLID.err.empty（app.js L1090）逐字，QA D52 */
    empty: '粘贴一条分享链接，或填写歌单 ID',
    /** 裸 ID 没选平台（禁止默认猜一个平台，任务口径；原型 L1091 逐字，QA D53） */
    needPlatform: '请先选择这份歌单来自哪个平台 · 仅凭一串 ID 判断不了来源',
    /** 输入里认不出五个平台域名的链接（域名映射表见 utils/plId.ts）。
     * 「域名认得出但链接里没有 ID」这一支不在这里报错：ID 抽取交对应 SDK，
     * 取不到由详情屏空态如实承担。（原型 L1092 逐字，QA D54） */
    unknownDomain: '这条链接不属于酷我 / 酷狗 / QQ音乐 / 网易云 / 咪咕 · 当前只识别这五家',
    /** 裸 ID 形态不对（含空格 / 太短 / 带符号；原型 L1093 逐字，QA D55） */
    badId: '这串 ID 格式不正确 · 应为数字或字母数字组合，中间不含空格',
  },

  /**
   * 打开成功 toast（原型 PLID.opened，app.js L1095 逐字，QA D56）。
   * 原型内部本有矛盾：notes 面板（index.html L624）引的是另一句旧口语「已去某平台打开这份歌单 ·
   * 里面的歌要现从平台取」，实现此前跟了引句；审计口径「以实际渲染句为准」（app.js L1160 调
   * PLID.opened(SOURCES[plat].short)），故回到 opened。真实侧此刻还没有取任何曲目，
   * 数量与可播数都不伪造——原型这句本就只说「稍后逐首取回」，两边一致。
   */
  opened: (short: string): string =>
    `已在${short}打开这份歌单 · 曲目稍后从平台逐首取回`,
} as const
