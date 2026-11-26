/**
 * 设定页全部文案；只出现人话，不露存储机制、模块名等技术词。
 * 今后加新组 / 新行先在这里补键，页面只做接线。
 */
export const NEW_UI_SETTING_LABELS = {
  pageTitle: '设定',
  heroSub: '这里的开关只作用于这台设备 · 不影响曲库内容，也不上传任何数据',

  /* ---- 外观 ---- */
  groupAppearance: '外观',
  appearanceLight: '明亮',
  appearanceLightHint: '浅底深字，亮处更清晰',
  appearanceDark: '黑暗',
  appearanceDarkHint: '深底亮字，暗处不刺眼',
  appearanceSystem: '跟随系统',
  appearanceSystemHint: '随手机的深浅色自动切换',
  appearanceActive: '在用',
  appearanceToast: (label: string): string => `外观 · ${label}`,

  /* ---- 数据与缓存 ---- */
  groupData: '数据与缓存',
  clearCache: '清除缓存',
  clearCacheHint: '清除收听过程中产生的缓存 · 收藏、歌单与播放记录不受影响',
  cacheCounting: '正在统计…',
  cacheFailed: '暂时无法统计',
  cacheClearing: '正在清除…',
  /** 「清除缓存」二次确认正文 */
  clearConfirm: '将清除这台设备上的播放缓存 · 之后收听会重新产生，不影响收藏、歌单与播放记录。',
  clearConfirmButton: '清除',
  clearDoneToast: '缓存已清除 · 收藏、歌单与播放记录保持不变',
  clearFailToast: '这阵子没清动，稍后再试试',
  /** 「清空播放记录」行：点击直接清空 + toast，无二次确认 */
  clearRecent: '清空播放记录',
  clearRecentHint: (count: number): string => `${count} 条在本机的收听历史`,
  clearRecentCount: (count: number): string => `${count} 条`,
  clearRecentEmpty: '已清空',

  /* ---- 关于 ---- */
  groupAbout: '关于',
  aboutOrigin: '内核由 lx-music-mobile 原作者与社区维护',
} as const
