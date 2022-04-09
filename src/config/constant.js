
export const LIST_ID_PLAY_TEMP = null
export const LIST_ID_PLAY_LATER = '__LATER__'
export const LIST_ITEM_HEIGHT = 56
export const LIST_SCROLL_POSITION_KEY = '__LIST_SCROLL_POSITION_KEY__'

export const APP_PROVIDER_NAME = 'cn.toside.music.mobile.provider'

export const VERSION_STATUS = {
  checking: 'Checking',
  latest: 'Latest',
  downloading: 'Downloading',
  downloaded: 'Downloaded',
  unknown: 'Unknown',
  failed: 'Failed',
  available: 'Available',
}

export const NAV_VIEW_NAMES = {
  search: 0,
  songList: 1,
  top: 2,
  list: 3,
  setting: 4,
}

export const LXM_FILE_EXT_RXP = /\.(json|lxmc)$/

export const MUSIC_TOGGLE_MODE = {
  listLoop: 'listLoop', // 列表循环
  random: 'random', // 列表随机
  list: 'list', // 顺序播放
  singleLoop: 'singleLoop', // 单曲循环
  none: 'none', // 禁用
}

export const MUSIC_TOGGLE_MODE_LIST = [
  MUSIC_TOGGLE_MODE.listLoop,
  MUSIC_TOGGLE_MODE.random,
  MUSIC_TOGGLE_MODE.list,
  MUSIC_TOGGLE_MODE.singleLoop,
  MUSIC_TOGGLE_MODE.none,
]
