import { USER_API_SOURCE_FILE_EXT_RXP } from '@/config/constant'

import { QUALITY_LABEL } from './quality'

/** 音源设置浮层的界面文案与音质档位整理规则。 */

/** 档位从低到高的整理序，chip 与「音质列表」都按此排 */
export const QUALITY_ORDER = [
  '128k',
  '192k',
  '320k',
  'ape',
  'flac',
  'wav',
  'flac24bit',
] as const satisfies readonly LX.Quality[]

/**
 * 浮层里可选的音质档位（从高到低）。
 * 核心只在 flac24bit / flac / 320k 里逐档降档，够不着落 128k；表外名义档（192k/ape/wav）选了也无效，故不列。
 */
export const PLAY_QUALITY_CHOICES = [
  'flac24bit',
  'flac',
  '320k',
  '128k',
] as const satisfies readonly LX.Quality[]

/** 版本号小字：数字开头才补 v，避免「vbeta」 */
export const formatApiVersion = (version: string): string =>
  /^\d/.test(version) ? `v${version}` : version

/** 音源一份的四种可见状态；rank 表示「离能用还有多远」，就绪置顶排序只认它 */
export type NewUiSourceStateKey = 'ready' | 'initing' | 'failed' | 'uninit'

/** 状态档位序：已就绪 0 → 初始化中 1 → 没就绪 2 → 未启用 3 */
export const NEW_UI_SOURCE_STATE_RANK: Record<NewUiSourceStateKey, number> = {
  ready: 0,
  initing: 1,
  failed: 2,
  uninit: 3,
}

/**
 * 折叠阈值：4 条及以内不折，超过 4 条默认折。
 * 折叠态是排版而非用户配置，不写本机存储。
 */
export const NEW_UI_SOURCE_FOLD_LIMIT = 4

/** 份数硬上限（20），与真实侧既有上限一致 */
export const NEW_UI_SOURCE_MAX = 20

/** 本机导入可选的脚本类型，与旧导入入口同口径 */
export const NEW_UI_SOURCE_FILE_EXTS = USER_API_SOURCE_FILE_EXT_RXP

/**
 * 切源后等新音源能力表落定的等待上限；到限仍没落定按「判不到」处理，只报主句、不补半句。
 */
export const NEW_UI_SOURCE_INIT_TIMEOUT_MS = 8000

/** 「标准 128k / HQ 320k」式档位列表 */
export const formatQualityList = (qualities: readonly LX.Quality[]): string =>
  [...qualities].sort((a, b) => QUALITY_ORDER.indexOf(a) - QUALITY_ORDER.indexOf(b))
    .map(q => `${QUALITY_LABEL[q]} ${q}`)
    .join(' / ')

export const NEW_UI_SHEET_SOURCE = {
  title: '音源设置',
  sub: '音源负责播放，平台负责搜索、歌单等内容。',
  groupScripts: '已安装音源',
  groupPlatforms: '音乐平台',
  groupQuality: '音质',
  groupImport: '导入音源',
  /** 生效中的音源一行说明：「能播 N 个平台 · 音质列表」 */
  platformCount: (n: number): string => `能播 ${n} 个平台`,
  /** 未接入行文案；当前音源名为空时改为引导句 */
  platformUncovered: (name: string, label: string): string =>
    name.length > 0 ? `「${name}」未接入${label}` : `还没有音源接${label} · 贴脚本链接就能听`,
  /** 切换内容平台成功 toast（覆盖首页、歌单与排行榜） */
  platformSwitched: (label: string): string => `首页、歌单与排行榜内容已切换为${label}`,
  /** 选中平台当前音源没接上时的补充半句 */
  platformSwitchedUncovered: '（可浏览，暂不可播）',
  /** 当前内容平台行的状态标签 */
  platformActiveTag: '当前在看',
  unplayableTag: '不可播',
  /** 音源状态标签四档 */
  stateReady: '已就绪',
  stateIniting: '初始化中',
  stateFailed: '没就绪',
  stateIdle: '未启用',
  /** 切源成功 toast */
  switched: (name: string, version: string): string =>
    `已切到「${name}」${version ? formatApiVersion(version) : ''}`.trim(),
  /** 切源后当前这首取不到地址时追加的半句（需同时暂停） */
  switchedUnplayable: ' · 当前这首不可播，已暂停',
  /** 音源只有单档时的提示 */
  qualitySingleNote: (name: string, q: LX.Quality): string =>
    `${name} 仅支持 ${QUALITY_LABEL[q]} ${q}。`,
  /** 档位 chip 标签一律是「音质名 + 档位」，不支持档只降显不改字 */
  qualityChip: (q: LX.Quality): string => `${QUALITY_LABEL[q]} ${q}`,
  /** 点不支持档位时的说明：会强行降到 fallback 档 */
  qualityPickUnsupported: (name: string, q: LX.Quality, fallback: LX.Quality): string =>
    `「${name}」没有${QUALITY_LABEL[q]}这一档 · 强行选择也会自动降到${QUALITY_LABEL[fallback]}`,
  /** 有置灰档位时常驻的一行解释 */
  qualityDimNote: '置灰档位当前音源不支持，播放时会自动降档。',
  /** 已存选择落在不支持档位时的说明（切音源后常见，如实回显降到哪档） */
  qualitySavedDowngradeNote: (q: LX.Quality, fallback: LX.Quality): string =>
    `你选的${QUALITY_LABEL[q]}暂不可用，播放时按${QUALITY_LABEL[fallback]}播。`,
  /** 未接源 / 脚本没声明档位时的说明 */
  qualityEmptyHint: '选好或导入音源后，这里会列出它真正支持的档位。',
  scriptsEmptyHint: '还没有音源 · 在下方导入',
  /* ---- 已安装音源列表折叠 ---- */
  /** 折叠开关上的字：展开全部 / 收起列表 */
  foldExpandAll: (n: number): string => `展开全部 ${n} 个`,
  foldCollapse: '收起列表',
  /** 列表尾行：还有 N 个未显示 */
  foldMore: (hidden: number, ready: number): string =>
    `还有 ${hidden} 个音源没显示 · 点这里看全${ready > 0 ? `（其中 ${ready} 个已就绪）` : ''}`,
  /* ---- 行尾刷新 ---- */
  /** 刷新钮无障碍名（不上屏） */
  refreshAria: (name: string): string => `刷新音源 ${name}`,
  refreshed: (name: string): string => `已刷新「${name}」`,
  refreshErr: (message: string): string => `刷新失败：${message}`,
  /* ---- 行尾移除 ---- */
  /** 移除钮无障碍名（不上屏） */
  removeAria: (name: string): string => `移除音源 ${name}`,
  /** 移除二次确认标题 */
  removeTitle: (name: string): string => `要移除「${name}」吗`,
  /** 移除确认正文：说清这份音源从设备上消失、已听歌曲不受影响 */
  removeBody: '移除后这台设备将不再有这份音源，已听过的歌曲不受影响。',
  /** 删的是当前生效那份时补的半句 */
  removeBodyActive: '这是当前生效的音源，移除后会自动切到其他音源。',
  removeOk: '移除音源',
  removed: (name: string): string => `已移除「${name}」`,
  /** 删的是生效那份、已落到下一位时追加 */
  removedSwitched: (name: string): string => ` · 已自动切到「${name}」`,
  removedEmpty: ' · 这台设备上暂时没有音源了',
  /* ---- 本机导入 ---- */
  importFile: '从本机选择一份音源文件',
  /** 读取进行中的按钮文案 */
  importFileBusy: '正在读取…',
  /** 进行中回显 */
  importHint: '正在读取…',
  /** 常驻说明：两条导入方式的差别与就绪时机 */
  importHintTwoPaths: '在线导入需联网，本机导入直接读文件 · 都要等初始化完成才标「已就绪」。',
  /** 份数超上限的报错 */
  importErrMax: (max: number): string => `这台设备上最多同时留 ${max} 份音源 · 先移除一些再导入`,
  importErrBadFile: '这份文件读不出音源 · 请选一个音源文件',
  /** 系统文件选择器打开失败的提示 */
  importErrNoPicker: '没能打开选文件的那一步 · 可以再试一次',
  /* ---- 导入行 ---- */
  importPlaceholder: '音源脚本链接',
  importGo: '导入',
  importGoBusy: '导入中…',
  importErrNotUrl: '要贴 http:// 或 https:// 开头的脚本链接',
  importErrTooLarge: '这个脚本太大了，导不进来',
  importErrFetch: (message: string): string => `没抓到脚本：${message}`,
} as const
