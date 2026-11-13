/**
 * 「打开歌单」浮层的链接 → 平台判定（纯逻辑，无界面）。
 *
 * 各平台 listId 形态**逐个在 utils/musicSdk/<source>/songList.js 核实**（行号为该文件锚点），
 * 结论：五个平台的 SDK `getListDetail(id, page)` 都自带链接解析（认出 http / ?&: 后按各自
 * 正则从链接里抽真正的 ID），所以这里**不重复实现逐平台 ID 抽取正则**——判定出平台后，
 * 把用户输入（整条链接或裸 ID）原样交给对应 SDK 解析即可，避免造一份比 SDK 更脆的副本。
 * 原型的 `\d{5,}` 全局正则会误伤非纯数字 ID（尤其酷狗 global_collection_id / chain 是字母数字，
 * 见 kg/songList.js L672-673、L703-705），故不采用。
 *
 * 域名 → source 映射依据（musicSdk 各文件头注释里的真实分享链接样例）：
 * - kw  kuwo.cn          kw/songList.js L27-28（www.kuwo.cn/playlist_detail/… · m.kuwo.cn/h5app/playlist/…）
 *                       L379-380（h5app.kuwo.cn/m/bodian/collection.html?…playlistId=…）
 * - kg  kugou.com        kg/songList.js L57（www.kugou.com/yy/special/single/…）
 *                       L741-745（http 链接直接进 getUserListDetail；裸数字走 specialId）
 * - tx  y.qq.com         tx/songList.js L33-34（y.qq.com/n/yqq/playlist/… · i.y.qq.com/…taoge.html?id=…）
 *                       L398（y.qq.com/n/ryqq/playlist/…）
 * - wy  music.163.com    wy/songList.js L316（music.163.com/#/playlist?id=…）
 * - mg  migu.cn          mg/songList.js L35（music.migu.cn/v3/music/playlist/…）
 *                       L74/L137-139（h5.nf.migu.cn/…index.html?id=… · music.migu.cn/v5/#/playlist?playlistId=…）
 */

/** 已知平台分享域名 → source（顺序无关，命中即返回） */
const DOMAIN_SOURCE_MAP: ReadonlyArray<readonly [RegExp, LX.OnlineSource]> = [
  [/kuwo\.cn/i, 'kw'],
  [/kugou\.com/i, 'kg'],
  [/y\.qq\.com/i, 'tx'],
  [/(?:music\.163\.com|(?:163|netease)\.com)/i, 'wy'],
  [/migu\.cn/i, 'mg'],
]

/**
 * 从整段输入里判定平台：命中任一平台域名即返回该 source，否则 null（视为裸 ID / 未知链接）。
 * 链接里的具体 ID 交给对应 SDK 的 getListDetail 解析，这里只负责「是哪个平台」。
 */
export const resolvePlIdSource = (raw: string): LX.OnlineSource | null => {
  for (const [pattern, source] of DOMAIN_SOURCE_MAP) {
    if (pattern.test(raw)) return source
  }
  return null
}

/**
 * 输入是否「看着像一条链接」（含协议 / 域名斜杠结构）。
 * 用于把「认不出平台的链接」和「裸 ID 没选平台」两种报错分开，不骗人。
 */
export const looksLikeLink = (raw: string): boolean =>
  /(?:\w+:\/\/|www\.|\.com|\.cn|\.net|\.org)/i.test(raw)
