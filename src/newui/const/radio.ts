/**
 * 电台（播客）常量。
 *
 * **这一份放「收听地区」与「封面种子」两件事**（地区清单 + 五处共用的种子拼法；
 * 屏上文案、抽屉标题、倍速档等按屏归 `radioHome` / `radioDetail` / `radioSearch`）。
 * 数据层 `src/newui/podcast/` 只从这里取地区清单，界面层也只认这里的 `key`。
 *
 * 这份 5 组 42 区的分组**是原型自拟的，不是接口概念**
 * （来源 `new_design/data.js` L320-374 `POD_REGION_GROUPS` 逐字照搬）：
 * 排行接口 `https://rss.marketingtools.apple.com/api/v2/{country}/podcasts/top/50/podcasts.json`
 * 里那一格 `{country}` 就是这里挑中的 `key`，Apple 不给分组、也不给中文名，
 * 分组小标题只是为了在抽屉里好找（原型 U85 地区抽屉）。
 */

/** 地区选项（抽屉一行 = 一项） */
export interface PodRegionItem {
  /** 就是①地址里那一格国家码（接口参数，不是展示用词） */
  key: string
  /** 屏上给人看的名字（原型 label，逐字沿用） */
  label: string
}

/** 地区抽屉的分组清单（5 组 42 区；分组只为好找，不是接口给的概念） */
export interface PodRegionGroup {
  label: string
  items: PodRegionItem[]
}

export const NEW_UI_POD_REGION_GROUPS: PodRegionGroup[] = [
  {
    label: '中文地区',
    items: [
      { key: 'cn', label: '国内' },
      { key: 'tw', label: '中国台湾' },
      { key: 'hk', label: '中国香港' },
      { key: 'sg', label: '新加坡' },
      { key: 'my', label: '马来西亚' },
    ],
  },
  {
    label: '亚太',
    items: [
      { key: 'jp', label: '日本' },
      { key: 'kr', label: '韩国' },
      { key: 'in', label: '印度' },
      { key: 'id', label: '印度尼西亚' },
      { key: 'th', label: '泰国' },
      { key: 'vn', label: '越南' },
      { key: 'ph', label: '菲律宾' },
      { key: 'au', label: '澳大利亚' },
      { key: 'nz', label: '新西兰' },
    ],
  },
  {
    label: '欧洲',
    items: [
      { key: 'gb', label: '英国' },
      { key: 'ie', label: '爱尔兰' },
      { key: 'de', label: '德国' },
      { key: 'fr', label: '法国' },
      { key: 'es', label: '西班牙' },
      { key: 'it', label: '意大利' },
      { key: 'pt', label: '葡萄牙' },
      { key: 'nl', label: '荷兰' },
      { key: 'se', label: '瑞典' },
      { key: 'no', label: '挪威' },
      { key: 'dk', label: '丹麦' },
      { key: 'fi', label: '芬兰' },
      { key: 'pl', label: '波兰' },
      { key: 'ch', label: '瑞士' },
      { key: 'at', label: '奥地利' },
      { key: 'be', label: '比利时' },
    ],
  },
  {
    label: '美洲',
    items: [
      { key: 'us', label: '美国' },
      { key: 'ca', label: '加拿大' },
      { key: 'br', label: '巴西' },
      { key: 'mx', label: '墨西哥' },
      { key: 'ar', label: '阿根廷' },
      { key: 'co', label: '哥伦比亚' },
    ],
  },
  {
    label: '中东与非洲',
    items: [
      { key: 'tr', label: '土耳其' },
      { key: 'il', label: '以色列' },
      { key: 'sa', label: '沙特阿拉伯' },
      { key: 'ae', label: '阿联酋' },
      { key: 'eg', label: '埃及' },
      { key: 'za', label: '南非' },
    ],
  },
]

/** 展平一份用于查表（按 key 取 label / 校验 key 是否可选）；屏上分组渲染走 NEW_UI_POD_REGION_GROUPS */
export const NEW_UI_POD_REGIONS: PodRegionItem[] = NEW_UI_POD_REGION_GROUPS.flatMap(
  group => group.items,
)

/** 可选国家码白名单（= 展平清单的 key，顺序同抽屉）。取数层用它挡掉清单外的区。 */
export const NEW_UI_POD_REGION_CODES: string[] = NEW_UI_POD_REGIONS.map(item => item.key)

/**
 * 默认区（原型 `POD_REGION_DEFAULT`，app.js L1754）。
 * 每次进电台首页都固定在默认区，**不做「记住上次看的区」**（index.html L760 口径）。
 */
export const NEW_UI_POD_REGION_DEFAULT = 'cn'

/** 区码 → 屏上区名；查不到回落原码本身（不返回空串，抽屉/地区行都要有字可显示） */
export const podRegionLabel = (key: string): string =>
  NEW_UI_POD_REGIONS.find(item => item.key === key)?.label ?? key

/** 这个区码在不在清单里（取数层的前置校验用） */
export const isPodRegionCode = (key: string): boolean =>
  NEW_UI_POD_REGION_CODES.includes(key)

/* ================= 封面种子 ================= */

/**
 * 封面种子前缀（原型 `coverArt('pod:' + s.id, …)`，app.js L1830 / L1901 / L2001 / L2173）。
 * **同一个节目在五处是同一张脸**：U81 榜行、U81 订阅卡、U82 hero（含 `.pl-bg` 底纹）、
 * U84 头图、U83 命中行——所以拼法只在这里定一次，屏内不许再各写一遍字符串。
 */
export const NEW_UI_POD_ART_SEED_PREFIX = 'pod:'

/** 种子 = 前缀 + 节目 id（无图 / 图挂了的程序化底与取色都从这一颗走） */
export const newUiPodArtSeed = (showId: string): string =>
  `${NEW_UI_POD_ART_SEED_PREFIX}${showId}`
