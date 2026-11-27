/**
 * 单曲操作面板的界面文案。
 */

export const NEW_UI_SHEET_MORE = {
  fav: '收藏到「我喜欢」',
  unfav: '取消收藏',
  playLater: '下一曲播放',
  addToList: (name: string): string => `加入「${name}」`,
  /** 加入候选的分组标题：名单只含自建歌单（平台收藏只读） */
  addGroup: '加入自建歌单',
  addEmpty: '还没有自建歌单 · 先去「我的」新建一份',
  removeFromList: (name: string): string => `从「${name}」移出`,
  /* ---- toast ---- */
  favAdded: '已收藏到「我喜欢」',
  favRemoved: '已取消收藏',
  playLaterAdded: (title: string): string => `已把「${title}」排在当前这首之后`,
  alreadyInList: '已经在这份歌单里了',
  listAdded: (name: string): string => `已加入「${name}」`,
  /** 写库失败（真实 addListMusics 会 reject） */
  listAddFailed: '没加进去，稍后再试一次',
  /** 移出成功：移掉的只是这张单子的歌目记录，歌本身与平台收藏不动 */
  listRemoved: (list: string, title: string): string => `已把「${title}」从「${list}」移出 · 歌还在这台设备的曲库里`,
  /** 写库失败（真实 removeListMusics 会 reject） */
  listRemoveFailed: '没移掉，稍后再试一次',
} as const
