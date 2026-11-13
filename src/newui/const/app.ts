import { version } from '../../../package.json'

/** 应用名（原型 .nav-brand b / 顶栏头像缺省字），非 mock 数据，属界面文案常量。品牌名 2026-10 定为「EchoIsle」（副名 SoundIsle，仅设定页关于组露出一次） */
export const NEW_UI_APP_NAME = 'EchoIsle'

/**
 * 真实应用版本：唯一来源 package.json 的 version —— android 的 versionName 也从这里读
 * （android/app/build.gradle L102 `verName = npmPackageJson["version"]`），别再手写第二份数字。
 */
export const NEW_UI_APP_VERSION = version

/** 头像缺省首字（原型 #topAvatar 取昵称首字；昵称缺省已是 EchoIsle，这里只兜空昵称的异常路径。EchoIsle 为拉丁品牌，取 'E'） */
export const NEW_UI_DEFAULT_AVATAR_TEXT = 'E'

/** 顶栏搜索栏占位（原型 .searchbar .ph） */
export const NEW_UI_SEARCH_PLACEHOLDER = '搜索歌曲 · 支持五平台'

/** 清空播放记录后的 toast（QA 2026-10-14 D-11：点了必须给可感知反馈）。
 * 原型 app.js L283-289 首页与「我的」两处入口共用一条实现，文案取原型原句 */
export const NEW_UI_RECENT_CLEARED_TOAST = '已清空这台设备上的播放记录'

/** 列表终点行「没有更多了」（原型 PLD_STATUS.end，app.js L842 + plEndRow L845）：
 * 排行榜网格（L565）、歌单池（L766）、详情层曲目（L999）三处共用同一句同一形态，一处定义 */
export const NEW_UI_PAGING_END_TEXT = '没有更多了'

/**
 * 网络封面图请求头（2026-10-15 歌单封面走查）：与旧 UI `src/components/common/Image.tsx`
 * 的 `defaultHeaders` 同值——部分平台封面 CDN 校验 User-Agent 防热链，Dalvik 默认 UA 直连
 * 会被 403，图片静默失败后卡上只剩程序化种子底（看起来像「假封面」）。newui 不引用旧 UI
 * 组件（隔离旧主题），故在此独立定义同值常量，由 `Art` 统一注入所有网络封面加载。
 */
export const NEW_UI_IMG_HTTP_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
})

/**
 * QQ（tx）官方「歌手头像」图 URL 模板（2026-10-15 歌手头像方案 B）：`T001` 是歌手图前缀
 * （专辑图是 `T002`），SDK 自己就有先例（`utils/musicSdk/tx/musicSearch.js` / `leaderboard.js` /
 * `songList.js` 在专辑名为空时兜底拼的正是这条），这里只是把同一口径收敛成共通常量。
 * mid 不存在时该 CDN 直接回 404（已实测），所以「拼得出 URL」不等于「有真人照片」，
 * 是否存在由 `utils/singerPic.ts` 探一次 HEAD 决定，探不到就回落示意插画。
 */
export const NEW_UI_TX_SINGER_PIC_URL = (mid: string): string =>
  `https://y.gtimg.cn/music/photo_new/T001R500x500M000${mid}.jpg`

/** 歌手头像存在性探测（HEAD，只取状态位不下图）的超时护栏：超时按「探不到」处理，不卡首页 */
export const NEW_UI_SINGER_PIC_PROBE_TIMEOUT = 6000
