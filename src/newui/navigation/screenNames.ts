/**
 * 新 UI 路由名。命名沿用旧约定（lxm.XxxScreen），但独立成一份，不与旧 screenNames 共享，
 * 便于两套界面并存与回滚。
 */
export const NEW_UI_MAIN_SCREEN = 'lxm.NewUiMainScreen'
export const NEW_UI_PLAYER_SCREEN = 'lxm.NewUiPlayerScreen'
export const NEW_UI_SEARCH_SCREEN = 'lxm.NewUiSearchScreen'
export const NEW_UI_SONGLIST_DETAIL_SCREEN = 'lxm.NewUiSonglistDetailScreen'

// 「已缓存」（离线收听）屏：右推层，与歌单详情同一套转场（U86）
export const NEW_UI_OFFLINE_SCREEN = 'lxm.NewUiOfflineScreen'

// 电台（播客）四层：首页 → 详情 → 单集，搜节目从首页右上那颗进
export const NEW_UI_RADIO_HOME_SCREEN = 'lxm.NewUiRadioHomeScreen'
export const NEW_UI_PODCAST_DETAIL_SCREEN = 'lxm.NewUiPodcastDetailScreen'
export const NEW_UI_PODCAST_SEARCH_SCREEN = 'lxm.NewUiPodcastSearchScreen'
export const NEW_UI_EPISODE_SCREEN = 'lxm.NewUiEpisodeScreen'
