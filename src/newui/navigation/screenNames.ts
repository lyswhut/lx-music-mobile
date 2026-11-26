/** 新 UI 路由名：独立一份，不与旧 screenNames 共享，便于两套界面并存与回滚。 */
export const NEW_UI_MAIN_SCREEN = 'lxm.NewUiMainScreen'
export const NEW_UI_PLAYER_SCREEN = 'lxm.NewUiPlayerScreen'
export const NEW_UI_SEARCH_SCREEN = 'lxm.NewUiSearchScreen'
export const NEW_UI_SONGLIST_DETAIL_SCREEN = 'lxm.NewUiSonglistDetailScreen'

// 「已缓存」（离线收听）屏：右推层，与歌单详情同一套转场
export const NEW_UI_OFFLINE_SCREEN = 'lxm.NewUiOfflineScreen'

/** 冷启动欢迎屏（overlay） */
export const NEW_UI_WELCOME_SCREEN = 'lxm.NewUiWelcomeScreen'
