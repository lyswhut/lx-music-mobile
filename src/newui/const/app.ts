import { version } from '../../../package.json'

/** 应用名（顶栏品牌 / 头像缺省字） */
export const NEW_UI_APP_NAME = 'EchoIsle'

/** 真实应用版本：唯一来源 package.json 的 version，别再手写第二份数字 */
export const NEW_UI_APP_VERSION = version

/** 头像缺省首字（昵称缺省为 EchoIsle，取 'E'） */
export const NEW_UI_DEFAULT_AVATAR_TEXT = 'E'

/** 冷启动欢迎屏文案 */
export const NEW_UI_WELCOME_TEXT = '你好，我的朋友'

/** 顶栏搜索栏占位 */
export const NEW_UI_SEARCH_PLACEHOLDER = '搜索歌曲'

/** 清空播放记录后的 toast */
export const NEW_UI_RECENT_CLEARED_TOAST = '已清空这台设备上的播放记录'

/** 底部工具栏播放圆圈空态提示：没有在播曲目时点击只弹这条，不跳播放页 */
export const NEW_UI_PLAY_CIRCLE_NO_SONG_TOAST = '还没有播放的歌曲'

/** 列表终点行「没有更多了」 */
export const NEW_UI_PAGING_END_TEXT = '没有更多了'

/**
 * 网络封面图请求头：部分平台 CDN 校验 User-Agent，Dalvik 默认 UA 会被 403，需与旧 UI 同值。
 */
export const NEW_UI_IMG_HTTP_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36',
})
