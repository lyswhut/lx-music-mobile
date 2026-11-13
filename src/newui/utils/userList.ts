import { LIST_IDS } from '@/config/constant'

/**
 * 系统列表 id（试听 / 我喜欢·收藏 / 临时 / 下载）——这些不是用户建出来的，
 * 「删除本歌单」这类破坏性动作对它们没有意义，也删不掉（旧屏同一口径，见下）。
 */
const SYSTEM_LIST_IDS: readonly string[] = [
  LIST_IDS.DEFAULT,
  LIST_IDS.LOVE,
  LIST_IDS.TEMP,
  LIST_IDS.DOWNLOAD,
]

/**
 * 这份本地歌单能不能被用户删掉（2026-10-13 本地歌单删除入口）。
 *
 * 口径逐字照抄旧「我的歌单」菜单 `screens/Home/Views/Mylist/MyList/ListMenu.tsx` L77-87：
 * switch 只对 `LIST_IDS.DEFAULT` / `LIST_IDS.LOVE` 两个 case 直接 break（rename/remove 保持 false），
 * default 分支才把 remove 置 true——即**只有 userList 里的歌单可删**。
 * 另收 TEMP / DOWNLOAD 两 id：它们本就不在 `store/list` 的 allList 里
 * （`store/list/action.ts` L7 allList = defaultList + loveList + userList），
 * 这里列全是防御——万一将来有别的入口拿这些 id 开详情层，也不给一个点了报错的死按钮。
 */
export const isDeletableUserListId = (listId: string): boolean =>
  listId !== '' && !SYSTEM_LIST_IDS.includes(listId)

/**
 * 播放列表那一列是「本机的一张单子」还是「这一次播放临时凑出来的一池」（2026-10-16 件 U80）。
 *
 * 判据逐字照抄原型 `plPlayableQueue()`（app.js L1027）挂在数组上的 queueOwner 标记：
 * **只有本机的一张单子标得出名字** —— 内置「我喜欢」与用户自建歌单；
 * 榜单、平台歌单、搜索结果起播时在线内容已被复制成暂存池，标不出来就是 null。
 * 暂存池即 `LIST_IDS.DEFAULT`（试听）/ `LIST_IDS.TEMP`（新 UI 的播放暂存池）/ `LIST_IDS.DOWNLOAD`，
 * 动它们只影响这一次播放，不动用户的单子与收藏。
 *
 * 与 `isDeletableUserListId` 的差别只在「我喜欢」：那张单子删不掉（所以上一条返回 false），
 * 但它确实是本机的一张单子（歌目可以逐条移出去），所以本条把它算进来。
 * 播放列表面板行内「⋯」的那条「移出」靠这个标记决定写哪一种文案。
 */
export const isOwnedMusicListId = (listId: string | null): boolean =>
  listId === LIST_IDS.LOVE || isDeletableUserListId(listId ?? '')
