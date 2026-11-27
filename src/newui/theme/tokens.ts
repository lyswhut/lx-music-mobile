/**
 * 新 UI 设计 token（唯一数据源）
 * 深浅两套取值均对齐设计稿；组件内禁止硬编码色值 / 尺寸，一律从这里取。
 */
import type { GlassLayerSpec, GradientSpec, ShadowSpec, ThemeColors, ThemeScheme } from './types'

/* ================= 色板 ================= */

// 深色为基准；浅色保持 brand 渐变与语义色不变，重排 bg/surface/text 层级（浅底深字）
export const PALETTES: Record<ThemeScheme, ThemeColors> = {
  dark: {
    bg: '#08080C',
    bgSoft: '#0E0F15',
    surface: '#15171F',
    surface2: '#1C1F29',
    surface3: '#242836',
    line: 'rgba(255, 255, 255, 0.075)',
    lineStrong: 'rgba(255, 255, 255, 0.14)',
    text: '#F3F4F8',
    text2: '#A2A8B8',
    text3: '#6B7182',
    brand: '#FF5C8A',
    brand2: '#7A3BFF',
    brand3: '#FFD36E',
    ok: '#31C27C',
    playingBorder: 'rgba(255, 255, 255, 0.07)',
    onBrand: '#0A0A0F',
    onGradient: '#FFFFFF',
    brandWash: 'rgba(255, 92, 138, 0.16)',
    switchOff: 'rgba(255, 255, 255, 0.16)',
    switchKnob: '#FFFFFF',
    glowA: 'rgba(122, 59, 255, 0.28)',
    glowB: 'rgba(255, 92, 138, 0.22)',
    artScrim: 'rgba(0, 0, 0, 0.34)',
    seekTrack: 'rgba(255, 255, 255, 0.14)',
    /* 语义化填充 / 描边 / 贴片 */
    fill1: 'rgba(255, 255, 255, 0.06)',
    fill2: 'rgba(255, 255, 255, 0.07)',
    fill3: 'rgba(255, 255, 255, 0.12)',
    fill4: 'rgba(255, 255, 255, 0.17)',
    hairline: 'rgba(255, 255, 255, 0.06)',
    hairlineStrong: 'rgba(255, 255, 255, 0.26)',
    card: 'rgba(255, 255, 255, 0.045)',
    glassPatch: 'rgba(10, 10, 16, 0.74)',
    glassPatchInk: '#FFFFFF',
    dangerInk: '#FF8B7E',
    /* 歌词当前行阴影色：两套主题无法互相反推，各留一档；
       Android 大半径文字阴影可能糊成暗斑，真机若脏改浓度口径 */
    lyricGlow: 'rgba(0, 0, 0, 0.55)',
    /* 磁吸圆点那一族：底色比 glassPatch 薄一档，以透出底下的字；另配外圈弧底 / 发丝描边 */
    miniVeil: 'rgba(10, 10, 16, 0.30)',
    miniRing: 'rgba(255, 255, 255, 0.20)',
    miniDotLine: 'rgba(255, 255, 255, 0.22)',
  },
  light: {
    bg: '#F6F6FA',
    bgSoft: '#EFEFF6',
    surface: '#FFFFFF',
    surface2: '#F3F3F8',
    surface3: '#E9E9F1',
    line: 'rgba(21, 22, 28, 0.08)',
    lineStrong: 'rgba(21, 22, 28, 0.16)',
    text: '#15161C',
    text2: '#5A5F6E',
    text3: '#8B90A0',
    brand: '#FF5C8A',
    brand2: '#7A3BFF',
    brand3: '#FFD36E',
    ok: '#31C27C',
    playingBorder: 'rgba(255, 92, 138, 0.34)',
    onBrand: '#0A0A0F',
    onGradient: '#FFFFFF',
    brandWash: 'rgba(255, 92, 138, 0.16)',
    switchOff: 'rgba(21, 22, 28, 0.16)',
    switchKnob: '#FFFFFF',
    glowA: 'rgba(122, 59, 255, 0.14)',
    glowB: 'rgba(255, 92, 138, 0.12)',
    artScrim: 'rgba(0, 0, 0, 0.30)',
    seekTrack: 'rgba(21, 22, 28, 0.14)',
    /* 语义化填充 / 描边 / 贴片；card 为实心白（页面灰底 + 白卡），dangerInk 反相为深红 */
    fill1: 'rgba(21, 22, 28, 0.06)',
    fill2: 'rgba(21, 22, 28, 0.07)',
    fill3: 'rgba(21, 22, 28, 0.12)',
    fill4: 'rgba(21, 22, 28, 0.17)',
    hairline: 'rgba(21, 22, 28, 0.06)',
    hairlineStrong: 'rgba(21, 22, 28, 0.26)',
    card: '#FFFFFF',
    glassPatch: 'rgba(255, 255, 255, 0.82)',
    glassPatchInk: '#15161C',
    dangerInk: '#C43C2E',
    lyricGlow: 'rgba(21, 22, 28, 0.22)',
    /* 磁吸圆点那一族浅色档：底换白色薄纱，外圈弧与描边换深墨 */
    miniVeil: 'rgba(255, 255, 255, 0.26)',
    miniRing: 'rgba(21, 22, 28, 0.16)',
    miniDotLine: 'rgba(21, 22, 28, 0.16)',
  },
}

/* ================= 渐变 ================= */

// CSS 角度 → RN start/end 近似：120deg 用 (0,.25)→(1,.75)，135deg 用对角
export const GRADIENTS = {
  /** 主色渐变 */
  brand: {
    colors: ['#FF5C8A', '#C04CE8', '#7A3BFF'],
    start: { x: 0, y: 0.25 },
    end: { x: 1, y: 0.75 },
  },
  /** 主色软渐变 --grad-soft（正在播放行 / 选中项底色） */
  brandSoft: {
    colors: ['rgba(255, 92, 138, 0.22)', 'rgba(122, 59, 255, 0.22)'],
    start: { x: 0, y: 0.25 },
    end: { x: 1, y: 0.75 },
  },
  /** 封面 / 头像对角渐变（渲染时用具体 c1 / c2 替换首尾色） */
  art: {
    colors: ['#FF5C8A', '#7A3BFF'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  /** 「我的」页头像底（近竖向略斜） */
  headArt: {
    colors: ['#FF5C8A', '#7A3BFF'],
    start: { x: 0.25, y: 0 },
    end: { x: 0.75, y: 1 },
  },
} as const satisfies Record<string, GradientSpec>

/* ================= 平台色 ================= */

/** 五平台品牌 tint，用于来源角标 / 榜单卡 */
export const PLATFORM_TINTS = {
  tx: '#31C27C',
  wy: '#E4413F',
  kw: '#12B7F5',
  kg: '#3FBCB4',
  mg: '#FF6FA5',
} as const

export type PlatformTintKey = keyof typeof PLATFORM_TINTS

/** 封面占位渐变组 */
export const ART_PALETTES: ReadonlyArray<readonly [string, string, string]> = [
  ['#FF5C8A', '#7A3BFF', '#FFD36E'],
  ['#22D3EE', '#2563EB', '#A5F3FC'],
  ['#FBBF24', '#EF4444', '#FDE68A'],
  ['#34D399', '#0EA5E9', '#D1FAE5'],
  ['#F472B6', '#8B5CF6', '#FBCFE8'],
  ['#60A5FA', '#1E1B4B', '#C7D2FE'],
  ['#FB923C', '#DB2777', '#FED7AA'],
  ['#2DD4BF', '#4338CA', '#99F6E4'],
]

/* ================= 封面上的中性叠加色 ================= */

/**
 * 压在封面图 / 渐变底上的中性色：封面永远是深底，这层不随主题反转，
 * 所以不进色板，但也不许散在组件里。
 */
export const ART_INK = {
  /** 前景白：占位图标、角标图标、图上文字 */
  fg: '#FFFFFF',
  /** 遮罩基色黑 */
  veil: '#000000',
  /** 标签底基色 */
  wip: '#08080C',
  /** 角标底色浓度 */
  badgeAlpha: 0.45,
  /** 标签底 / 角标描边浓度 */
  chipAlpha: 0.18,
  /** 遮罩中间档浓度 */
  scrimMidAlpha: 0.04,
  /** 标签底色浓度 */
  wipAlpha: 0.55,
} as const

/* ================= 圆角 ================= */

// --r-s/m/l/xl = 12/18/24/30；其余为规则内实际用量
export const RADIUS = {
  /** 指示条等 2px 小圆角 */
  dot: 2,
  /** 来源角标 */
  tagXs: 5,
  /** 音质标签 */
  tagSm: 7,
  /** 标签 / 日期胶囊 */
  tag: 8,
  /** 歌曲行封面 */
  artXs: 10,
  /** 基础卡面 */
  s: 12,
  /** 胶囊 / 歌曲行 / 幽灵按钮 */
  control: 14,
  /** 药丸按钮 */
  pill: 16,
  /** 设置列表 */
  m: 18,
  /** 搜索栏 */
  search: 19,
  /** 快捷块 / 歌单封面 */
  art: 20,
  /** 收藏卡 */
  card: 22,
  /** 大卡面 */
  l: 24,
  /** 特大卡面 */
  xl: 30,
  /** 全圆 */
  full: 999,
} as const

/* ================= 间距 ================= */

// 提取自规则内的实际节奏值，组件按语义取用
export const SPACING = {
  xxs: 2,
  xs: 4,
  s: 6,
  sm: 8,
  ms: 10,
  md: 12,
  ml: 14,
  lg: 16,
  xl: 20,
  xxl: 22,
  xxxl: 26,
  huge: 30,
  giant: 44,
} as const

/* ================= 布局骨架 ================= */

// 页面滚动容器基准；顶栏高度与内容上留白不写死，统一用文件末尾的 topbarHeight(topInset) 计算
export const LAYOUT = {
  /** 页面左右内边距 */
  screenPaddingX: 16,
  /** 区块垂直间距 */
  sectionGap: 26,
  /** 滚动内容末尾与 Tab 栏之间的留白 */
  contentGapAboveTabBar: 86,
} as const

/* ================= 层叠台阶 ================= */

/**
 * 少数必须压在滚动内容之下 / 之上的层用的 zIndex（RN 自绘层级，不产生 elevation 阴影）。
 * 只给真出过问题的层加：封面氛围底、吸顶顶栏、迷你播放条、LRC 浮窗、底部浮层、提示胶囊；
 * 其余兄弟节点仍按声明顺序（Tab 栏在布局流内不重叠，不加）。
 */
export const Z_LAYER = {
  /** 封面氛围底纹 */
  wash: 0,
  /** 层内内容 */
  layerContent: 1,
  /** 迷你播放条：浮在内容与推入层之上，但让位于底部浮层 */
  minibar: 68,
  /** 吸顶顶栏 */
  topbar: 40,
  /** LRC 浮窗：压过顶栏 / 迷你条 / Tab 栏，让位于浮层与提示胶囊 */
  lrcFloat: 75,
  /** 底部浮层 */
  sheet: 80,
  /** 提示胶囊：全站最高一层（硬件状态栏除外） */
  toast: 90,
} as const

/* ================= 封面氛围底纹（共通件度量） ================= */

/**
 * CoverWash 的度量：blur+saturate 不可用，降级为封面种子渐变铺底；
 * 局部铺底时下沿必须渐隐到 0，否则会被看成盖在内容上的一层蒙板。
 */
export const COVER_WASH = {
  /** 整层铺底的缺省渐变方向：封面 135deg 对角 */
  artStart: { x: 0, y: 0 },
  artEnd: { x: 1, y: 1 },
  /** 局部铺底时的纵向渐隐起止 */
  fadeStart: { x: 0.5, y: 0 },
  fadeEnd: { x: 0.5, y: 1 },
  /** 三段衰减的位置与相对峰值透明度的系数（1 → 中段 → 0，收尾无硬边） */
  fadeLocations: [0, 0.62, 1],
  fadeAlphaRatios: [1, 0.5, 0],
} as const

/* ================= 控件度量 ================= */

// .chip / .q-tag / .section-more 等迷你控件的固定尺寸（颜色一律走色板）
export const CONTROL = {
  chipHeight: 28,
  chipPaddingX: 11,
  tagPaddingX: 7,
  tagPaddingY: 2.5,
  badgePaddingX: 5,
  badgePaddingY: 2,
  /** section-more 尾部箭头尺寸与透明度 */
  moreIconSize: 13,
  moreIconOpacity: 0.7,
  moreGap: 1,
  /** 小尺寸文字链的点击热区外扩（RN 侧补可点区域） */
  moreHitSlop: 8,
  /** 触控最小目标边长（44 等效，仅扩热区，不改视觉尺寸 / 布局） */
  hitTarget: 44,
} as const

/* ================= 歌曲行（.song-row） ================= */

// 含紧凑变体与 .eq 均衡条；字号走 FONT_SIZE，播放底渐变走 GRADIENTS.brandSoft
export const SONG_ROW = {
  gap: 11,
  listGap: 2,
  paddingY: 7,
  paddingRight: 8,
  paddingLeft: 4,
  compactPaddingY: 5,
  compactPaddingRight: 6,
  compactPaddingLeft: 3,
  /** 紧凑变体标题字号 */
  titleSizeCompact: 13.5,
  subMarginTop: 3,
  /** 副行段落间距 */
  subGap: 6,
  sepWidth: 1,
  sepHeight: 9,
  /** 收缩优先级：角标不缩，歌手 1，专辑 100 */
  artistFlexShrink: 1,
  albumFlexShrink: 100,
  /** 排名槽最小宽 22；三位数编号自动撑宽不折行 */
  rankWidth: 22,
  /** 封面尺寸（圆角走 RADIUS.artXs） */
  artSize: 46,
  artSizeCompact: 40,
  morePadding: 4,
  moreIconSize: 16,
  /** .eq 均衡条：宽 2、高 3↔11、间距 1.5（周期走 MOTION.eq） */
  eqWidth: 2,
  eqMinHeight: 3,
  eqHeight: 11,
  eqGap: 1.5,
  /** 播放列表面板那一列：不传 rank，列间距 4 / 上边距 12 */
  queueListGap: 4,
  queueListMarginTop: 12,
} as const

/* ================= 按钮族 ================= */

// 图标按钮 / 幽灵按钮 / 药丸按钮 / 我的页编辑钮的度量
export const BUTTON = {
  iconSize: 34,
  iconIcon: 18,
  iconSizeLg: 42,
  iconIconLg: 19,
  dotSize: 7,
  dotOffset: 4,
  /**
   * .pulse-dot 呼吸扩散：RN 以同色圆环覆盖件等价，外圈终径 = dotSize + 2×dotRingSpread，
   * dotRingPhase 为扩散段占总周期比例，dotRingAlpha 为 0% 帧透明度。
   */
  dotRingSpread: 7,
  dotRingPhase: 0.7,
  dotRingAlpha: 0.5,
  ghostHeight: 42,
  ghostIcon: 15,
  ghostGap: 7,
  pillHeight: 32,
  pillPaddingX: 13,
  pillGap: 6,
  pillIcon: 15,
  /** 我的页编辑钮：左内衬 11（右侧仍 13），按压缩放 .96 */
  pillPaddingLeftEdit: 11,
  pillPressScale: 0.95,
  pillPressScaleEdit: 0.96,
} as const

/* ================= 开关（.toggle） ================= */

// 轨道 46×27，旋钮 21（内边 3），行程 19
export const SWITCH = {
  width: 46,
  height: 27,
  radius: 14,
  knob: 21,
  inset: 3,
  travel: 19,
} as const

/* ================= 顶栏（.topbar） ================= */

// 顶栏 / 顶栏行 / 头像钮 / 搜索栏
export const TOP_BAR = {
  /** 状态栏实测高度之上的留白；宽屏档走 WIDE_STRUCTURAL.statusReserve */
  statusBarReserve: 2,
  paddingBottom: 10,
  /** 顶栏行高 */
  rowHeight: 46,
  gap: 10,
  /** 头像钮直径 */
  avatarSize: 34,
  /** 头像首字字号 */
  avatarTextSize: 13,
  /** 搜索栏度量 */
  searchHeight: 38,
  searchPaddingX: 14,
  searchGap: 8,
  searchIcon: 17,
  /** 顶栏底色走 BlurredContainer（见 GLASS.topBar），盒外不再铺底 / 收边 */
  /** 滚动超过此高度顶栏加投影 */
  pinnedThreshold: 8,
} as const

/* ================= 底部 Tab 栏（.tabbar） ================= */

// Tab 栏 / Tab 项 / 选中态指示条
export const TAB_BAR = {
  height: 60,
  paddingTop: 8,
  /** 图标与文字间距 */
  gap: 3,
  iconSize: 23,
  /** 选中态指示条 */
  indicatorWidth: 22,
  indicatorHeight: 3,
  indicatorTop: -8,
  /** 按压缩放（200ms；颜色那段的 .25s 属选中态换色） */
  pressScale: 0.92,
  /** 底栏底色走 BlurredContainer（见 GLASS.tabBar）；不可用时退回不透明 bg */
} as const

/* ================= 玻璃层（backdrop-filter 毛玻璃） ================= */

/**
 * 常驻玻璃位（顶栏 / Tab 栏 / 迷你播放条 / 圆点 / 提示胶囊 / LRC 浮窗）的统一参数，
 * 共通件见 components/Glass/BlurredContainer。
 * 顶栏比 TabBar / Minibar 更透、模糊更强；后两者对齐顶栏旧档的综合观感。
 * tint 一律「色板键 × alpha」，浅深自动跟随；saturate 无法表达，由染色层近似；
 * fallbackBase 是真模糊不可用时的降级底，保证分层不糊成一片。
 */
export const GLASS = {
  /** 顶栏（含系统状态栏背后区域）：更透一档，盒外无铺底 */
  topBar: {
    intensity: 30,
    tintBase: 'bg',
    tintAlphas: [0.78, 0.52, 0],
    tintLocations: [0, 0.62, 1],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
    fallbackBase: 'bg',
  },
  /** 底部 Tab 栏（含导航条安全区）：顶透底实，图标与文字压在实端 */
  tabBar: {
    intensity: 22,
    tintBase: 'bg',
    tintAlphas: [0, 0.66, 0.92],
    tintLocations: [0, 0.38, 1],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
    fallbackBase: 'bg',
  },
  /** 迷你播放条完整态：顶实底薄，下沿留 0.18 收尾 */
  minibar: {
    intensity: 22,
    /** 基色取中性 bg，深浅两套自动跟随 */
    tintBase: 'bg',
    tintAlphas: [0.86, 0.6, 0.18],
    tintLocations: [0, 0.6, 1],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
    /** 降级态垫不透明 surface2 保底 */
    fallbackBase: 'surface2',
  },
  /** 磁吸圆点：只有 3px 模糊，宁可厚一点也不漏内容 */
  miniSnapped: {
    intensity: 3,
    tintBase: 'miniVeil',
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 },
    fallbackBase: 'surface2',
  },
  /** 提示胶囊：与迷你条同一贴片家族，模糊半径 18 */
  toast: {
    intensity: 18,
    tintBase: 'glassPatch',
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 },
    /** 降级底同用 glassPatch：双层叠出近实底，保证无模糊时仍可读 */
    fallbackBase: 'glassPatch',
  },
  /** LRC 浮窗：glassPatch 贴片家族，模糊半径 20；降级底同 toast 口径 */
  lrcFloat: {
    intensity: 20,
    tintBase: 'glassPatch',
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 },
    fallbackBase: 'glassPatch',
  },
} as const satisfies Record<string, GlassLayerSpec>

/**
 * Android 侧真模糊的采样策略（性能档）：autoUpdate=true 时每帧重截图身后内容再模糊，
 * 三个常驻玻璃层叠在滚动列表上会明显掉帧，故关闭；代价是模糊像静态快照，滚动时不跟随。
 * iOS 走 UIVisualEffectView，不受此开关影响；改回 true 即可复原。
 */
export const GLASS_PERF = {
  /** Android BlurView 是否逐帧重采样身后内容（iOS 忽略本值） */
  androidAutoUpdate: false,
} as const

/* ================= 页头（.page-head） ================= */

export const PAGE_HEAD = {
  marginTop: 6,
  gap: 12,
} as const

/* ================= 空列表提示（.empty-tip） ================= */

// 页面内与 .pl-layer 内两种内边距
export const EMPTY_TIP = {
  paddingTop: 22,
  paddingBottom: 6,
  layerPaddingY: 34,
  lineHeight: 21,
} as const

/* ================= 卡片网格与歌单卡（.pl-grid / .pl-card） ================= */

// 竖屏基线；宽屏档的列数与间隙覆盖见 WIDE / wideGridGapOf
export const CARD_GRID = {
  columns: 3,
  rowGap: 14,
  columnGap: 12,
} as const

/* ================= 轻量宽屏档 ================= */

/**
 * 「轻量宽屏」的唯一数据源。判据 = 屏内宽（RN 窗口宽即屏内宽，不含模拟机边框），
 * 阈值 600 / 840：medium 3 列、expanded 4 列，内容盒限宽 620 后水平居中。
 * compact（<600）为手机竖屏档：列数与结构度量全走竖屏基线。
 * 明确不承接左侧导航栏、歌单详情主从、设定页两列、播放页改造等结构级形态。
 * 判据函数见文件末尾 wideTierOf / wideColumnsOf / wideGridGapOf / wideContentMaxWidthOf 等。
 */
export const WIDE = {
  /** < 600 为手机竖屏档 */
  compactUpper: 600,
  /** 600 ≤ 屏内宽 < 840 为 medium 档 */
  mediumUpper: 840,
  mediumColumns: 3,
  expandedColumns: 4,
  /** medium 档栅格间隙（行×列 = 16×14） */
  mediumRowGap: 16,
  mediumColumnGap: 14,
  /** expanded 档栅格间隙（行×列 = 16×12） */
  expandedRowGap: 16,
  expandedColumnGap: 12,
  /** medium / expanded 共用内容盒限宽（含 .page 左右 16），超出后水平居中 */
  contentMaxWidth: 620,
} as const

/**
 * 宽屏档（medium / expanded 共用）的结构度量覆盖；仅非 compact 档生效，
 * 消费侧写 `wide?.x ?? 竖屏基线 token`。
 * 垂直预算以实测状态栏高度为基元合成（状态栏之上 4、行高 46、Tab 44、迷你条 52+52、呼吸 24）。
 */
export const WIDE_STRUCTURAL = {
  /** 模拟状态栏高 32，RN 不落地、只作分解基准 */
  statusBarHeight: 32,
  /** 状态栏之上的内衬 = 36 − 32 = 4，宽屏档各落点统一收到 4 */
  statusReserve: 4,
  /** 宽屏顶栏左右内边距 */
  topBarPaddingX: 22,
  /** 滚动容器下内衬里「Tab 栏上沿之上」那一段 = 84（8 + 迷你条 52 + 呼吸 24） */
  contentGapAboveTabBar: 84,
  /** Tab 栏高（不含安全区） */
  tabBarHeight: 44,
  tabBarPaddingTop: 6,
  tabIconSize: 20,
  minibarHeight: 52,
  /** 迷你条底距：安全区之上再抬 52 */
  minibarBottomAboveSafe: 52,
  bannerHeight: 112,
  /** 单集屏底部内边距（竖屏 34，宽屏收到 26） */
  episodeLayerPaddingBottom: 26,
} as const

/** 宽屏档结构度量对象的类型（消费侧的 `wide?.x ?? 竖屏基线` 与 `topbarHeight` 第二入参都吃它） */
export type WideStructural = typeof WIDE_STRUCTURAL

export const PL_CARD = {
  /** 标题：上边距 8、行高 1.35、最多两行 */
  titleMarginTop: 8,
  titleLineHeightRatio: 1.35,
  titleLines: 2,
  /** 副信息：上边距 3、与圆点间距 5 */
  metaMarginTop: 3,
  metaGap: 5,
  /** 来源圆点尺寸（颜色取平台 tint） */
  dotSize: 5,
  /** 按压缩放（过渡 200ms） */
  pressScale: 0.96,
} as const

/* ================= 榜单卡 ================= */

// 底色与文字度量见 CHART_ART
export const RANK_CARD = {
  gridMarginTop: 18,
  /** 1px 高光描边浓度 */
  ringAlpha: 0.16,
  pressScale: 0.96,
} as const

/* ================= 排行榜分段头与分批续取 ================= */

// 按平台插分段头，滚到底续取下一批
export const RANK_GROUP = {
  gap: 8,
  /** 首个子项的上边距由组件 first 属性清零 */
  marginTop: 12,
  marginBottom: -4,
  /** 平台组名 */
  titleSize: 16,
  /** 「N 个榜」副文案 */
  countSize: 12,
} as const

// 每批上卡张数按竖屏 3 列的行数对齐
export const RANK_PAGING = {
  /** 每批张数（3 列 = 4 行） */
  pageSize: 12,
  /** 距底多少 px 触发续取 */
  endReachedDistance: 160,
} as const

/* ================= 分页状态行 ================= */

// 排行榜页与歌单详情页共用
export const PAGING_STATUS = {
  paddingVertical: 14,
  paddingHorizontal: 6,
  fontSize: 12,
  /** 动画标识与文字之间的间距 */
  contentGap: 7,
} as const

/* ============ 分页「正在获取」动画标识（RunningDots） ============ */

// 三颗圆点按接力顺序起跳-落地，颜色取品牌渐变三端点；纯 Animated + useNativeDriver
export const RUNNING_DOTS = {
  dotSize: 6,
  dotGap: 5,
  hopHeight: 7,
  /** 没轮到的点的静息透明度 */
  idleAlpha: 0.4,
  /** 完整一轮周期 ms */
  cycleMs: 900,
} as const

/* ================= 列表终点行 ================= */

// 「没有更多了」：两侧细线把它收成一条句号横线（榜单页 / 歌单池 / 详情层共用）
export const PAGING_END = {
  marginTop: 20,
  /** 网格内收紧的上边距 */
  marginTopInGrid: 10,
  marginBottom: 6,
  marginX: 2,
  gap: 10,
  /** 细线尺寸与透明度 */
  lineHeight: 1,
  lineAlpha: 0.22,
  fontSize: 11.5,
  letterSpacing: 0.4,
} as const

// 歌单页「推荐歌单池」分批续取；距底触发线复用 RANK_PAGING.endReachedDistance
export const PL_POOL_PAGING = {
  /** 每屏份数（3 列 = 5 行） */
  pageSize: 15,
} as const

/* ================= 榜单封面（chartFace / 榜单卡文字层） ================= */

// 封面为整张铺满的插画（命中判据查表，未命中用兜底图），卡上两行字一律白墨（走 ART_INK）；
// 可读性靠紧贴字边的小投影，不用大模糊，也不加字底遮罩。
export const CHART_ART = {
  /** 插画未到位那一瞬的垫底色 */
  cardBg: '#0B1220',
  /** 文字块固定在左上角 */
  copyTop: 12,
  copyInsetX: 13,
  /** 榜名：字号 / 行高 / 最多两行 */
  nameSize: 17,
  nameLineHeight: 21.25,
  /** 两行字同一档投影 */
  shadowAlpha: 0.55,
  shadowOffsetY: 1,
  shadowRadius: 3,
  /** 副行紧跟榜名，单行省略 */
  subMarginTop: 2,
  subAlpha: 0.76,
} as const

/* ================= 我的歌单卡（歌单页横滑排） ================= */

// 卡宽 120；行间隙与 .hscroll 相同，直接复用 H_SCROLL.gap
export const MY_PL = {
  width: 120,
  artSize: 120,
  /** 数值与 RADIUS.pill 相同但语义不同，就近定义 */
  artRadius: 16,
  nameMarginTop: 8,
  subMarginTop: 2,
  /** 按压缩放（过渡 200ms） */
  pressScale: 0.95,
} as const

/* ================= 我的页 ================= */

// 头像 / 我喜欢卡压在渐变底上，描边与圆点色走 ART_INK（不随主题反转）；
// 头像字色归到 onBrand（与设计稿 #12060c 差一档，已知近似）。
export const MINE = {
  headMarginTop: 8,
  headGap: 13,
  /** 头像直径（字号走 FONT_SIZE.mineInitial） */
  headArtSize: 58,
  /** 渐变底上的亮描边 */
  headRingWidth: 1.5,
  headRingAlpha: 0.22,
  headSubMarginTop: 3,
  /** 编辑钮图标（PillButton 缺省为 15） */
  headEditIcon: 14,
  statMarginTop: 18,
  statGap: 8,
  /** 统计条限宽：宽屏下不被拉到整页宽 */
  statMaxWidth: 620,
  statPaddingY: 11,
  statPaddingX: 4,
  statRadius: 16,
  statLabelMarginTop: 3,
  /** 合一卡限宽，与上面同值同族；卡片度量见 FAV_DUO */
  favMaxWidth: 620,
} as const

/* ============ 「我喜欢 / 已缓存」合一卡 ============ */

/**
 * 「我的」页一张整宽卡，中间斜线切成左右两半：左「我喜欢」、右「已缓存」。
 * 几何 / 字号 / 斜线角度两档共用，只有配色按档换。
 */
export const FAV_DUO = {
  marginTop: 20,
  paddingVertical: 16,
  /** 与 RADIUS.card 的 22 不是一档，就近定义 */
  radius: 24,
  halfPaddingLeft: 20,
  halfPaddingRight: 16,
  columnGap: 12,
  rowGap: 2,
  artSize: 44,
  artRadius: 14,
  artIcon: 22,
  /**
   * .fc-art 阴影：故意没有 elevation —— 托底是半透明的，Android elevation 阴影会从底下透出来，
   * 整体发灰还带硬边；CSS 外阴影不会画到自己背景下面。
   */
  artShadowOffsetY: 2,
  artShadowRadius: 8,
  /** 4px 实心斜线，居中后旋转 18deg */
  dividerWidth: 4,
  dividerRadius: 4,
  dividerRotate: '18deg',
  dividerLeft: '50%',
  /** 斜线上下各溢出 20%，由卡面 overflow:hidden 裁掉 */
  dividerSpan: '-20%',
  /** 两半任一按下都缩整卡 */
  pressScale: 0.99,
  /** 本族唯一 .25s 档，不是 MOTION.fast(200) */
  pressMs: 250,
  titleSize: 16,
  titleWeight: '700',
  titleLetterSpacing: 0.5,
  subSize: 12,
  subWeight: '500',
  /** 外阴影参数（颜色与浓度见 palette） */
  shadowOffsetY: 8,
  shadowRadius: 24,
  shadowElevation: 8,
  /** 两档配色 */
  palette: {
    dark: {
      /** 深色档渐变底 */
      gradient: { colors: ['#3A1B30', '#241C45'], start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
      /** 阴影载体不透明底（取渐变起点色） */
      surface: '#3A1B30',
      shadowColor: '#000000',
      shadowOpacity: 0.42,
      /** 深色档内描边 */
      ringColor: 'rgba(255, 255, 255, 0.06)',
      /** 斜线色 */
      dividerColor: 'rgba(255, 255, 255, 0.22)',
      /** 半透明托底（另有 blur 4px，不迁移） */
      artBg: 'rgba(255, 255, 255, 0.11)',
      artShadowColor: '#000000',
      artShadowOpacity: 0.18,
      titleColor: '#F5F1FB',
      subColor: 'rgba(255, 255, 255, 0.52)',
      /** 左半心形 / 右半电话图标色 */
      loveIcon: '#F06BFF',
      offlineIcon: '#A78BFF',
    },
    light: {
      /** 浅色档渐变底 */
      gradient: { colors: ['#FDE2EE', '#D6C3F9'], start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
      surface: '#FDE2EE',
      shadowColor: '#9345E6',
      shadowOpacity: 0.12,
      /** 浅色档无描边，显式 transparent */
      ringColor: 'transparent',
      dividerColor: 'rgba(255, 255, 255, 0.75)',
      artBg: 'rgba(255, 255, 255, 0.7)',
      artShadowColor: '#000000',
      artShadowOpacity: 0.04,
      titleColor: '#1A1A1A',
      subColor: 'rgba(0, 0, 0, 0.45)',
      /** 左半心形 / 右半电话图标色 */
      loveIcon: '#D233F8',
      offlineIcon: '#7129E8',
    },
  },
} as const

/* ================= 已缓存屏 ================= */

/**
 * 「已缓存」（离线收听）整屏的度量：固定段与顶排是跨件原子（PL_LAYER / PlTop），
 * 本块只收口径段与列表轴自己的内衬与列距。
 */
export const OFFLINE = {
  metaMarginTop: 18,
  metaGap: 5,
  /** 数量文字（等宽数字） */
  countSize: 15,
  countWeight: '900',
  countLetterSpacing: 0.2,
  ledeSize: 11.5,
  ledeLineHeightRatio: 1.6,
  /** 列表轴内衬（底部再补真机安全区） */
  listPaddingTop: 10,
  listPaddingX: 16,
  listPaddingBottom: 34,
  listGap: 2,
} as const

/* ================= 封面播放角标（.play-badge） ================= */

// 压在封面右下（歌单卡等共用）
export const PLAY_BADGE = {
  size: 24,
  /** 距封面右下偏移 */
  offset: 8,
  /** 图标尺寸与视觉居中补偿 */
  icon: 11,
  iconOffset: 1,
} as const

/* ================= 横向胶囊选择条（.rank-tabs / .cat-row） ================= */

// 胶囊选择条 / 分类行；cat-row 为贴屏边横滑的吸顶形态
export const CHIP_ROW = {
  gap: 7,
  marginTop: -2,
  marginBottom: 12,
  /** 2026-11-26 产品：分类条上下留白收紧（上 8 + 内 2 / 下 4） */
  catMarginTop: 8,
  /** RN 无外边距折叠，置 0，由后随 Section 的 26 提供唯一间距 */
  catMarginBottom: 0,
  catPaddingTop: 2,
  catPaddingBottom: 4,
} as const

/* ================= 横向滑动容器（.hscroll） ================= */

// 贴屏边横滑：左右各 16 内衬、gap 12
export const H_SCROLL = {
  gap: 12,
  paddingBottom: 2,
} as const

/* ================= 播放页 ================= */

// 播放浮层是「全屏页」而非右推层；顶栏 / 舞台 / 曲信息 / 进度 / 控制 / 工具行逐段提取
export const PLAYER = {
  /** 状态栏实测高度之上的留白 */
  paddingTopReserve: 4,
  paddingX: 22,
  paddingBottom: 32,
  /** 浮层上滑入场时长 */
  enterDuration: 460,
  /** 顶栏左右槽宽：返回钮复用 BUTTON.iconSize，右侧同宽保证标题居中 */
  topRightSlot: 34,
  crumbGap: 8,
  stagePaddingY: 16,
  /** 舞台横滑（唱片 ↔ 歌词）接管阈值：水平 ≥ 24 且 ≥ 垂直 × 1.5，避免误吞按钮点击；
   *  判定见 screens/Player/PlayerStageSwipe.ts 的 resolveStageSwipe */
  stageSwipeMinDx: 24,
  stageSwipeSlope: 1.5,
  /** 模糊不可用时的封面渐变降级底透明度 */
  bgOpacity: 0.45,
  /** 降级底渐变方向（近竖向略右斜） */
  bgStart: { x: 0.2, y: 0 },
  bgEnd: { x: 0.8, y: 1 },
  discSize: 206,
  /** 内圈刻纹环宽度与浓度 */
  discInnerRing: 8,
  discInnerRingAlpha: 0.35,
  /** 外圈 1px 高光浓度 */
  discRingAlpha: 0.1,
  /** 中心孔直径 = 盘径 × 0.24 */
  discHoleRatio: 0.24,
  discHoleAlpha: 0.55,
  discHoleRingAlpha: 0.12,
  /** 歌词上下渐隐带高度与最大衰减（RN 用作行透明度插值带宽） */
  lyricFadeHeight: 48,
  lyricFadeAlpha: 0.8,
  lyricPaddingX: 6,
  /** 非当前行行高与透明度（字号走 FONT_SIZE.bodyLg） */
  lyricLineHeight: 26,
  lyricOpacity: 0.75,
  lyricActiveSize: 17,
  /** 当前行阴影偏移与半径（颜色走 colors.lyricGlow） */
  lyricGlowOffsetY: 5,
  lyricGlowRadius: 22,
  /** 底部注记的上边距与透明度 */
  lyricNoteMarginTop: 14,
  lyricNoteAlpha: 0.8,
  metaGap: 12,
  artistMarginTop: 5,
  /** 收藏钮尺寸与图标 */
  favSize: 40,
  favIcon: 24,
  /** 来源行间距与上边距 */
  sourceGap: 7,
  sourceMarginTop: 10,
  /** 进度条尺寸与上下边距 */
  seekHeight: 5,
  seekRadius: 3,
  seekMarginTop: 24,
  seekMarginBottom: 8,
  /** 触区纵向外扩 14；横向不外扩，拖拽层必须与视觉条严格等宽，否则 location 映射会偏 */
  seekHitPadY: 14,
  /** 旋钮尺寸（主色光晕） */
  seekThumb: 11,
  /** 舞台指示点：未选中 5×5、当前态拉宽成 16 胶囊 */
  stageDotsGap: 6,
  stageDotsMarginTop: -4,
  stageDotsMarginBottom: 2,
  stageDotSize: 5,
  stageDotActiveWidth: 16,
  stageDotIdleOpacity: 0.28,
  /** 控制行：居中、间距与上边距 */
  controlsGap: 38,
  controlsMarginTop: 18,
  /** 控件尺寸；主行只剩 ghost/main 两类，tool 度量仅供变体引用 */
  pcSize: 46,
  pcGhostIcon: 27,
  pcToolIcon: 21,
  pcToolLabelSize: 9.5,
  pcToolGap: 2,
  /** 主控件尺寸与图标 */
  mainSize: 64,
  mainIcon: 27,
  /** 工具行：两端对齐、间距与上边距 */
  toolsGap: 2,
  toolsMarginTop: 14,
  /** 纯图标工具钮：无圆角底、无文字 */
  ptPaddingY: 9,
  ptPaddingX: 2,
  ptIcon: 21,
  /** 按压缩放档 */
  pcPressScale: 0.93,
  ptPressScale: 0.94,
  favPressScale: 0.93,
} as const

/* ================= LRC 浮窗 ================= */

// App 内可拖动歌词气泡的视觉与拖动边界 / 点按判定；token 与视觉件 components/LrcFloat 留存备用
export const LRC_FLOAT = {
  /** 初始位置（窗口绝对坐标） */
  initialLeft: 16,
  initialTop: 520,
  maxWidth: 236,
  paddingTop: 9,
  paddingRight: 10,
  paddingBottom: 9,
  paddingLeft: 12,
  /** 与 RADIUS.card 同值但语义不同，就近定义 */
  radius: 22,
  gap: 8,
  /** 行文字：字号 / 行高 / 最大宽度 */
  lineSize: 12.5,
  lineHeight: 16.25,
  lineMaxWidth: 160,
  /** 来源圆点与同色光晕；RN 用 shadow* 近似，elevation 作 Android 兜底 */
  srcDot: 7,
  srcGlow: 9,
  srcGlowElevation: 6,
  /** 关闭钮尺寸 / 透明度 / 按压缩放 */
  closeSize: 19,
  closeIcon: 12,
  closeOpacity: 0.6,
  closePressScale: 0.85,
  /** 拖动态放大与回弹时长（与 MOTION.toggle 同值但语义不同） */
  dragScale: 1.05,
  scaleDuration: 280,
  /** 拖动边界（左右各 8；上 56 / 下 96） */
  boundLeft: 8,
  boundRight: 8,
  boundTop: 56,
  boundBottom: 96,
  /** 峰值位移 < 4px 判为点按 */
  tapSlop: 4,
} as const

/* ================= 迷你播放条 ================= */

export const MINIBAR = {
  height: 58,
  radius: 20,
  marginX: 12,
  /** 距 Tab 栏上沿再抬 6 */
  gapAboveTabBar: 6,
  /** 进度条高度（底色走 glassStrong） */
  progressHeight: 2,
  paddingX: 12,
  gap: 11,
  artSize: 42,
  artRadius: 11,
  /** 副行间距 / 分隔条尺寸 */
  subGap: 6,
  subMarginTop: 2,
  sepWidth: 1,
  sepHeight: 9,
  /** 按钮尺寸与图标；主钮图标小一号 */
  actSize: 34,
  actIcon: 19,
  primaryIcon: 17,
  pressScale: 0.9,
  /** 拖拽中整条微透，交回过渡时复原 */
  dragOpacity: 0.94,

  /* ---- 磁吸圆点 ----
   * 完整条与圆点是同一只条的两形态：圆点为「正圆 + 离屏边 3」，点一下展开回完整条。 */
  /** 圆点直径（宽屏一档 52；无 Pad 档） */
  snappedSize: 56,
  snappedSizeWide: 52,
  /** 圆点外缘离屏边的一线（不把投影与进度弧切掉） */
  snappedEdge: 3,
  /** 圆点内边距；封面 = 直径 − 8 */
  snappedArtInset: 4,
  /** 贴外缘的 2px 进度环带 */
  snappedRingWidth: 2,
  /** 完整条状态标三柱的度量（暂未落地，勿删） */
  snappedEqHeight: 11,
  snappedEqGap: 1.5,

  /* ---- 贴边态那张「在转的 CD」----
   * 碟面 = 封面（直径 − 8）上压四层光学件：中心孔 / 两道同心纹 / 一道柔光带 / 碟沿。
   * 四层压在封面上，深浅两套同值；颜色只登记浓度，基色取 ART_INK，不进色板。 */
  /** 一圈 12s 匀速（播放页大碟 22s） */
  cdSpinMs: 12000,
  /** 孔直径 = 碟径 × 24%（与 PLAYER 同源） */
  cdHoleRatio: 0.24,
  /** 孔底浓度（与大碟同值） */
  cdHoleAlpha: 0.55,
  /** 孔内 1px 高光浓度 */
  cdHoleRingAlpha: 0.12,
  /** 两道同心纹的线色浓度 */
  cdGrooveAlpha: 0.09,
  /** 两道纹的半径占碟半径的比例，线宽各 1px */
  cdGrooveInnerRatio: 0.62,
  cdGrooveOuterRatio: 0.84,
  cdGrooveWidth: 1,
  /** 碟沿 1px 浓度（不同于圆点的外圈描边） */
  cdRimWidth: 1,
  cdRimAlpha: 0.18,
  /** 柔光带三段透明度与位置；基色取 ART_INK.fg 合成（Android 的 transparent 会带出灰黑） */
  cdSheenAlphas: [0, 0.2, 0],
  cdSheenStops: [0.24, 0.44, 0.64],
  cdSheenStart: { x: -0.1, y: 0.22 },
  cdSheenEnd: { x: 1.1, y: 0.78 },
  /** 暂停时孔里的静三角：容器 11、图标 7、墨色取 ART_INK.fg */
  cdMarkSize: 11,
  cdMarkIcon: 7,
  /** 静三角的视觉居中补偿 */
  cdMarkIconOffset: 1,
  /** 两态互相变形时长；切 Tab / 进出推入层时一帧落位 */
  morphMs: 180,
  /** 手势三段：<8 点击 / 8–24 弹回 / ≥24 吸附 */
  slop: 8,
  commit: 24,
  /** 完整条拖动的最大余量 */
  pull: 22,
  /** 拖动余量压缩比 */
  pullDamp: 0.45,
  /** 吸附 / 变形缓动 */
  snapEasing: [0.3, 0.72, 0.2, 1],
  /** 圆点里封面的透明度（深 / 浅） */
  snappedArtAlpha: { dark: 0.7, light: 0.76 },
} as const

/* ================= 底部浮层 ================= */

// 实现为「所在屏幕根 View 内的 absolute-fill 覆盖层」（见 components/Sheet）
export const SHEET = {
  maskAlpha: 0.55,
  /** 遮罩真模糊半径；模糊不可用时退回纯 .55 黑 */
  maskBlur: 3,
  /** 顶部圆角 28；底部取 0（真机面板贴物理屏底边，圆角由硬件承担） */
  radiusTop: 28,
  radiusBottom: 0,
  paddingTop: 8,
  paddingX: 20,
  paddingBottom: 30,
  /** 滚动上限：窗口高的 78% */
  maxHeightRatio: 0.78,
  /** 拖拽把手尺寸与上下边距 */
  handleWidth: 36,
  handleHeight: 4,
  handleRadius: 2,
  handleMarginTop: 6,
  handleMarginBottom: 14,
  /** 副标题行高（12.5 × 1.6 = 20） */
  subMarginTop: 5,
  subLineHeight: 20,
  /** 浮层内通用行面板（底 chip / 描边 line） */
  rowPaddingY: 12,
  rowPaddingX: 14,
  rowRadius: 14,
  rowGap: 12,
  /**
   * 动效：入 280ms / 出 260ms，遮罩与体贴共用同一条曲线、同起同止。
   * 400ms 在真机上偏长——位移铺得越开，遮罩「加深」这段就越容易被眼睛捕捉到。
   */
  bodyDuration: 280,
  exitDuration: 260,
  /** 触底判定距离（px，近似 FlatList 的比例语义） */
  endReachThreshold: 300,
  /** 浮层虚拟化回收参数：视口最高 78% 窗口高，首屏略有余、批间不空窗 */
  listInitialNumToRender: 8,
  listMaxToRenderPerBatch: 6,
  listWindowSize: 7,
  /** 底部补偿：overflow:hidden 下最后一项贴底可能被裁，保守留一行高度 */
  listBottomCompensation: 100,
} as const

/* ================= 二次确认浮层 ================= */

export const CONFIRM_SHEET = {
  actionsGap: 10,
  actionsMarginTop: 20,
  btnHeight: 44,
  btnRadius: 15,
  btnFontSize: 14,
  pressScale: 0.98,
} as const

/* ================= 提示胶囊 ================= */

// 深色贴片胶囊；颜色走 glassPatch 家族（不进本块），字号引用 FONT_SIZE.smallLg
export const TOAST = {
  paddingY: 10,
  paddingHorizontal: 16,
  /** 数值与 RADIUS.control 同但语义不同，就近定义 */
  radius: 14,
  fontWeight: '600',
  /** 最大宽度：窗口宽 78% */
  maxWidthRatio: 0.78,
  /** 距底距离（RN 侧另加实测底部安全区） */
  bottomGap: 168,
  /** 未示出时的下沉位移 */
  riseOffset: 14,
  /** 进出场过渡时长 */
  animDuration: 320,
  /** 默认停留时长 */
  visibleMs: 2000,
  /** 长文案档：对齐 Android 长 Toast 的量级，避免长句读不完 */
  visibleMsLong: 3500,
  /** 阴影：负 spread 无法表达，降 opacity 近似 */
  shadowColor: '#000000',
  shadowOffsetY: 16,
  shadowRadius: 40,
  shadowOpacity: 0.5,
  elevation: 10,
} as const

/* ================= 评论行 ================= */

export const COMMENT = {
  /** 总标题：间距与下边距 */
  totalGap: 8,
  totalMarginBottom: 2,
  /** 评论项：间距、纵向内边距、顶部分隔线 */
  itemGap: 11,
  itemPaddingY: 13,
  avatarSize: 34,
  /** 正文行 / 点赞区的间距与图标 */
  lineGap: 8,
  likeGap: 4,
  likeIcon: 13,
  /** 元信息行内元素间距 */
  metaGap: 6,
  /** 正文上边距与行高 */
  textMarginTop: 4,
  textLineHeight: 20,
  /** 引用块内边距与圆角（底走 chip） */
  replyMarginTop: 7,
  replyPaddingY: 8,
  replyPaddingX: 10,
  replyRadius: 10,
  /* ---- 回复层级 ---- */
  /** 每级缩进 */
  replyIndent: 12,
  /** 线程竖线宽（1px 在深底上几乎不可见） */
  threadRuleWidth: 2,
  threadMarginTop: 6,
  /** 回复呈现深度上限：数据最深 2 级，3 为防御余量；超限回复平铺显示 */
  maxReplyDepth: 3,
  /** 分页状态行内边距 */
  morePadding: 10,
} as const

/* ================= 搜索层 ================= */

// 转场与歌单详情层同源（右推 .44s），RN 用 RNN push + elementTransitions translationX 复刻
export const SEARCH = {
  /** 右推转场时长 */
  enterDuration: 440,
  /** 状态栏实测高度之上的留白 */
  statusBarReserve: 2,
  paddingX: 14,
  paddingBottom: 12,
  gap: 10,
  /** 搜索框度量（输入字号走 FONT_SIZE.title） */
  boxHeight: 40,
  boxRadius: 13,
  boxPaddingX: 11,
  boxGap: 9,
  boxIcon: 16,
  /** 聚焦描边宽度与浓度 */
  focusRingWidth: 1.5,
  focusRingAlpha: 0.5,
  /** 清除钮尺寸与图标 */
  clearSize: 18,
  clearIcon: 10,
  cancelPaddingY: 6,
  bodyPaddingX: 16,
  bodyPaddingBottom: 40,
  /** Tab 条内衬与指示条尺寸 / 位置 */
  tabsGap: 22,
  tabsPaddingTop: 6,
  tabsPaddingX: 16,
  tabsPaddingBottom: 9,
  tabIndicatorWidth: 17,
  tabIndicatorHeight: 3,
  tabIndicatorRadius: 2,
  tabIndicatorPad: 5,
  /** Tab 计数：左距与透明度 */
  tabCountMarginLeft: 5,
  tabCountOpacity: 0.65,
  labelMarginTop: 18,
  labelMarginBottom: 10,
  clearWordIcon: 13,
  /** 热词流间距（同 CHIP_FLOW） */
  wordsGap: 8,
  emptyPaddingY: 46,
  emptyLineHeight: 24,
  hintMarginTop: 16,
} as const

/* ================= 歌单详情层 ================= */

// 「右推整页 + 层内整体滚动」：顶排 / hero / 操作排都在滚动内容里，用 FlatList 的
// ListHeaderComponent 承载（见 screens/SonglistDetail）
export const PL_LAYER = {
  /** 右推转场时长（与 SEARCH 同源） */
  enterDuration: 440,
  /** 状态栏实测高度之上的留白 */
  paddingTopReserve: 6,
  paddingX: 16,
  paddingBottom: 34,
  /** 背景降级为封面渐变（blur 不可用），必须走 CoverWash：压在内容下、不吃触摸、下沿渐隐 */
  bgHeightRatio: 0.56,
  bgAlpha: 0.42,
  heroMarginTop: 22,
  heroMarginBottom: 2,
  heroMinHeight: 124,
  heroGap: 14,
  /** 封面尺寸（圆角走 RADIUS.art；外投影负 spread 无法表达，取 SHADOW.card 近似） */
  heroArtSize: 124,
  /** 标题区：间距与两行行高比例 */
  heroBodyGap: 6,
  heroTitleLineHeightRatio: 1.35,
  heroSubLineHeightRatio: 1.5,
  /** 元信息间距与分隔条 */
  metaGap: 6,
  metaSepWidth: 1,
  metaSepHeight: 9,
  /** 操作排：上下边距与间距（icon-btn 走 BUTTON.iconSizeLg） */
  actionsMarginTop: 18,
  actionsMarginBottom: 16,
  actionsGap: 8,
} as const

/* ================= 选项行 ================= */

// 「单选列表浮层」通用行：底 chip、描边 line（已知近似）；选中态渐变走 GRADIENTS.brandSoft
export const OPTION_ROW = {
  /** 组标题：字号 / 字距 / 上下边距 */
  labelSize: 10.5,
  labelLetterSpacing: 1.3,
  labelMarginTop: 20,
  labelMarginBottom: 9,
  /** 组名与右槽折叠开关的间距 */
  labelFoldGap: 10,
  listGap: 7,
  /** 行内间距与内衬 */
  gap: 11,
  paddingY: 11,
  paddingX: 12,
  radius: 15,
  /** 选中描边（RN 无 inset，转 1px 实描边） */
  onBorderColor: 'rgba(255, 92, 138, 0.34)',
  /** 置灰态透明度 */
  offAlpha: 0.42,
  /** 单选圈：尺寸与环宽（走随主题反相的 hairline-strong） */
  radioSize: 18,
  radioRingWidth: 1.6,
  /** 选中态主色半径；中心留 6 亮环 */
  radioFill: 6,
  radioCenterRingWidth: 1.6,
  /** 正文区：行距 / 版本行距 */
  bodyGap: 3,
  versionGap: 6,
  /** 状态语：间距与前置圆点 */
  stateGap: 5,
  stateDotSize: 6,
  /** 图标底：尺寸 / 圆角 / 图标（底 glass、描边 line） */
  iconBoxSize: 30,
  iconBoxRadius: 10,
  iconBoxIcon: 16,
  pressScale: 0.99,
} as const

/* ================= 设定页分组行 ================= */

// 底 chip、描边 line、按压态 press（近似）；选中行渐变走 GRADIENTS.brandSoft。
// .sg-label 与 .group-label 度量一致，共通组件 GroupLabel 直接复用。
export const SETTINGS = {
  heroMarginTop: 8,
  heroMarginX: 2,
  heroMarginBottom: 2,
  /** 副文案字号与行高 */
  heroSubSize: 12,
  heroSubLineHeight: 20,
  /** 分组上边距（手机端取主规则） */
  groupMarginTop: 26,
  /** 左距；下距由 GroupLabel 自带 */
  groupLabelMarginLeft: 3,
  /** 行内间距与内衬 */
  rowGap: 11,
  rowPaddingY: 13,
  rowPaddingX: 14,
  /** 图标底：尺寸 / 圆角 / 图标 */
  iconBoxSize: 28,
  iconBoxRadius: 9,
  iconGlyphSize: 15,
  bodyGap: 2,
  /** 数值与 FONT_SIZE.rank 同但语义不同，就近定义 */
  titleSize: 14,
  titleLetterSpacing: 0.1,
  hintSize: 11,
  hintLineHeight: 16,
  /** 右值区：间距 / 字号 / 图标与透明度 */
  valueGap: 4,
  valueSize: 12,
  valueIconSize: 14,
  valueIconAlpha: 0.5,
  /** 可点行按压底色补间 .18s：本族唯一一档，不能套 MOTION.fast */
  rowPressMs: 180,
} as const

/* ================= 单曲操作面板头部 ================= */

// 「封面 + 歌名 + 平台徽标 + 歌手 · 专辑」信息排；歌名走 FONT_SIZE.title，副行走 captionLg
export const MORE_SONG = {
  gap: 11,
  paddingB: 13,
  marginB: 13,
  artSize: 44,
  artRadius: 11,
  /** 副行上边距与徽标间距 */
  subMarginTop: 3,
  subGap: 6,
} as const

/* ================= 输入行 ================= */

// 「打开歌单」贴链接输入行，音源浮层的「导入音源」复用；输入底 glass、描边 line
export const OP_BOX = {
  gap: 9,
  marginTop: 16,
  height: 42,
  inputRadius: 13,
  inputPaddingX: 14,
  /** 聚焦描边（同 SEARCH） */
  focusRingWidth: 1.5,
  focusRingAlpha: 0.5,
  goRadius: 13,
  goPaddingX: 18,
  goPressScale: 0.955,
  /** 本族最快的一档，比 MOTION.fast 还短 40ms */
  goPressMs: 160,
  errMarginTop: 10,
  errLineHeight: 19,
} as const

/* ================= 本机导入钮 ================= */

// 「从本机选择音源文件」的次级整宽钮：与 .op-go 同族但降一档（无渐变、无投影）
export const OP_FILE = {
  marginTop: 9,
  height: 40,
  radius: 13,
  gap: 6,
  iconSize: 15,
  pressScale: 0.99,
} as const

/* =================「修改」浮层的头像一行 ================= */

// 左：64 圆预览（走共通件 BrandAvatar）；右：两枚次级钮上下叠（选图 / 改回昵称首字）
export const AVATAR_ROW = {
  gap: 14,
  marginTop: 16,
  previewSize: 64,
  /** 首字字号（字重 / 字距沿用全局 token） */
  previewFontSize: 24,
  /** 右列两钮上下间距 */
  actsGap: 8,
} as const

/* ================= 行尾移除钮 ================= */

// 只在带移除动作的列表行出现；常态 text-3，按下转 dangerInk（不做常驻红钮）
export const OR_DEL = {
  size: 28,
  radius: 9,
  iconSize: 14,
  pressScale: 0.9,
  /** RN 触控放大：28×28 低于系统最小热区，外扩 6 补足 */
  hitSlop: 6,
} as const

/* ================= 列表折叠开关 ================= */

// 组标题右侧：文字 + 一颗 chevron，靠旋转分收合两态（RN 与 CSS rotate 同为顺时针）
export const FOLD_TOGGLE = {
  gap: 2,
  /** 扩热区不改布局；竖向留 padding，横向交给 hitSlop */
  hitPadding: 2,
  fontSize: 11,
  iconSize: 13,
  iconAlpha: 0.7,
  /** 两态箭头角 */
  iconAngleCollapsed: '90deg',
  iconAngleExpanded: '270deg',
} as const

// 列表尾「还有 N 个音源没显示」行：整行可点，与开关同一动作
export const FOLD_MORE = {
  paddingY: 9,
  paddingX: 12,
  radius: 13,
  fontSize: 11.5,
  pressScale: 0.99,
} as const

/* ================= 换行胶囊组 ================= */

export const CHIP_FLOW = {
  /** 两处同为 flex-wrap gap 8，合并一个度量 */
  gap: 8,
} as const

/* ================= 字体 ================= */

export const FONT_SIZE = {
  /** 最小字：来源角标 */
  micro: 9.5,
  /** 极小字：标签 */
  tiny: 10.5,
  /** 说明文字 */
  caption: 11,
  /** 说明文字大号 */
  captionLg: 11.5,
  small: 12,
  smallLg: 12.5,
  body: 13,
  bodyLg: 13.5,
  /** 排名数字 */
  rank: 14,
  /** 歌曲标题 / 搜索输入 */
  title: 14.5,
  /** 状态栏时间 */
  status: 15,
  /** 面板标题 */
  titleLg: 15.5,
  /** 区段小标题 */
  headingSm: 16,
  /** 统计数字 */
  statValue: 17,
  /** 区块标题 */
  heading: 18,
  /** 区段大标题 */
  headingLg: 19,
  /** 浮层大标题 */
  sheetTitle: 20,
  /** 播放页曲名 */
  playerTitle: 21,
  /** 昵称 */
  mineName: 20,
  /** 页面大标题 */
  display: 22,
  /** 歌单 / 排行 / 设定页大标题 */
  displayLg: 24,
  /** 头像首字 */
  mineInitial: 26,
} as const

export const FONT_WEIGHT = {
  medium: '500',
  semibold: '600',
  bold: '700',
  extraBold: '800',
  black: '900',
} as const

/** 字距（对应 CSS letter-spacing） */
export const LETTER_SPACING = {
  tight: 0.2,
  normal: 0.3,
  wide: 0.4,
  wider: 0.5,
  kicker: 1,
  kickerWide: 1.6,
} as const

/* ================= 动效 ================= */

// --ease: cubic-bezier(.22,.61,.36,1)；时长取自各 transition / animation
export const MOTION = {
  /** 交互反馈（按压缩放等） */
  fast: 200,
  /** 常规过渡 */
  base: 220,
  /** 页面 / 状态切换（顶栏吸顶、浮层） */
  slow: 300,
  /** 开关轨道与旋钮 */
  toggle: 280,
  /** 呼吸灯周期 */
  pulse: 2200,
  /** 正在播放均衡条周期 */
  eq: 1000,
  /** 唱片自转一圈 */
  discSpin: 22000,
  /** 标准缓动曲线（Easing.bezier 参数） */
  easing: [0.22, 0.61, 0.36, 1],
  /** ScrollView.onScroll 事件节流（ms），分页触底检测用 */
  scrollThrottle: 16,
  /** 封面图加载完成的淡入（ms）：CSS 为硬切，RN 补一层短淡入，避免换脸感 */
  artFade: 170,
  /** 整块内容替换的状态档切换淡入（ms）：只在状态档变化时触发，同档刷新不重放 */
  contentFade: 120,
} as const

/* ================= 阴影 ================= */

// CSS box-shadow 含负 spread，RN 无法完全表达，取视觉近似；
export const SHADOW: Record<
  'card' | 'float' | 'knob' | 'chrome' | 'glow' | 'playerMain' | 'miniPrimary' | 'lrcFloat' | 'ghostSolid',
  ShadowSpec
> = {
  /** 卡面投影（负 spread，降 opacity 近似） */
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 36,
    elevation: 10,
  },
  /** 迷你条上抛投影（负 spread 近似） */
  float: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 14,
  },
  /** 开关旋钮（blur 6 → radius 3） */
  knob: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  /** 顶栏吸顶投影（负 spread 近似） */
  chrome: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 13,
    elevation: 6,
  },
  /** 主色光晕（Tab 指示条） */
  glow: {
    shadowColor: '#FF5C8A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  /** 播放主钮投影（负 spread 近似） */
  playerMain: {
    shadowColor: '#FF5C8A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 10,
  },
  /** 迷你条主钮投影 */
  miniPrimary: {
    shadowColor: '#FF5C8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 6,
  },
  /** LRC 浮窗投影（负 spread 近似） */
  lrcFloat: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 10,
  },
  /** 幽灵实心钮投影（radius 28−16=12，alpha 降档） */
  ghostSolid: {
    shadowColor: '#FF5C8A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
}

/* ================= 派生度量（需实际状态栏 / 安全区高度） ================= */

/**
 * 顶栏总高 = 实测状态栏 + 留白 + 行高 + 下内衬；顶栏高度与滚动内容上留白共用此值。
 * 宽屏档传入 wideStructuralOf 的结果，用其中的 statusReserve 替换竖屏档。
 */
export const topbarHeight = (statusBarHeight: number, wide?: WideStructural): number =>
  statusBarHeight + (wide?.statusReserve ?? TOP_BAR.statusBarReserve) + TOP_BAR.rowHeight + TOP_BAR.paddingBottom

/**
 * 轻量宽屏三档：判据为屏内宽（RN 窗口宽即屏内宽，阈值 600 / 840，换算见 WIDE）。
 * compact 即手机竖屏档。
 */
export type WideTier = 'compact' | 'medium' | 'expanded'

/** 屏内宽 → 档位 */
export const wideTierOf = (windowWidth: number): WideTier => {
  if (windowWidth < WIDE.compactUpper) return 'compact'
  return windowWidth < WIDE.mediumUpper ? 'medium' : 'expanded'
}

/** 该档的栅格列数 */
export const wideColumnsOf = (windowWidth: number): number => {
  switch (wideTierOf(windowWidth)) {
    case 'medium': return WIDE.mediumColumns
    case 'expanded': return WIDE.expandedColumns
    default: return CARD_GRID.columns
  }
}

/** 该档的栅格间隙；compact 返回 undefined = 继续吃 CARD_GRID 基线 */
export const wideGridGapOf = (windowWidth: number): { rowGap: number, columnGap: number } | undefined => {
  switch (wideTierOf(windowWidth)) {
    case 'medium': return { rowGap: WIDE.mediumRowGap, columnGap: WIDE.mediumColumnGap }
    case 'expanded': return { rowGap: WIDE.expandedRowGap, columnGap: WIDE.expandedColumnGap }
    default: return undefined
  }
}

/** 该档的内容盒限宽；compact 返回 undefined = 不限宽 */
export const wideContentMaxWidthOf = (windowWidth: number): number | undefined =>
  wideTierOf(windowWidth) === 'compact' ? undefined : WIDE.contentMaxWidth

/**
 * 该档的结构度量覆盖（medium / expanded 共用）；compact 返回 undefined，
 * 消费侧写 `wide?.xxx ?? 竖屏基线 token`。返回模块级同一对象引用，memo 不失效。
 */
export const wideStructuralOf = (windowWidth: number): WideStructural | undefined =>
  wideTierOf(windowWidth) === 'compact' ? undefined : WIDE_STRUCTURAL

/**
 * 单列行屏「620 居中轴」的左右内衬 = max(16, (窗口宽 − 620) / 2)；
 * 窄于 620 时退回 16，compact 返回 undefined = 吃竖屏基线 16。
 */
export const wideLayerPaddingXOf = (windowWidth: number): number | undefined =>
  wideTierOf(windowWidth) === 'compact'
    ? undefined
    : Math.max(LAYOUT.screenPaddingX, (windowWidth - WIDE.contentMaxWidth) / 2)

/**
 * 内容盒实际宽 = min(窗口宽, 620)；「按屏宽算尺寸」的派生度量都先过这一道，
 * 卡片才不会在限宽居中的盒里按整屏宽铺开（compact 为恒等映射）。
 * 净宽 = 盒宽 − 两侧 16，620 的盒给 588。
 */
export const wideContentWidth = (windowWidth: number): number => {
  const maxWidth = wideContentMaxWidthOf(windowWidth)
  return maxWidth === undefined ? windowWidth : Math.min(windowWidth, maxWidth)
}

/**
 * 网格单卡宽 = (盒宽 − 两侧内衬 − 列间隙 × (列数 − 1)) / 列数。
 * 入参为窗口宽，盒宽换算在函数内先做，保证行总宽不溢出。
 */
export const gridItemWidth = (windowWidth: number, columns: number, columnGap: number): number =>
  (wideContentWidth(windowWidth) - LAYOUT.screenPaddingX * 2 - columnGap * (columns - 1)) / columns

/* ================= 品牌首字头像（.avatar-btn .avatar / .mh-art 共通化） ================= */

/**
 * 顶栏头像与「我的」页头部共用同一视觉：品牌渐变圆底 + 居中首字。
 * 直径与字号引用既有 token，渐变取 GRADIENTS.art，字色取 onGradient。
 * 放在文件末尾：需引用 FONT_SIZE。
 */
export const BRAND_AVATAR = {
  /** 1px 描边（两处统一；浅色主题自动反转为深字色描边） */
  ringWidth: 1,
  /** 两处预设：直径与字号引用既有 token */
  top: {
    size: TOP_BAR.avatarSize,
    textSize: TOP_BAR.avatarTextSize,
  },
  mine: {
    size: MINE.headArtSize,
    textSize: FONT_SIZE.mineInitial,
  },
} as const
