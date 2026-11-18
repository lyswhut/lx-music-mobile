/**
 * 歌单详情层文案常量（对应原型 #plLayer 与 app.js openPlaylist L408-483）。
 * kind 五种形态（pl / rank / mine / local / fav）只管取数链路与按钮能力。
 * **标题 / 页脚 / 空态自 2026-10-24 起按「归属 owner」取**（原型 PLD_OWNER / playlistOwnerOf /
 * plCrumbOf，app.js L805-841）：同一张单子从哪进来都叫同一个名字，收藏来的不会被叫成「自建歌单」。
 * 归属表见文件末尾那段；按 kind 取的白名单原样保留（旧调用点若还传 kind 也有话可读）。
 */
import { getPlatformMeta } from './sources'

/**
 * 详情层形态：歌单 / 排行榜 / 自建歌单（原型 openPlaylist(p, kind)）/ 本地歌单（2026-10-12 修复：
 * 纯自建、试听、收藏这类没有平台坐标的歌单，用同一详情页按本地 listId 取歌，不另做页面）/
 * 内置「我喜欢」（QA D04 补：原型 PLD_* 四张表都带 fav 一项，此前整种形态缺失）。
 */
export type NewUiSonglistDetailKind = 'pl' | 'rank' | 'mine' | 'local' | 'fav'

/** .pl-top 中部面包屑（原型 PLD_CRUMB 逐字；fav 一档 2026-10-27 随「我喜欢」合一卡改称「我喜欢」，
 *  与我的页那颗卡片的标题同名，用户从卡片进来能看到同一个词） */
export const NEW_UI_PLD_CRUMB: Record<NewUiSonglistDetailKind, string> = {
  rank: '排行榜',
  mine: '自建歌单',
  pl: '歌单',
  local: '我的歌单',
  fav: '我喜欢',
}

/** .foot-note 页脚说明（原型 PLD_FOOT 逐字，含 fav 项） */
export const NEW_UI_PLD_FOOT_NOTE: Record<NewUiSonglistDetailKind, string> = {
  rank: '整份榜单按该平台的排名排列 · 每首可直接播',
  mine: '这份歌单只存在这台设备上',
  pl: '整份歌单先列出曲目 · 能否播放以点开那一刻为准',
  local: '这份歌单只存在这台设备上 · 队列即歌单本身，点开即听 · 想撤哪首就在它的「⋯」里移出',
  fav: '这份收藏只存在这台设备上 · 取消收藏在歌曲行的「⋯」里',
}

/** 固定按钮 / 无障碍文案 */
export const NEW_UI_PLD_LABELS = {
  playAll: '播放全部',
  shuffle: '随机播放',
  /** 心钮四态文案（2026-10-12 走查真 toggle）：歌单与榜单语义不同——榜单收的是整榜曲目；
   * 措辞按原型 PLD_LABELS 逐字（QA D38/D39：「将…」不是「把…」） */
  fav: '将这份歌单存进我的歌单',
  unfav: '已存进我的歌单 · 再点移出',
  favBoard: '将整张榜的歌曲存进我的歌单',
  unfavBoard: '整张榜已存好 · 再点移出',
  back: '返回',
  /**
   * 本地歌单形态右上角那颗（2026-10-13 清单「我的」第 2 条）：这一位原来是心钮，
   * 但「存进我的歌单」对本地歌单没有意义（它本来就在我的歌单里），换成「删除本歌单」。
   * 图标是 trash + err 色（与收藏一眼分开），按下必过二次确认，不可删的系统列表不出现这颗钮。
   */
  deleteList: '删除本歌单',
} as const

/**
 * 删除本地歌单的二次确认文案（2026-10-13；2026-10-14 QA D-09 起确认载体换成新 UI 共通件
 * ConfirmSheet——原型 #confirmSheet 的等价落地，不再是系统 Alert）。
 * 旧屏同一动作走 `screens/Home/Views/Mylist/MyList/listAction.ts` L12-20 的 confirmDialog
 * （zh-cn `list_remove_tip`「你真的想要移除「{name}」吗？」+ `list_remove_tip_button`「是的，没错」），
 * 确认语义照旧、文案是新 UI 的说人话版，并**如实说清连带删掉歌目记录**
 * （`core/list.removeUserList` → `event/listEvent.ts` L117-125 会 removeListMusics 清掉这份歌单的曲目数据；
 * 曲库与文件本身不受影响，掉的只是这张单子列出来的那几首记录）。
 */
export const NEW_UI_PLD_DELETE_CONFIRM = {
  /** .sheet-title（原型 askDeleteList title「要删掉「x」吗」，app.js L1011-1012；QA D-09 换回确认浮层后标题/正文拆开） */
  title: (name: string): string => `要删掉「${name}」吗`,
  /** .sheet-sub 正文（原型 app.js L1055-1056 askDeleteList body 逐字，QA D45） */
  body: '删除后，这份歌单与它列出的歌目记录会一并从这台设备移除 · 歌曲文件本身不受影响，其它端的收藏也不受影响。',
  /** 右键（原型 okLabel「删除歌单」） */
  confirmText: '删除歌单',
} as const

/**
 * 榜单「存整榜」落库时 sourceListId 的坐标前缀（照抄旧 `screens/Home/Views/Leaderboard/listAction`
 * 的 getListId：`board__` + 榜单 id）。存进来的那份要再进详情层，必须剥掉这个前缀并按
 * rank 形态打开（榜单取数走 core/leaderboard，不是 songlist），否则按歌单坐标取不到歌。
 */
export const NEW_UI_BOARD_LIST_ID_PREFIX = 'board__'

/** 平台取歌超时上限（QA 2026-10-14 详情页 D-08）：音源脚本/网络异常时 Promise
 * 可能永不 settle，页面永远卡「加载中」；到限推到 error 分支给重试入口。
 * 取 30s：分页明细单批约 30 首、逐首地址经脚本 HTTP，耗时参差；
 * 比正常慢源多留裕量，也把「白等」封在用户还能接受的分钟内 */
export const NEW_UI_PLD_LOAD_TIMEOUT_MS = 30_000

/** 可播统计胶囊（原型 `${playable}/${tracks} 首可播`） */
export const newUiPlayableTag = (playable: number, total: number): string =>
  `${playable}/${total} 首可播`

/** 首批曲目还没在手时的 hero 胶囊文案（QA 2026-10-14 详情页 D-05）。
 * 歌还没取回来就报「0/232 首可播」「0 首」是虚报计数——
 * 原型 app.js L901-905 同款取向：一首都没定位到时不报计数，只回显来自哪个平台；
 * local 形态没有平台标签可显，用这句如实兑底 */
export const NEW_UI_PLD_TAG_PENDING = '正在数有几首 · 稍等'

/**
 * 内置「我喜欢」空收藏时的 hero 胶囊（原型 app.js L944-946 / L1650 逐字，QA D04）：
 * 一首都没收进来时报「0/0 首可播」是废话，原型直接说明现在是空的。
 */
export const NEW_UI_PLD_TAG_EMPTY_FAV = '还没有收藏'

/**
 * 空态文案（status=end 但没取到歌 / 首页就失败）。
 * 「歌单是空的」有三种对象，措辞必须分开（2026-10-14 第 10b 轮，bug-fix.md L58 走查遗留；
 * fav 一档为 QA D04 补，原型 PLD_EMPTY 表里本就单列一项）：
 * - localEmpty：kind='local' 的本地歌单（用户刚建的空单子）——问题不是「换一份」，是还没往里放歌，
 *   要说清对象并给出加歌的路（⋯ 面板「加入自建歌单」是真实入口，非假动作）。
 *   2026-10-27 件 U76 连带：自建歌单已能逐首移出，被移空也仍走这句，原型 PLD_EMPTY.local（app.js L839）逐字；
 * - fav：kind='fav' 的内置「我喜欢」——空的是收藏本身，要说清去哪收（原型 PLD_EMPTY.fav）；
 * - end：平台歌单（pl/mine/rank 形态）明细取回来是空的——那是平台侧给的就空，如实请用户换一份。
 * localError = 本地整单没读出来（读取失败，不是空），与上面三种再分开。
 */
export const NEW_UI_PLD_EMPTY = {
  error: '这份歌单暂时取不到内容 · 网络或音源不稳定，稍后再试',
  localError: '这份歌单暂时打不开 · 稍后再试',
  localEmpty: '这份歌单还是空的 · 在歌曲右侧的「⋯」里加入',
  end: '这份歌单还是空的 · 换一份听听',
  /** 内置「我喜欢」空态（原型 PLD_EMPTY.fav 逐字，QA D04） */
  fav: '还没有收藏 · 点歌曲右侧的爱心，收进来的都会留在这里',
} as const

/** 列表底部状态行（分页加载 / 到底 / 下一页失败）。文案取原型 PLD_STATUS 原句（app.js L842）：
 * 载入中 = 转圈 +「正在载入下一批…」；失败重试 =「这一批没有载入 · 点击重试」；
 * 到底一行走共通常量 NEW_UI_PAGING_END_TEXT（三处列表同一句，不在这里重复） */
export const NEW_UI_PLD_STATUS = {
  loading: '正在载入下一批…',
  loadMoreError: '这一批没有载入 · 点击重试',
} as const

/** 动作反馈 toast */
export const NEW_UI_PLD_TOAST = {
  playAllEmpty: '这里暂时没有可播的歌曲 · 换个音源或稍后再试',
  /** 点不可播行（原型 play() 按平台提示，app.js L1609，label = getPlatformMeta(source).label） */
  unplayable: (label: string): string => `当前音源不支持${label} · 换一首或换个音源`,
  /** 收藏真 toggle（2026-10-12 走查）：四步都要点下有感；措辞按原型 PLD_TOAST 逐字 */
  favSaving: '正在存进我的歌单…',
  boardSaving: '正在收录整张榜的歌曲 · 榜单较长，请稍候',
  favRemoved: '已移出我的歌单',
  favFailed: '没弄成 · 网络或音源不稳，稍后再试',
  /** 本地歌单删除（2026-10-13）：成功如实报删了哪张，失败不留没动静的退场 */
  listDeleted: (name: string): string => `已删除「${name}」· 我的歌单已更新`,
  listDeleteFailed: '没删掉 · 存储写入不顺，稍后再试',
} as const

/* ================= 归属（owner）：详情层顶上那一行到底该叫什么 =================
 * 原型 PLD_OWNER / playlistOwnerOf() / plCrumbOf()（app.js L805-841）在 RN 侧的落地。
 *
 * 原来面包屑与页脚都按「入口 kind」取表，于是同一张单子从哪进来就换一个名字：
 * 平台收藏来的单子在我的歌单区里点开叫「自建歌单」，从歌单页池子点开叫「歌单」，
 * 名不对物，页脚也跟着说错（收藏来的平台单被说成「这份歌单只存在这台设备上」）。
 * 现在只认这份单子本身，与入口无关：
 *   own       —— 纯自建：没有平台坐标的本机单子，能加歌、能移出、能整份删；
 *   collected —— 平台收藏：平台单 + 已收进本机 userList，只读，右上那颗按下去是「移出」；
 *   platform  —— 平台单还没收：只读，右上那颗按下去是「存进我的歌单」；
 *   rank      —— 排行榜（含「存整榜」进来的那份）：平台榜，只读，右上那颗收的是整榜；
 *   fav       —— 内置「我喜欢」：不能改名、不能删，右上那一格留空占位。
 * cache（已缓存）不在这屏——它自己一屏，文案归 const/offline.ts，这里不登记。
 * 判据写在详情屏内（要用 myLists 做收藏命中）：`ownerOf` 见 SonglistDetailScreen。
 */

/** 归属的五个取值（原型 PLD_OWNER 去掉 cache 一档） */
export type NewUiPlaylistOwner = 'own' | 'collected' | 'platform' | 'rank' | 'fav'

/** 归属标题（原型 PLD_OWNER 逐字；collected 只是主词，后面带平台全名，见 newUiPlCrumb） */
export const NEW_UI_PLD_OWNER_LABEL: Record<NewUiPlaylistOwner, string> = {
  own: '自建歌单',
  collected: '收藏歌单',
  platform: '歌单',
  rank: '排行榜',
  fav: '我喜欢',
}

/**
 * 面包屑 = 归属标题（原型 plCrumbOf app.js L836-841）：
 * 收藏单补一个平台全名——收藏来的要能看出是从哪家收的；
 * 自建单子没有平台坐标，不补；榜单与平台单的平台在 hero 的胶囊上已经有一份，不重复。
 * 平台名取工程现成映射的全称（网易云 / QQ音乐 / 酷狗音乐…，`newUi…` 不走短称）。
 */
export const newUiPlCrumb = (owner: NewUiPlaylistOwner, source?: LX.Source): string =>
  owner === 'collected' && source != null
    ? `${NEW_UI_PLD_OWNER_LABEL.collected} · ${getPlatformMeta(source).label}`
    : NEW_UI_PLD_OWNER_LABEL[owner]

/**
 * .foot-note 页脚说明按归属取（原型 PLD_FOOT 三档语义，app.js L842-848）：
 * 只有 own 才说「只存在这台设备上」——收藏单 / 平台单的曲目在平台上，说这句自相矛盾；
 * collected 与 platform 同用「歌单」那一档（先列曲目、能不能播以点开那刻为准）；
 * rank / fav 各自保留原句。
 * 复用上面按 kind 的白名单条目，不另抄一份文案。
 */
export const NEW_UI_PLD_FOOT_BY_OWNER: Record<NewUiPlaylistOwner, string> = {
  own: NEW_UI_PLD_FOOT_NOTE.local,
  collected: NEW_UI_PLD_FOOT_NOTE.pl,
  platform: NEW_UI_PLD_FOOT_NOTE.pl,
  rank: NEW_UI_PLD_FOOT_NOTE.rank,
  fav: NEW_UI_PLD_FOOT_NOTE.fav,
}

/**
 * 空态按归属取（原型 renderPlTracks 的空分支，app.js L1053-1058）：
 * own 是被用户自己搬空的本机单子——下一句得告诉他怎么往里加歌（PLD_EMPTY.local）；
 * collected / platform / rank 是平台侧给的就空，如实请换一份（PLD_EMPTY.end）；
 * fav 空的是收藏本身，说清去哪收（PLD_EMPTY.fav）。
 */
export const NEW_UI_PLD_EMPTY_BY_OWNER: Record<NewUiPlaylistOwner, string> = {
  own: NEW_UI_PLD_EMPTY.localEmpty,
  collected: NEW_UI_PLD_EMPTY.end,
  platform: NEW_UI_PLD_EMPTY.end,
  rank: NEW_UI_PLD_EMPTY.end,
  fav: NEW_UI_PLD_EMPTY.fav,
}
