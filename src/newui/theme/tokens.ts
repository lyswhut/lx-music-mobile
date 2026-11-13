/**
 * 新 UI 设计 token（唯一数据源）
 * 深色取值精确提取自 new_design/styles.css（:root 与规则内散落值）；
 * 浅色取值精确提取自 new_design/styles.css 的 .phone.light 档（原型改版后已给双套 token）；
 * 早期自造、原型没有同名物的浅色键已在审计轮整组删除（QA D80），组件一律从这里取，不得再自造。
 * 组件内禁止硬编码色值 / 尺寸，一律从这里取。
 */
import type { GlassLayerSpec, GradientSpec, ShadowSpec, ThemeColors, ThemeScheme } from './types'

/* ================= 色板 ================= */

// 深色即原型本体；浅色保持 brand 渐变与语义色不变，重排 bg/surface/text 层级（浅底深字）
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
    /* 语义化填充 / 描边 / 贴片（styles.css :root L18-28，照抄不改透明度）；
       组件侧已全部走这一套与原型同名的 token，旧自造 key（glass / glassStrong / glassBorder /
       press / overlay…）随之整组删除，浅色档不再留非原型来源的值（QA D80） */
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
    /* .ln.on text-shadow 0 5px 22px rgba(0,0,0,.55)（styles.css L612）；
       浅色 .phone.light .ln.on 单独覆盖为 rgba(21,22,28,.22)（L1171）——
       原型注释明言这是「同一语义浅底要换值、无法反相表达」的真差异，故两套各留一档。
       QA D77（2026-10-16 审计轮）：这组四项数值回到原型原值，不再自降浓度。
       遗留风险照实记一句：2026-10-15 曾报「正在演播的歌词行背景丑」，RN（Android）的文字阴影
       按半径逐像素涂抹，22 大半径可能糊成当前行身后可见暗斑；本轮按「原型即真相」恢复数字，
       真机若确实脏，改的是这条口径记录而不是偷偷改值 */
    lyricGlow: 'rgba(0, 0, 0, 0.55)',
    /* 磁吸圆点那一族（原型 :root L27-35）。与上面 glassPatch 同属「浮在内容上的贴片」，
       但圆点要透出底下的字，所以底色薄一档（.30 对 .74），另配外圈进度弧底 / 发丝描边两样。
       逐值照抄，深浅两套各一档（浅色 .phone.light L1506-1512 单项覆盖）。
       2026-10-26：正中那颗 22px 毛玻璃状态标被 CD 碟面取代（播放中不显示、暂停只在孔里落一枚
       7px 白三角），原型 --mini-mark-bg / -ink / -line 三键在 RN 侧从此无消费点，整组删除；
       完整条原本就不画这枚标（原型 base 规则本身就是 opacity:0 + visibility:hidden）。 */
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
    /* 语义化填充 / 描边 / 贴片（styles.css .phone.light L1137-1146，照抄不改透明度）；
       card 浅色为实心白 #FFFFFF（页面灰底 + 白卡，iOS 分组列表式），dangerInk 浅底反相为深红 */
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
    /** 同 dark 档注释：原型 .phone.light .ln.on 为 rgba(21,22,28,.22)（styles.css L1171，QA D77） */
    lyricGlow: 'rgba(21, 22, 28, 0.22)',
    /* 磁吸圆点那一族浅色档（.phone.light L1506-1512）：底换成白色薄纱、外圈弧与描边换成深墨。
       圆点外框在浅底上靠 miniDotLine 站住轮廓。
       2026-10-26 同 dark 档：--mini-mark-* 三键随 22px 状态标退役整组删除。
       CD 碟面那四层（孔 / 纹 / 柔光 / 碟沿）不在此处——它们压在封面图上，两套主题同值，见 ART_INK 与 MINIBAR.cd*。 */
    miniVeil: 'rgba(255, 255, 255, 0.26)',
    miniRing: 'rgba(21, 22, 28, 0.16)',
    miniDotLine: 'rgba(21, 22, 28, 0.16)',
  },
}

/* ================= 渐变 ================= */

// CSS 角度 → RN start/end 近似：120deg 用 (0,.25)→(1,.75)，135deg 用对角
export const GRADIENTS = {
  /** 主色渐变 --grad：120deg #FF5C8A → #C04CE8(48%) → #7A3BFF */
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
  /** 封面 / 头像对角渐变（135deg，实际渲染时用具体 c1 / c2 替换首尾色） */
  art: {
    colors: ['#FF5C8A', '#7A3BFF'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  /** 「我的」页头像底 .mh-art：150deg brand → brand-2（近竖向，略斜），RN 用 (0.25,0)→(0.75,1) 近似 */
  headArt: {
    colors: ['#FF5C8A', '#7A3BFF'],
    start: { x: 0.25, y: 0 },
    end: { x: 0.75, y: 1 },
  },
} as const satisfies Record<string, GradientSpec>

/* ================= 平台色（提取自 data.js） ================= */

/** 五平台品牌 tint，用于来源角标 / 榜单卡（.sr-src / .rk-card） */
export const PLATFORM_TINTS = {
  tx: '#31C27C',
  wy: '#E4413F',
  kw: '#12B7F5',
  kg: '#3FBCB4',
  mg: '#FF6FA5',
} as const

export type PlatformTintKey = keyof typeof PLATFORM_TINTS

/** 封面占位渐变组（data.js ART_PALETTES 原样收敛） */
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
 * 「压在封面图 / 渐变底上」的中性色，浅深两套共用。
 * 封面本身永远是深底（渐变或照片），这层色不随主题反转，所以不进色板，
 * 但也不许散在组件里 —— 对应原型 .art .ic-center、.play-badge、.banner .veil、.b-tag、.wip-tag 里的字面量。
 */
export const ART_INK = {
  /** 前景白：占位图标、角标图标、图上文字 */
  fg: '#FFFFFF',
  /** 遮罩基色黑：.veil / .art-scrim / .play-badge 底 */
  veil: '#000000',
  /** .wip-tag 底基色 rgba(8,8,12,.55) */
  wip: '#08080C',
  /** .play-badge 底色浓度 */
  badgeAlpha: 0.45,
  /** .b-tag 底 / .play-badge 描边浓度（rgba(255,255,255,.18)） */
  chipAlpha: 0.18,
  /** .art-scrim 中间档浓度（rgba(0,0,0,.04) 46% 处） */
  scrimMidAlpha: 0.04,
  /** .wip-tag 底色浓度 */
  wipAlpha: 0.55,
} as const

/* ================= 圆角 ================= */

// --r-s/m/l/xl = 12/18/24/30；其余为规则内实际用量
export const RADIUS = {
  /** .tab.is-active::before 指示条等 2px 小圆角 */
  dot: 2,
  /** .sr-src 来源角标 */
  tagXs: 5,
  /** .q-tag 音质标签 */
  tagSm: 7,
  /** .b-tag / 日期胶囊 */
  tag: 8,
  /** .song-row .art 封面 */
  artXs: 10,
  /** --r-s 基础卡面 */
  s: 12,
  /** .chip / .song-row / .ghost-btn */
  control: 14,
  /** .pl-open-btn / .mh-edit */
  pill: 16,
  /** --r-m .set-list */
  m: 18,
  /** .searchbar */
  search: 19,
  /** .quick .qa / .pl-hero .art */
  art: 20,
  /** .fav-card */
  card: 22,
  /** --r-l .banner */
  l: 24,
  /** --r-xl */
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

// 与 styles.css 的 .topbar / .viewport 对齐，页面滚动容器的基准
// 顶栏高度与内容上留白不写死：原型 padding-top 54 / viewport padding-top 110 含 52px 模拟状态栏，
// 真机状态栏需实测，统一用文件末尾的 topbarHeight(topInset) 计算
export const LAYOUT = {
  /** 页面左右内边距（.page padding:0 16px） */
  screenPaddingX: 16,
  /** 区块垂直间距（.section margin-top:26px） */
  sectionGap: 26,
  /** 滚动内容末尾与 Tab 栏之间的留白：.viewport padding-bottom 168 减去 --safe-b 22 与 Tab 栏 60 */
  contentGapAboveTabBar: 86,
} as const

/* ================= 层叠台阶 ================= */

/**
 * 少数「必须压在滚动内容之下 / 之上」的层用的层叠数（RN `zIndex`）。
 * RN 在 Android 侧由 ReactViewGroup 自己按 zIndex 重排子视图的绘制与命中顺序
 * （父节点没有 zIndex 时按声明顺序稳定排序），走的是 RN 自己的层级实现，
 * 不是系统 `elevation`，所以不会额外画出一圈阴影。
 * 数值照抄原型 styles.css 的 z-index 事实：
 * `.pl-bg` / `.player-bg` 0（L403 / L513）、`.pl-layer>*` / `.player-layer>*` 1（L404 / L514）、
 * `.topbar` 40（L87）、`.lrc-float` 75（L667）、`.sheet` 80（L653）。
 * 口径：**只有真出过问题的少数层用**——封面氛围底纹、吸顶顶栏、常驻悬浮迷你播放条、
 * 全屏底部浮层；其余兄弟节点仍按声明顺序，不给无关组件加 zIndex（Tab 栏不在这里：
 * 它在页面布局流里与内容几何互不重叠，加层叠数只会掩盖真实层级）。
 * 背景：真机走查（2026-10-12）报的「详情上半部像有一层顶层蒙板且心钮点不动」
 * 「首页切到榜单 tab 后歌名压住信号栏」都是靠声明顺序赌平台绘制顺序翻车造成的；
 * 「首页 Minibar 背景透明和背后内容重叠」同属一族——Minibar 是绝对定位浮在滚动内容
 * 之上的悬浮件，没有显式层叠数时 Android 侧可能被列表内容盖住自身不透明底。
 */
export const Z_LAYER = {
  /** 封面氛围底纹（原型 .pl-bg / .player-bg z-index:0） */
  wash: 0,
  /** 层内内容（原型 .pl-layer > * / .player-layer > * z-index:1） */
  layerContent: 1,
  /** 迷你播放条（原型 .minibar z-index:68，styles.css L687-710）：浮在滚动内容与推入层内容之上，
   *  但让位于底部浮层（sheet 80）——弹层打开时圆点被遮罩盖住，不浮在遮罩上。
   *  旧值 45 是「只在主屏内压过内容」那一档；圆点要压在推入层内容之上，故随原型回到 68。 */
  minibar: 68,
  /** 吸顶顶栏（原型 .topbar z-index:40）：恒在滚动内容之上，与滚动状态无关 */
  topbar: 40,
  /** LRC 浮窗（原型 .lrc-float z-index:75，styles.css L667；U61 轮）：主屏内可拖动歌词气泡，
   *  压过顶栏 / 迷你条 / Tab 栏与滚动内容，但让位于底部浮层（sheet 80）与提示胶囊（toast 90） */
  lrcFloat: 75,
  /** 底部浮层（原型 .sheet z-index:80）：盖过顶栏、Tab 栏与列表内容 */
  sheet: 80,
  /** 提示胶囊（原型 .toast z-index:90，styles.css L797）：全站最高一层（硬件状态栏除外），压过浮层 */
  toast: 90,
} as const

/* ================= 封面氛围底纹（共通件度量） ================= */

/**
 * `CoverWash` 的度量（原型 `.pl-bg` L403 / `.player-bg` L513：blur+saturate 不可用，
 * 降级为封面种子渐变铺底）。局部铺底时下沿必须渐隐到 0：
 * 原型的底纹被 blur(64px) 抹平了边界，降级后是一个「高度整齐的色块」，
 * 不渐隐就会被看成盖在内容上的一层蒙板（2026-10-12 真机走查现象 1）。
 */
export const COVER_WASH = {
  /** 整层铺底（原型 .player-bg 140deg 降级）的缺省渐变方向：封面 135deg 对角 */
  artStart: { x: 0, y: 0 },
  artEnd: { x: 1, y: 1 },
  /** 局部铺底（heightRatio < 1，原型 .pl-bg height:56%）时的纵向渐隐起止 */
  fadeStart: { x: 0.5, y: 0 },
  fadeEnd: { x: 0.5, y: 1 },
  /** 三段衰减的位置与相对峰值透明度的系数（1 → 中段 → 0，收尾无硬边） */
  fadeLocations: [0, 0.62, 1],
  fadeAlphaRatios: [1, 0.5, 0],
} as const

/* ================= 控件度量 ================= */

// .chip / .q-tag / .section-more 等迷你控件的固定尺寸（颜色一律走色板）
export const CONTROL = {
  /** .chip 高度 28px */
  chipHeight: 28,
  /** .chip 水平内边距 0 11px */
  chipPaddingX: 11,
  /** .q-tag 内边距 2.5px 7px */
  tagPaddingX: 7,
  tagPaddingY: 2.5,
  /** .src-badge 内边距 2px 5px */
  badgePaddingX: 5,
  badgePaddingY: 2,
  /** .section-more 尾部箭头 13px（opacity .7） */
  moreIconSize: 13,
  moreIconOpacity: 0.7,
  /** .section-more 的 gap:1px */
  moreGap: 1,
  /** 小尺寸文字链的点击热区外扩（原型无，RN 侧补可点区域，≥ 44 不合适时取最小可行值） */
  moreHitSlop: 8,
  /**
   * 触控最小目标边长（44 等效，原型无——CSS 不受手指尺寸约束）。
   * 视觉边不足这一档的钮按缺口外扩热区：34 → 每边 5、42 → 每边 1（见 IconButton）。
   * 只给热区，视觉尺寸 / 布局一位都不改。
   */
  hitTarget: 44,
} as const

/* ================= 歌曲行（.song-row） ================= */

// 规格提取自 styles.css L247-274，含 .song-list.compact 变体与 .eq 均衡条
// 标题 / 副标题字号、排名字号走 FONT_SIZE；播放底渐变走 GRADIENTS.brandSoft
export const SONG_ROW = {
  /** 行内横向节奏 11px */
  gap: 11,
  /** .song-list gap:2px（styles.css L246） */
  listGap: 2,
  /** 常规行内边距 7px 8px 7px 4px */
  paddingY: 7,
  paddingRight: 8,
  paddingLeft: 4,
  /** 紧凑行内边距 5px 6px 5px 3px */
  compactPaddingY: 5,
  compactPaddingRight: 6,
  compactPaddingLeft: 3,
  /** 紧凑变体标题字号 13.5 */
  titleSizeCompact: 13.5,
  /** 副标题行上边距 3px */
  subMarginTop: 3,
  /** 副行段落间距（.sr-sub gap:6px，即 SPACING.s，此处显式留档） */
  subGap: 6,
  /** .sr-sub .sep 分隔条 1×9（styles.css L293，色走 colors.lineStrong） */
  sepWidth: 1,
  sepHeight: 9,
  /** 收缩优先级（styles.css L296-298）：角标 flex:none，歌手 0 1 auto，专辑 0 100 auto */
  artistFlexShrink: 1,
  albumFlexShrink: 100,
  /** 排名槽宽 22px（原型 .song-row .rank{width:22px}，styles.css L292，QA D78 回到原值）。
   *  组件侧用的是 minWidth（SongRow.tsx L322）：1～2 位编号正好 22dp，三位数（榜单 / 大歌单）
   *  自动撑宽不折行——原型那档固定宽在 CSS 里同样会把「100」挤折行，这里取的是它的视觉宽而非缺陷 */
  rankWidth: 22,
  /** 封面 46px / 紧凑 40px（圆角走 RADIUS.artXs） */
  artSize: 46,
  artSizeCompact: 40,
  /** 右侧更多按钮 4px 内边距 + 16px 图标 */
  morePadding: 4,
  moreIconSize: 16,
  /**
   * `.song-row{transition:background .2s var(--ease)}` + `.song-row:active{background:var(--fill-1)}`
   * （styles.css L292 / L294）：行类**只变底色、不缩放**，底色档位就是色板 fill1，
   * 补间时长即 MOTION.fast（200ms），故本块不另留键 —— 调用点用 `usePressFx()` 缺省档 + fill1 蒙层。
   */
  /** .eq 均衡条：2px 宽、3px↔11px 高、1.5px 间距（周期走 MOTION.eq） */
  eqWidth: 2,
  eqMinHeight: 3,
  eqHeight: 11,
  eqGap: 1.5,
  /** 播放列表面板那一列（件 U80，`#psBody .song-list`，styles.css L760）：gap 4px / margin-top 12px。
   *  同屏另一条 `#psBody .song-row .rank{display:none}`（L759）在 RN 侧对应「不传 rank」，见 QueueSheet */
  queueListGap: 4,
  queueListMarginTop: 12,
} as const

/* ================= 按钮族 ================= */

// 提取自 styles.css L111-117（.icon-btn）、L276-282（.ghost-btn）、L312-316（.pl-open-btn）与 L362-366（.mh-edit）
export const BUTTON = {
  /** .icon-btn 34×34 全圆，图标 18 */
  iconSize: 34,
  iconIcon: 18,
  /** .pl-actions .icon-btn 42×42，图标 19（圆角改 RADIUS.control） */
  iconSizeLg: 42,
  iconIconLg: 19,
  /** .pulse-dot 状态圆点 7px，偏移 4px */
  dotSize: 7,
  dotOffset: 4,
  /**
   * .pulse-dot 呼吸扩散（styles.css L139-146 @keyframes pulse，周期 MOTION.pulse）：
   * CSS 用 box-shadow spread 0→7px、alpha .5→0（0%→70%，后 30% 隐没）。
   * RN 以同色圆环覆盖件等价：外圈终径 = dotSize + 2×dotRingSpread，
   * dotRingPhase 为扩散段占总周期的比例，dotRingAlpha 为 0% 帧透明度。
   */
  dotRingSpread: 7,
  dotRingPhase: 0.7,
  dotRingAlpha: 0.5,
  /** .ghost-btn 高 42 / 图标 15 / 图文间距 7 */
  ghostHeight: 42,
  ghostIcon: 15,
  ghostGap: 7,
  /** .pl-open-btn / .mh-edit 高 32 / paddingX 13 / 图文间距 6 / 图标 15（mh-edit 为 14） */
  pillHeight: 32,
  pillPaddingX: 13,
  pillGap: 6,
  pillIcon: 15,
  /** .mh-edit 的专属两档（原型 styles.css L419-423，QA D85）：左内衬 11（padding:0 13px 0 11px，
   *  右侧仍 13，让图标离左边缘更紧）、按压缩放 .96（.pl-open-btn 是 .95，L360） */
  pillPaddingLeftEdit: 11,
  pillPressScale: 0.95,
  pillPressScaleEdit: 0.96,
} as const

/* ================= 开关（.toggle） ================= */

// 提取自 styles.css L613-618：轨道 46×27，旋钮 21px（内边 3px），行程 19px
export const SWITCH = {
  width: 46,
  height: 27,
  radius: 14,
  knob: 21,
  inset: 3,
  travel: 19,
} as const

/* ================= 顶栏（.topbar） ================= */

// 规格提取自 styles.css L86-110（.topbar / .topbar-row / .avatar-btn / .searchbar）
export const TOP_BAR = {
  /** 原型 padding-top 54 含状态框；真机用实测 statusbarHeight + 此行位。
   *  宽屏档不吃本值：`.wide .topbar{padding:36px 22px 10px}`（styles.css:1314）走
   *  `WIDE_STRUCTURAL.statusReserve`（4）与 `topBarPaddingX`（22） */
  statusBarReserve: 2,
  paddingBottom: 10,
  /** .topbar-row 高 46 / 子项 gap 10 */
  rowHeight: 46,
  gap: 10,
  /** .avatar-btn 34×34 全圆 */
  avatarSize: 34,
  /** .avatar 文字 13px / 800 */
  avatarTextSize: 13,
  /** .searchbar 高 38 / paddingX 14 / gap 8 / 图标 17 */
  searchHeight: 38,
  searchPaddingX: 14,
  searchGap: 8,
  searchIcon: 17,
  /**
   * 顶栏底色（原 rgba(8,8,12,.92)+毛玻璃）：主路径为共通件 BlurredContainer
   * （玻璃参数见 GLASS.topBar），染色渐变 .92→.66→0 止于盒底（原型 .topbar background
   * 的 0%/62%/100% 三停点），与 CSS backdrop-filter 同规——盒外不再有任何铺底/收边带。
   * 2026-10-21 QA：原挂于盒外下方的 16px「下沿渐隐收边条」（fade* 五键）已删——
   * 原型不存在这条带，它令顶栏模糊观感向下多出 16px，盖住了「我的」页头像顶部；
   * 原型渐变在盒内本就收 Transparent，无需盒外补边。
   */
  /** 滚动超过此高度顶栏加投影（app.js：vp.scrollTop > 8） */
  pinnedThreshold: 8,
} as const

/* ================= 底部 Tab 栏（.tabbar） ================= */

// 规格提取自 styles.css L479-499（.tabbar / .tab / .tab.is-active）
export const TAB_BAR = {
  /** height: calc(var(--safe-b) + 60px)，padding-top 8 */
  height: 60,
  paddingTop: 8,
  /** .tab 内图标与文字 gap 3 */
  gap: 3,
  /** .tab .ic 23px */
  iconSize: 23,
  /** .tab.is-active::before 指示条 22×3，top -8px */
  indicatorWidth: 22,
  indicatorHeight: 3,
  indicatorTop: -8,
  /** `.tab:active{transform:scale(.92)}` + `.tab{transition:color .25s,transform .2s}`（styles.css L696-698）：
   *  缩放那一段是 200ms（= MOTION.fast）；颜色那段的 .25s 属选中态换色，不在按压缩放这一档 */
  pressScale: 0.92,
  /**
   * 底栏底色（原型 .tabbar 盒内 linear-gradient(to top, bg 96%, bg 62%) + blur(26) saturate(180%)，
   * styles.css L551-557）：2026-10-13 起主路径为共通件 BlurredContainer（玻璃参数见 GLASS.tabBar）；
   * 真模糊不可用时退回不透明 theme.colors.bg 铺底（2026-10-12「内容穿透」修复的形态）。
   * 2026-10-15 撤掉原「盒外上沿 16px 渐隐收边条」（fade* 五键）：原型不存在这条带——
   * 渐变与模糊都止于盒内，盒顶只有 1px hairline 高光；这条自造带让栏上方内容被额外压暗，
   * 且带底 .85 与盒顶 .62 之间出现可见亮度跳变（与顶栏撤下沿收边条同一口径，见 TOP_BAR 注释）。
   */
} as const

/* ================= 玻璃层（backdrop-filter 毛玻璃） ================= */

/**
 * 三处常驻玻璃位（顶栏 / Tab 栏 / 迷你播放条）的统一参数
 * （2026-10-13 bug-fix「首页」第 1 条；共通件见 components/Glass/BlurredContainer）。
 * 原型字面值逐段来自 new_design/styles.css：
 *  - .topbar  L86-93：blur(22px) saturate(180%)；background linear-gradient(to bottom,
 *                     rgba(8,8,12,.92) 0%, rgba(8,8,12,.66) 62%, rgba(8,8,12,0) 100%)
 *    —— 顶栏铺满含系统状态栏背后那一段，所以「状态栏背后区域」的玻璃位就是顶栏玻璃层。
 *  - .tabbar  L479-486：blur(26px) saturate(180%)；background linear-gradient(to top,
 *                     rgba(8,8,12,.96), rgba(8,8,12,.62)）—— to top 即底浓顶淡。
 *  - .minibar L687-710：blur(28px) saturate(180%)；background:var(--glass)（.74 / .82 贴片）。
 *  - .minibar.is-snapped L728-735：blur(3px) saturate(150%)；background:var(--mini-veil)（.30 / .26）。
 * **2026-10-22 用户口径改档**：顶栏再加一档（更透、模糊更强）；TabBar 与 Minibar 反过来对齐
 * 「顶栏改档前」的综合观感（模糊 + 染色浓度两条一起对齐，不是照抄原型的字面数字）。
 * 因此下面 topBar / tabBar / minibar 三块的 alpha 与 intensity 已**不再等于原型字面值**，
 * 每一块的头注写清了「和谁对齐、为什么」，改档理由一律不写回原型。
 * 口径说明：
 *  - tint 基色不抄 CSS 字面 rgba，而是「色板键 × alpha」：深色下与原型逐值相等，
 *    浅色主题自动换成同语义浅底（如 light bg #F6F6FA × .96），不写死颜色。
 *  - saturate(180%) BlurView(4.4.1) 无法直接表达（iOS 走 blurType 材质、Android 纯半径），
 *    由 tint 渐变层承担「染色 + 提对比」的职责，属已知近似，设备验收时如显灰再调 alpha 档。
 *  - fallbackBase 是真模糊不可用时的保险：回到 2026-10-12 已验收的「不透明表面底」，
 *    保证分层不回退（尤其 Minibar「背景透明和背后内容重叠」的旧修复不得复活）。
 */
export const GLASS = {
  /** 顶栏（含系统状态栏背后区域）
   *
   * 2026-10-22 毛玻璃加档（用户口径「顶部栏自身再把毛玻璃和透明度加大一档」）：
   * - 模糊 22 → 30：Android 侧库内按 ×0.8 折算并封顶 25（blurAmount 30 → blurRadius 24，
   *   旧值 22 → 18），实际糊度 +33%；iOS 走 blurAmount 直传，同步加强。
   * - 染色 [.92, .66, 0] → [.78, .52, 0]：整体更透一档，坡形不变（顶端最实、盒底收到全透明，
   *   所以盒外仍然没有任何铺底 / 渐隐带 —— 历史回归点，见 TOP_BAR 头注）。
   * - 可读性：搜索框自身还有 fill-2 底 + hairline 描边，头像与波纹钮是实色块，
   *   0.78 的染色 + 更狠的模糊足以托住它们；不再加任何遮罩。
   */
  topBar: {
    intensity: 30,
    tintBase: 'bg',
    tintAlphas: [0.78, 0.52, 0],
    tintLocations: [0, 0.62, 1],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
    fallbackBase: 'bg',
  },
  /** 底部 Tab 栏（含系统导航条安全区那一段）
   *
   * 2026-10-22（用户口径「把顶栏现在这套毛玻璃效果和透明度用到 TabBar 上」）：
   * 对齐的是顶栏**改档前**那一套的综合观感 —— 模糊 26 → 22（Android 折算 21 → 18，
   * 与顶栏旧档同一个数），染色从原来那条 [.62, .96] 的「几乎实底」换成顶栏那条
   * .92→.66→0 的坡，只是按「底栏贴底、自由边在上」镜像过来：[0, .66, .92]（顶透底实）。
   * 平均浓度从 .79 降到约 .55，这一档就是用户说的「透明感不够大」的落点；
   * 图标与文字仍压在坡的实端（.92），不会被透掉。
   */
  tabBar: {
    intensity: 22,
    tintBase: 'bg',
    tintAlphas: [0, 0.66, 0.92],
    tintLocations: [0, 0.38, 1],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
    fallbackBase: 'bg',
  },
  /** 迷你播放条完整态（原型 .minibar：background var(--glass) + blur(28px)）
   *
   * 2026-10-22 与 TabBar 同一条口径对齐顶栏旧档：模糊 28 → 22（Android 折算 22 → 18，
   * 与顶栏旧档同数）；染色从 glassPatch 那个恒定 .74/.82 的近实底，换成顶栏同族的
   * 「色板键 × alpha」坡 [.86, .60, .18] —— 顶实底薄：这条浮在内容上，上沿要压住封面与歌名，
   * 下沿只托住副行，留 0.18 收尾（全透明收尾会让发丝描边变成一条悬空的线）。
   * 平均浓度约 .55，与 TabBar 对齐；降级路径仍垫不透明 surface2（fallbackBase 未变）。
   */
  minibar: {
    intensity: 22,
    /** 基色改为中性 bg（旧档直取 glassPatch 贴片 token）；深浅两套自动跟随 */
    tintBase: 'bg',
    tintAlphas: [0.86, 0.6, 0.18],
    tintLocations: [0, 0.6, 1],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
    /** surface2 不透明底 = 2026-10-12 分层修复的原值：降级态垫在染色层之下保底不透明 */
    fallbackBase: 'surface2',
  },
  /** 磁吸圆点（原型 .minibar.is-snapped：background var(--mini-veil) + blur(3px) saturate(150%)，
   *  styles.css L728-735）
   *  ——圆点压在推入层的内容上，**只有 3px**：糊得越狠，底下的字就越像没有（原型注释与实测截图
   *  两种都拍过：3px 还能看出底下是字还是封面，8px 只剩一团雾）。
   *  染色直取 miniVeil token（深 .30 / 浅 .26），降级底走 surface2 实底：
   *  原生模糊不可用时圆点变成一枚不透明小圆，宁可厚一点也不漏内容。 */
  miniSnapped: {
    intensity: 3,
    tintBase: 'miniVeil',
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 },
    fallbackBase: 'surface2',
  },
  /** 提示胶囊（原型 .toast：background var(--glass) + backdrop-filter blur(18px)，styles.css L796-799）
   *  ——与 .minibar 同一贴片家族（glassPatch 直取），只是模糊半径按本选择器的 18px */
  toast: {
    intensity: 18,
    tintBase: 'glassPatch',
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 },
    /** 降级底同样用 glassPatch 原值：贴片本身已是 .74/.82 半透明，双层叠出约 .93 近实底，
     *  保证无模糊路径下胶囊在亮封面前仍可读（原型 toast 无实底档，此处是 RN 侧保险） */
    fallbackBase: 'glassPatch',
  },
  /** LRC 浮窗（原型 .lrc-float：background var(--glass) + backdrop-filter blur(20px) saturate(180%)，
   *  styles.css L666-673；U61 轮）——与 .minibar / .toast 同一 glassPatch 贴片家族，
   *  模糊半径按本选择器 20px；降级底同走 glassPatch 原值（同 .toast 口径），
   *  无模糊路径下气泡压在任意滚动内容上仍近实底可读 */
  lrcFloat: {
    intensity: 20,
    tintBase: 'glassPatch',
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 },
    fallbackBase: 'glassPatch',
  },
} as const satisfies Record<string, GlassLayerSpec>

/**
 * Android 侧真模糊的采样策略（性能档，非视觉档）——2026-10-15「滑动/切页卡顿」性能轮新增。
 *
 * 背景：`@react-native-community/blur` 在 Android 上是 eightbitlab/blurview 的壳，RN 的
 * `autoUpdate` 属性逐字透传给 `BlurView.setBlurAutoUpdate()`（见该库
 * android/.../BlurViewManagerImpl.java:44）。autoUpdate=true 时库会挂一个
 * `ViewTreeObserver.OnPreDrawListener`，**每一帧**都把「本视图身后那块窗口区域」重新截图 +
 * 降采样 + RenderScript 模糊一遍。本 App 常驻就有三个这样的玻璃层（顶栏含状态栏段、底 Tab 栏
 * 含导航安全区段、Minibar），全在滚动的 ScrollView 之上 —— 滚动时每帧付三次全屏级重采样，
 * 这是 Android 上最典型的掉帧来源（库自己的 README 也写明：滚动期间持续更新是贵操作，
 * 非必要请关掉）。iOS 走 UIVisualEffectView，由系统合成，不受本开关影响。
 *
 * 关掉后的代价：模糊像是「最后一次失效时的那一帧快照」，滚动时不跟随刷新（静止后与新内容
 * 差一层静态雾）。三处玻璃位之上的染色渐变 alpha 分别是 .78→0（顶栏）、0→.92（Tab 栏）、
 * .86→.18（Minibar，2026-10-22 改档后口径），即绝大部分面积本就由染色层承担，
 * 模糊只贡献一点点颗粒化质感，观感差极小。
 * 若上机对比认为「静态雾」不可接受，把本值改回 true 即一处复原。
 */
export const GLASS_PERF = {
  /** Android BlurView 是否逐帧重采样身后内容（iOS 忽略本值） */
  androidAutoUpdate: false,
} as const

/* ================= 页头 / 页脚（.page-head / .foot-note） ================= */

export const PAGE_HEAD = {
  /** .page-head margin-top 6 / gap 12 */
  marginTop: 6,
  gap: 12,
} as const

// styles.css L305-306：页尾一句话说明（首页 / 歌单 / 榜单 / 我的 / 歌单详情均复用）
export const FOOT_NOTE = {
  marginTop: 32,
  gap: 8,
  /** .foot-mark 渐变小圆点 14px */
  markSize: 14,
  markOpacity: 0.6,
} as const

/* ================= 空列表提示（.empty-tip） ================= */

// styles.css L319（页面内）与 L416（.pl-layer 内内边距不同）
export const EMPTY_TIP = {
  /** 页面内：padding 22px 0 6px */
  paddingTop: 22,
  paddingBottom: 6,
  /** .pl-layer .empty-tip：padding 34px 0 */
  layerPaddingY: 34,
  /** line-height 1.7（12.5px 字号折算 21px） */
  lineHeight: 21,
} as const

/* ================= 卡片网格与歌单卡（.pl-grid / .pl-card） ================= */

// styles.css L232-239。网格列数与间隙同时供「计算单卡宽度」使用（见 hooks/useGridItemWidth）
// 宽屏档改的是「按档覆盖」这一组（medium 16×14 / expanded 16×12，styles.css:1318-1321，见 `WIDE` 与
// `wideGridGapOf`）；本块是**竖屏基线**，分档前后不许动。
export const CARD_GRID = {
  /** grid-template-columns:1fr 1fr */
  columns: 2,
  /** gap:14px 12px（行 / 列） */
  rowGap: 14,
  columnGap: 12,
} as const

/* ================= 轻量宽屏档（判据与逐值都以原型为准） ================= */

/**
 * 「轻量宽屏」的唯一数据源。**原型是准绳**：这一档在原型里有成族的 `.wide` 规则
 * （styles.css L1308-1343）与一条判据（app.js L3483-3492），本块只是把它们逐值搬进 RN，
 * 不再有任何「RN 自造」的数。
 *
 * 判据的换算关系（必须写清，否则两边的 600/840 会被当成两个不同的东西）：
 * - 原型是**查看器手动档**：`.pad` / `.wide` 是查看器上的按钮，外框宽可被 700 / 890 两颗钮改写；
 * - 原型的判据 = **屏内宽**，而 `屏内宽 = 外框宽 − 手机边框左右各 11`（app.js:3483 `WIDE_EDGE = 11`、
 *   app.js:3491 `wideInnerW = () => wideW - WIDE_EDGE * 2`），阈值 600 / 840 挂在这条实测屏内宽上
 *   （app.js:3485 `WIDE_TIERS`：`{min:840,cols:4}` / `{min:600,cols:3}`）；
 * - RN 侧没有「外框 + 11px 边框」这一层：**窗口宽本身就是屏内宽**（`useWindowDimensions().width`
 *   读的是可读区宽，不含任何装饰边框），所以 RN 拿窗口宽当**同一条判据**代入 600 / 840，
 *   两边比的是同一个量。原型 890 外框 → 屏内 868 → 4 列；RN 窗口 868 及以上 → 同一档。
 *
 * 明确**不承接**的：左侧导航栏、歌单详情主从、设定页两列、播放页改造——那些是原型 `.pad`
 * 那一档的结构级形态，本档（`.wide`）一律不做。
 *
 * 竖屏档（窗口宽 < 600）列数仍取 `CARD_GRID.columns`、内容盒不限宽、结构度量全走竖屏基线 token，
 * 行为与分档之前**逐值一致**。
 * 具体判据函数见文件末尾的 `wideTierOf` / `wideColumnsOf` / `wideGridGapOf` /
 * `wideContentMaxWidthOf` / `wideContentWidth` / `wideStructuralOf` / `wideLayerPaddingXOf`。
 */
export const WIDE = {
  /** 屏内宽 < 600 = compact（手机竖屏档）：不限宽、列数与结构度量全走竖屏基线。原型 app.js:3487 的 min 600 */
  compactUpper: 600,
  /** 600 ≤ 屏内宽 < 840 = medium：3 列（原型 app.js:3487 `{min:600,cols:3,cls:'wcols3'}`） */
  mediumUpper: 840,
  mediumColumns: 3,
  /** 840 ≤ 屏内宽 = expanded：4 列（原型 app.js:3486 `{min:840,cols:4,cls:'wcols4'}`） */
  expandedColumns: 4,
  /**
   * medium 档栅格间隙（行×列 = 16×14）：原型 `.wide.wcols3 .pl-grid{gap:16px 14px}`（styles.css:1318）
   * 与 `.wide.wcols3 .rank-grid`（styles.css:1320）同数
   */
  mediumRowGap: 16,
  mediumColumnGap: 14,
  /**
   * expanded 档栅格间隙（行×列 = 16×12）：原型 `.wide.wcols4 .pl-grid{gap:16px 12px}`（styles.css:1319）
   * 与 `.wide.wcols4 .rank-grid`（styles.css:1321）同数
   */
  expandedRowGap: 16,
  expandedColumnGap: 12,
  /**
   * medium / expanded 共用的内容盒限宽（含 .page 左右 16 内衬，即滚动容器 contentContainer 的宽上限），
   * 超出后水平居中。原型 `.wide .page{max-width:620px;margin-left:auto;margin-right:auto}`
   * （styles.css:1316）与 app.js:3484 `WIDE_MAX_W = 620` 同一个数。
   * 与 `MINE.statMaxWidth` / `MINE.favMaxWidth` 的 620 同族但不冲突：
   * 那两个限的是**单条件**（统计条 / 合一卡），这一条限的是**整页内容盒**；
   * 原型这一档的说明（styles.css L1305-1306）明写「内容盒限宽 620 后水平居中：620 是原型已有的那一档
   * 限宽（.pad .stat-row / .pad .fav-card 就是它），不新开数」，卡基线 width:100% 随盒铺满、不再叠第二道限宽。
   * 净宽口径：620 盒宽先收，再减 .page 左右 16 得 **588** 净宽——凡按屏宽推尺寸的都走
   * `wideContentWidth`（先收盒宽再算列），不许拿整屏宽直接推。
   */
  contentMaxWidth: 620,
} as const

/**
 * 宽屏档（medium 与 expanded **共用同一组**，原型 `.wide` 那族规则不随列数分档）的结构度量覆盖。
 * 每一键都是原型 styles.css 一条 `.wide` 规则的直译；`wideStructuralOf` 只在非 compact 档发对象，
 * compact 一律 `undefined` → 消费侧写成 `wide?.x ?? 竖屏基线 token`，竖屏那侧连一条宽样式都不落。
 *
 * 垂直预算的分解基准是原型这一档的**模拟状态栏 32**（`.wide .statusbar{height:32px}`，styles.css:1310）；
 * RN 用实测状态栏高度（`useSafeArea().top`）替它，于是原型那些「36 / 92 / 150」在 RN 里写成
 * 同一组可合成出这些值的**基元**（状态栏之上那 4、行高 46、Tab 44、迷你条 52+52、呼吸 24），
 * 代入库器实测值即与原型逐值相等（见各键注释）。
 */
export const WIDE_STRUCTURAL = {
  /** 原型这一档的模拟状态栏高 32（styles.css:1310），RN 侧不落地、只作下面各条的分解基准 */
  statusBarHeight: 32,
  /**
   * 状态栏**之上**那截内衬 = 36 − 32 = 4。原型这一档六个落点齐平都是 36：
   * `.wide .topbar`（1314）/ `#plLayer`（1335）/ `#episodeLayer`（1336）/ `.pl-head`（1337）/
   * `.sc-top`（1342）/ `.player-layer`（1343）。竖屏三档基线各不相同（顶栏 2、层 6、搜索头 2），
   * 这一档一律收到 4。
   */
  statusReserve: 4,
  /** `.wide .topbar{padding:36px 22px 10px}`（styles.css:1314）左右那一位；竖向两位见 statusReserve / TOP_BAR.paddingBottom */
  topBarPaddingX: 22,
  /**
   * 滚动容器**下**内衬里「Tab 栏上沿之上」那一段 = 84。原型 `.wide .viewport{padding:92px 0 150px}`
   * （styles.css:1315）分解：150 = 22 安全区 + 44 Tab 栏 + 84；
   * 那 84 自身 = 迷你条底距(52 − 44 = 8) + 迷你条高 52 + 呼吸 24（原型 1312-1313 注释同式）。
   * 上内衬 92 = 36 + 行高 46 + 10 = 顶栏总高，RN 由 `topbarHeight(实测状态栏, 4)` 合成，不单独落键
   * （代实测状态栏 32 即得 92，与原型逐值相等）。
   */
  contentGapAboveTabBar: 84,
  /** `.wide .tabbar{height:calc(var(--safe-b) + 44px);padding-top:6px}`（styles.css:1327）—— 44 不含安全区 */
  tabBarHeight: 44,
  /** 同条规则的 padding-top 6（styles.css:1327） */
  tabBarPaddingTop: 6,
  /** `.wide .tab .ic{width:20px;height:20px}`（styles.css:1328） */
  tabIconSize: 20,
  /** `.wide .minibar{... height:52px}`（styles.css:1326） */
  minibarHeight: 52,
  /** `.wide .minibar{bottom:calc(var(--safe-b) + 52px)}`（styles.css:1326）—— 安全区之上再抬 52 */
  minibarBottomAboveSafe: 52,
  /** `.wide .banner{height:112px}`（styles.css:1324；112 取继续收听那一行的现成卡宽，原型注释明写不新开数） */
  bannerHeight: 112,
  /**
   * `.wide #episodeLayer{padding:36px max(16px,calc((100% - 620px)/2)) 26px}`（styles.css:1336）
   * 的底那一位 26（竖屏 `.pl-layer` 是 34，`#plLayer` 这一档仍是 34 → 只有单集屏收到 26）。
   */
  episodeLayerPaddingBottom: 26,
} as const

/** 宽屏档结构度量对象的类型（消费侧的 `wide?.x ?? 竖屏基线` 与 `topbarHeight` 第二入参都吃它） */
export type WideStructural = typeof WIDE_STRUCTURAL

export const PL_CARD = {
  /** .pt 上边距 8 / 行高 1.35 / 最多两行 */
  titleMarginTop: 8,
  titleLineHeightRatio: 1.35,
  titleLines: 2,
  /** .ps 上边距 3 / 与圆点间距 5 */
  metaMarginTop: 3,
  metaGap: 5,
  /** .src-dot 5px 圆点（颜色取平台 tint） */
  dotSize: 5,
  /** `.pl-card:active{transform:scale(.96)}`（styles.css L262），过渡 `.2s` 即 MOTION.fast */
  pressScale: 0.96,
} as const

/* ================= 榜单卡（.rank-grid / .rk-card，styles.css L376-397） ================= */

// 第 7a 轮封面改版后榜单卡只剩摆位/描边/按压三项；渐变与纹理 token 已随旧实现退役
// （底色走下方 CHART_ART.cardBg，文字度量也走下方 CHART_ART）
export const RANK_CARD = {
  /** .rank-grid margin-top:18px */
  gridMarginTop: 18,
  /** .rk-card inset 0 0 0 1px rgba(255,255,255,.16)：1px 高光描边 */
  ringAlpha: 0.16,
  /** .rk-card:active scale(.96) */
  pressScale: 0.96,
} as const

/* ================= 排行榜分段头与分批续取（.rank-group / RANK_PAGE_SIZE，styles.css L379-384 + app.js L469/L534） ================= */

// 整平台全列（第 7b 轮）：一屏放不下四十五张卡，按平台插分段头 + 滚到底续取下一批
export const RANK_GROUP = {
  /** .rank-group gap:8px（b 与 span 之间，align-items:baseline） */
  gap: 8,
  /** .rank-group margin:12px 0 -4px；:first-child 的 margin-top:0 由组件 first 属性落 */
  marginTop: 12,
  marginBottom: -4,
  /** b{font-size:13.5px;font-weight:800} */
  titleSize: 13.5,
  /** span{font-size:10.5px} */
  countSize: 10.5,
} as const

// 分批续取的分页数值（app.js：RANK_PAGE_SIZE=8；rankScroll 触发线 scrollHeight-160）
export const RANK_PAGING = {
  /** 每批上卡的张数 */
  pageSize: 8,
  /** 距底多少 px 触发续取（原型 160px 原值，RN 侧按 px 距离判定而非视口倍数） */
  endReachedDistance: 160,
} as const

/* ================= 分页状态行（.pl-status，styles.css L272-275） ================= */

// 排行榜页与歌单详情页共用同一语义（原型 PLD_STATUS），故 token 独立于 rank 区块
export const PAGING_STATUS = {
  /** padding:14px 6px */
  paddingVertical: 14,
  paddingHorizontal: 6,
  /** font-size:12px；可点（非 disabled）时 color:var(--brand) + font-weight:700 */
  fontSize: 12,
  /** 动画标识与文字之间 gap:7px（原型 L274；2026-10-15 起转圈换成 RunningDots，键名去 spin 语义） */
  contentGap: 7,
} as const

/* ============ 分页「正在获取」动画标识（RunningDots，2026-10-15 同事清单） ============ */

// 静态转圈在长列表尾巴上存在感太弱（真机反馈）。换成三颗圆点按接力顺序「起跳-落地」——
// 跑动感的简笔等价物：每颗占周期的 1/3 窗口完成一次起跳落地，三窗恰好铺满一周、循环处无缝。
// 颜色取品牌渐变三端点（GRADIENTS.brand.colors，#FF5C8A / #C04CE8 / #7A3BFF），与原型主色同源；
// 纯核心 Animated + useNativeDriver，不引入任何新依赖。
export const RUNNING_DOTS = {
  /** 圆点直径（与旧 13px 转圈同量级，略小显轻快） */
  dotSize: 6,
  /** 三颗点之间的间距 */
  dotGap: 5,
  /** 起跳峰值（translateY 向上，px） */
  hopHeight: 7,
  /** 没轮到的点的静息透明度（1 = 正在跳的那颗，形成「接力棒」亮序） */
  idleAlpha: 0.4,
  /** 完整一轮（三颗点各跳一次）周期 ms，与旧 spin .9s 同拍 */
  cycleMs: 900,
} as const

/* ================= 列表终点行（.pl-end，styles.css L281-285） ================= */

// 「没有更多了」：滚到底能确认「就这些」，两侧细线把它收成一条句号横线（榜单页/歌单池/详情层共用）
export const PAGING_END = {
  /** margin:20px 2px 6px（网格内 .pl-grid>.pl-end 收 margin-top:10px，走 marginTopInGrid） */
  marginTop: 20,
  marginTopInGrid: 10,
  marginBottom: 6,
  marginX: 2,
  /** gap:10px（文字与两侧细线） */
  gap: 10,
  /** 细线 height:1px / opacity:.22（background:currentColor 即 text-3 本色压透明度） */
  lineHeight: 1,
  lineAlpha: 0.22,
  /** font-size:11.5px / letter-spacing:.4px */
  fontSize: 11.5,
  letterSpacing: 0.4,
} as const

// 歌单页「推荐歌单池」分批续取（app.js L660 PL_POOL_SIZE=10）。
// 独立数值另立键：与排行榜的 RANK_PAGING.pageSize=8 只是同期引入，语义与取值都不同；
// 距底触发线复用 RANK_PAGING.endReachedDistance（触底链路 MainScreen/PageViewport 本就共用）
export const PL_POOL_PAGING = {
  /** 每屏落的歌单份数（首屏 10 份，滚到底再落下一批） */
  pageSize: 10,
} as const

/* ================= 电台（播客）：榜行 / 单集行 / 订阅卡 / 单集屏（U81-U84） ================= */

// 值逐条取自拆件原文：`new_design/parts/radio/home.css`（源 styles.css L373-L410）、
// `radio/detail.css`（L413-L425）、`radio/episode.css`（L428-L435）；
// 行高 74 / 89 是 `index.html` L766 那一次无头量测的数（榜行 = 56 封面 + 上下 9 内衬），
// 真机要重量但**行高一律不动**（同句口径）。
// RN 固定竖屏：横屏 / Pad 的订阅卡 84/150、hero 84 那组覆盖归原型 `_chrome`，本表不承接（契约 7.0）。
export const POD = {
  /* —— 榜行 / 命中行（.pod-row，home.css L398-L409）—— */
  /** 量测行高 74（封面 56 + 上下内衬 9×2） */
  rowHeight: 74,
  /** .pod-row padding:9px 8px；gap:11px；border-radius:14px */
  rowPaddingY: 9,
  rowPaddingX: 8,
  rowGap: 11,
  rowRadius: 14,
  /** .pod-rank{width:22px;font-size:14px}——与 SONG_ROW.rankWidth 同值但语义不同，就近各留一份 */
  rankWidth: 22,
  rankFontSize: 14,
  /** .pod-row .art{56×56;border-radius:13px}——比 SONG_ROW.artSize(46) 大一档，故不能套 SongRow */
  rowArtSize: 56,
  rowArtRadius: 13,
  /** .pod-name{14.5px/700，单行截断} */
  nameFontSize: 14.5,
  /** .pod-by{11.5px;margin-top:3px;gap:6px}，竖线 .sep 1×9 */
  byFontSize: 11.5,
  byMarginTop: 3,
  byGap: 6,
  bySepWidth: 1,
  bySepHeight: 9,
  /** .pod-open 24×24，里面那颗 chevron 14 */
  openSize: 24,
  openIconSize: 14,
  /** 榜列本体：.pod-list{margin-top:2px} + 轴自身 padding:10px 16px 34px */
  listMarginTop: 2,
  listAxisPaddingTop: 10,
  listAxisPaddingX: 16,
  listAxisPaddingBottom: 34,

  /* —— 订阅那一区（.subs-block / .subs-head / .subs-card / .subs-x / .subs-empty）—— */
  /** .subs-block{margin:18px 0 6px} */
  subsMarginTop: 18,
  subsMarginBottom: 6,
  /** .subs-head{gap:8px;margin:0 0 10px}，b{15px/900} + em{11px} */
  subsHeadGap: 8,
  subsHeadMarginBottom: 10,
  subsHeadTitleSize: 15,
  subsHeadCountSize: 11,
  /** .subs-card{width:132px} + .art{132×132;border-radius:16px}（横滚壳复用 U16 的 .hscroll） */
  subsCardWidth: 132,
  subsArtSize: 132,
  subsArtRadius: 16,
  /** .sub-n{12.5px/700;margin-top:8px;line-height:1.4，两行截断} */
  subsNameSize: 12.5,
  subsNameMarginTop: 8,
  subsNameLineHeight: 1.4,
  /** .sub-l{10.5px;margin-top:3px}——只有本机有进度才写这一行 */
  subsLabelSize: 10.5,
  subsLabelMarginTop: 3,
  /** .subs-x{top/right:6px;width/height:22px}，里面 .ic 11×11（底走 glassPatch） */
  subsXSize: 22,
  subsXOffset: 6,
  subsXIconSize: 11,
  /** .subs-empty{padding:12px 14px;border-radius:14px;font-size:11.5px;line-height:1.6} */
  subsEmptyPaddingY: 12,
  subsEmptyPaddingX: 14,
  subsEmptyRadius: 14,
  subsEmptyFontSize: 11.5,
  subsEmptyLineHeight: 1.6,

  /* —— 当前地区那一行（.pod-region，home.css L393-L394）—— */
  regionMarginTop: 16,
  regionMarginBottom: 6,
  regionGap: 10,
  regionTitleSize: 15,

  /* —— 单集列（.ep-list / .ep-head / .ep-row / .ep-text，detail.css L413-L425）—— */
  /** 量测行高 89（集名两行 + 元信息 + 摘要两行） */
  epRowHeight: 89,
  /** .ep-row{padding:12px 8px;gap:12px;border-radius:14px} */
  epRowPaddingY: 12,
  epRowPaddingX: 8,
  epRowGap: 12,
  epRowRadius: 14,
  /** .ep-title{14px/700;line-height:1.45，两行截断} */
  epTitleSize: 14,
  epTitleLineHeight: 1.45,
  /** .ep-meta{11px;margin-top:5px;gap:6px}，竖线 .sep 1×9 */
  epMetaSize: 11,
  epMetaMarginTop: 5,
  epMetaGap: 6,
  epMetaSepWidth: 1,
  epMetaSepHeight: 9,
  /** .ep-text{11.5px;line-height:1.6;margin-top:5px，两行截断}——没摘要就整段不渲染 */
  epTextSize: 11.5,
  epTextLineHeight: 1.6,
  epTextMarginTop: 5,
  /** .ep-list{gap:1px;margin-top:8px} + 轴自身 padding:6px 16px 34px */
  epListGap: 1,
  epListMarginTop: 8,
  epAxisPaddingTop: 6,
  epAxisPaddingX: 16,
  epAxisPaddingBottom: 34,
  /** .ep-head{margin:22px 0 4px;gap:8px}，b{15px/900}——小标题在固定段里，不进那根轴 */
  epHeadMarginTop: 22,
  epHeadMarginBottom: 4,
  epHeadGap: 8,
  epHeadTitleSize: 15,

  /* —— 单集屏头部（.epl-head / .epl-cover / .epl-meta / .epl-intro，episode.css L428-L435）—— */
  eplCover: 96,
  eplCoverRadius: 18,
  /** .epl-head{margin:22px 0 2px;gap:14px;min-height:96px;align-items:flex-end} */
  eplHeadMarginTop: 22,
  eplHeadMarginBottom: 2,
  eplHeadMinHeight: 96,
  eplHeadGap: 14,
  /** .epl-meta{gap:6px}，h3{17px/900;line-height:1.4} */
  eplMetaGap: 6,
  eplTitleSize: 17,
  eplTitleLineHeight: 1.4,
  /** .epl-by{11.5px;line-height:1.5}（屏上写「节目名 · M 月 D 日」） */
  eplBySize: 11.5,
  eplByLineHeight: 1.5,
  /** .epl-intro{12.5px;line-height:1.75;margin:14px 0 0}；:empty{display:none} → RN 侧空则不渲染 */
  eplIntroSize: 12.5,
  eplIntroLineHeight: 1.75,
  eplIntroMarginTop: 14,
} as const

// 电台首页榜列的分批续取（原型 `POD_CHART_PAGE = 10`，data.js L573 + loadPodChartPage L1964）。
// **不复用 RANK_PAGING.pageSize（8）**：那是榜单卡那一档，与榜行不是一回事；
// 距底触发线**复用** RANK_PAGING.endReachedDistance（原型 podChartScroll L1990 的 160px 与
// rankScroll 那条判据逐字等价，useViewportScroll 已按 px 距离实现）。
// 注意：接口一次给满 50 条，这里的「分批」是**本地切片推进**，不是每批再发一次请求（见 podcast/hooks.ts）。
export const POD_CHART_PAGING = {
  /** 每批铺多少行（首批也是 10） */
  pageSize: 10,
  /** 距底多少 px 触发续铺（复用 RANK_PAGING 的 160 判据，同一条轴语义） */
  endReachedDistance: RANK_PAGING.endReachedDistance,
} as const

/* ================= 榜单封面（chartFace / .rk-card 文字层，app.js L583-617 + styles.css L499-531） ================= */

// 封面两支脸（原型 d0a04a6 起）：榜名命中判据表 → 真实插画（components/RankCover，49 张 512×512：48 张判据 + 1 张兜底；
// 母图是无损 PNG 只留原型那侧，进包的是生成脚本压出来的 q85 WebP，require 成静态资源）；
// 命不中 → 同包那张 default 兜底插画（以前是「强调色压暗的深底 + 该榜型一枚单色符号」，
// 2026-10-22 用户交来兜底图后整支退役，theme/chart.ts 那套色表跟着删）。
// 两支都是一张铺满的插画，所以卡上那两行字一律白墨（走 ART_INK，不随主题反转），钉在左上角那一块（.rk-copy）。
// 2026-10-22：字底下那档 .rk-scrim 压顶遮罩按用户口径整层撤掉（「遮罩过了」，插画上半截糊成一块黑），
// 可读性只靠两行字那圈紧贴字边的小投影兜（下面 shadow* 三值，两行同档）。
// 投影也不许用大模糊：旧那档 0 2px 14px 在浅色封面上把字四周摊成一层灰纱（逐像素量过：暗化两万余像素、
// 平均压暗 11/255），用户判成「像垫了块浅灰底板」，一并收紧。
export const CHART_ART = {
  /** .rk-card / .art.chart-art 那层底：平时被插画整个盖住，只垫图没到位那一瞬 */
  cardBg: '#0B1220',
  /** .rk-copy：文字块 absolute 到左上角，top 12 / left·right 13（两行同块、跟着流走，长名不会叠行） */
  copyTop: 12,
  copyInsetX: 13,
  /** .rk-name：17px / line-height 1.25（17×1.25）/ 字距走 LETTER_SPACING.normal / 最多两行 */
  nameSize: 17,
  nameLineHeight: 21.25,
  /** text-shadow 0 1px 3px rgba(0,0,0,.55)：.rk-name 与 .rk-sub 同一档（原型两行同值） */
  shadowAlpha: 0.55,
  shadowOffsetY: 1,
  shadowRadius: 3,
  /** .rk-sub：紧跟榜名 2px，色 rgba(255,255,255,.76)，字号走 FONT_SIZE.tiny，单行省略 */
  subMarginTop: 2,
  subAlpha: 0.76,
} as const

/* ================= 我的歌单卡（.my-pl，歌单页横滑排） ================= */

// styles.css L332-338：卡宽 120，封面 120×120 圆角 16；名字 12.5/700、副行 11/text-3
// 行间隙 12 与 .hscroll 相同，直接复用 H_SCROLL.gap
export const MY_PL = {
  width: 120,
  /** .my-pl .art 120×120 */
  artSize: 120,
  /** .my-pl .art border-radius:16px（数值与 RADIUS.pill 相同但语义不同，就近定义） */
  artRadius: 16,
  /** .mp-n margin-top:8px */
  nameMarginTop: 8,
  /** .mp-s margin-top:2px */
  subMarginTop: 2,
  /** `.my-pl:active{transform:scale(.95)}`（styles.css L494），过渡 `.2s` 即 MOTION.fast */
  pressScale: 0.95,
} as const

/* ================= 我的页（.mine-head / .stat-row / .fav-card，styles.css L353-391） ================= */

// 头像 / 我喜欢卡都压在渐变底上，描边与圆点色走 ART_INK（不随主题反转）；
// 头像字色原型为 #12060c，与色板 onBrand(#0A0A0F) 差一档，归到 onBrand（已知近似）
export const MINE = {
  /** .mine-head margin-top:8 / gap:13 */
  headMarginTop: 8,
  headGap: 13,
  /** .mh-art 58×58 全圆，字 26 走 FONT_SIZE.mineInitial */
  headArtSize: 58,
  /** .mh-art inset 0 0 0 1.5px rgba(255,255,255,.22)：渐变底上的亮描边 */
  headRingWidth: 1.5,
  headRingAlpha: 0.22,
  /** .mh-sub margin-top:3 */
  headSubMarginTop: 3,
  /** .mh-edit .ic 14px（PillButton 缺省 15 是 .pl-open-btn 档） */
  headEditIcon: 14,
  /** .stat-row margin-top:18 / gap:8 */
  statMarginTop: 18,
  statGap: 8,
  /**
   * 统计条限宽（原型 styles.css L934 `.pad .stat-row{max-width:620px}`，notes L578）：
   * Pad/宽屏下不被拉到整页宽显得空洞；手机竖屏视口本就窄于该值，这条天然不生效，
   * 落进 theme 只为宽屏形态留口径，组件内不写死。
   */
  statMaxWidth: 620,
  /** .stat padding 11px 4px / radius:16；底色 .05 归到色板 chip(.055)，描边归到 line */
  statPaddingY: 11,
  statPaddingX: 4,
  statRadius: 16,
  /** .stat span margin-top:3 */
  statLabelMarginTop: 3,
  /**
   * 「我喜欢 / 已缓存」合一卡的限宽（原型 styles.css L1140 `.pad .fav-card{max-width:620px}`，
   * inventory S1）：与上面 statMaxWidth 同值同族，宽窗口下不被拉到整页宽；竖屏净宽本就窄于它。
   * 卡片自身的度量与两套配色见下方 FAV_DUO。
   */
  favMaxWidth: 620,
} as const

/* ============ 「我喜欢 / 已缓存」合一卡（.fav-card.fav-duo，U44 + U86） ============ */

/**
 * 「我的」页这一处现在只有**一张整宽卡**：中间一道斜线切成左右两半，
 * 左半「我喜欢」（U44）、右半「已缓存」（U86）。度量逐值取自件 `parts/mine/fav-card.css`
 * 12 条规则（源 styles.css L554-L577），浅色档配色取自 `_base.css` 的 `.phone.light .fav-card` 覆盖
 * （styles.css L1342-L1349）——几何 / 字号 / 斜线角度两档共用，只有配色按档换。
 * 图标是两颗实心 Material 版（heartSolid / phoneSolid），尺寸同为 22。
 * 口径：原先那颗直接开播的圆钮（.fc-go）整族已随「两张卡合一」撤掉，开播回到各自屏的「播放全部」。
 */
export const FAV_DUO = {
  /** .fav-card margin-top:20px */
  marginTop: 20,
  /** .fav-card padding:16px 0（左右内衬由两半各自管） */
  paddingVertical: 16,
  /** .fav-card border-radius:24px（与 RADIUS.card 的 22 不是一档，就近定义） */
  radius: 24,
  /** .fc-half padding:0 16px；:first-child / :last-child 的 padding-left:20px */
  halfPaddingLeft: 20,
  halfPaddingRight: 16,
  /** .fc-half column-gap:12px（图标框与文字列） */
  columnGap: 12,
  /** .fc-half row-gap:2px（标题与副行） */
  rowGap: 2,
  /** .fc-art 44×44 / 圆角 14 / 内部 .ic 22 */
  artSize: 44,
  artRadius: 14,
  artIcon: 22,
  /**
   * .fc-art box-shadow:0 2px 8px（颜色与浓度两档各给，见 palette）。
   * 这里只有 iOS 的 shadow* 两值，**故意没有 elevation**：托底是半透明的（palette.artBg，
   * 深色 rgba(255,255,255,.11) / 明亮 rgba(255,255,255,.7)，由组件在渲染期照常铺上），
   * 而 Android 的 elevation 阴影画在 View 背景「下面」——半透明底会把那层黑阴影透出来，
   * 托底整体发灰、还带一块硬边白斑压在心形/电话图标上（2026-10 真机截图回归）。
   * 原型 CSS 的外阴影根本不会画到自己的背景下面，所以两档在 Android 上都该是
   * 「半透明托底 + 不带 elevation」。
   */
  artShadowOffsetY: 2,
  artShadowRadius: 8,
  /** .fav-duo::after：4px 实心斜线，left:50% + translateX(-50%)（负半宽 margin 表达）+ rotate(18deg) */
  dividerWidth: 4,
  dividerRadius: 4,
  dividerRotate: '18deg',
  dividerLeft: '50%',
  /** 斜线上下各溢出 20%（top/bottom:-20%），由卡面 overflow:hidden 裁掉 */
  dividerSpan: '-20%',
  /** .fav-card:active transform:scale(.99)（两半任一按下都缩整卡） */
  pressScale: 0.99,
  /** `.fav-card{transition:transform .25s ease,...}`（styles.css L558）——本族唯一 .25s 档，
   *  不是 MOTION.fast(200)；这里是直接值而非 MOTION 引用（token 文件内不前向引用 MOTION 之外的块） */
  pressMs: 250,
  /** .fav-card h3 16px / 700 / letter-spacing:.5px */
  titleSize: 16,
  titleWeight: '700',
  titleLetterSpacing: 0.5,
  /** .fav-card p 12px / 500 */
  subSize: 12,
  subWeight: '500',
  /** 外阴影 0 8px 24px（颜色与浓度两档各给，见 palette） */
  shadowOffsetY: 8,
  shadowRadius: 24,
  shadowElevation: 8,
  /** 两档配色：深色基线在 .fav-card 那一族，浅色在 .phone.light 覆盖段 */
  palette: {
    dark: {
      /** background:linear-gradient(90deg,#3A1B30 0%,#241C45 100%) */
      gradient: { colors: ['#3A1B30', '#241C45'], start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
      /** 阴影载体的不透明底（Android 无背景不投影；内层渐变整块盖住它，取渐变起点色） */
      surface: '#3A1B30',
      /** box-shadow:0 8px 24px rgba(0,0,0,.42) */
      shadowColor: '#000000',
      shadowOpacity: 0.42,
      /** inset 0 0 0 1px rgba(255,255,255,.06)：深色档的内描边 */
      ringColor: 'rgba(255, 255, 255, 0.06)',
      /** .fav-duo::after 的线色 */
      dividerColor: 'rgba(255, 255, 255, 0.22)',
      /** .fc-art background（原型另有 backdrop blur 4px，44dp 小方块上不迁移，保留半透明底） */
      artBg: 'rgba(255, 255, 255, 0.11)',
      /** .fc-art box-shadow:0 2px 8px rgba(0,0,0,.18) */
      artShadowColor: '#000000',
      artShadowOpacity: 0.18,
      /** .fav-card h3 / p */
      titleColor: '#F5F1FB',
      subColor: 'rgba(255, 255, 255, 0.52)',
      /** 左半心形 #F06BFF；右半（.fc-half:last-child）电话 #A78BFF */
      loveIcon: '#F06BFF',
      offlineIcon: '#A78BFF',
    },
    light: {
      /** background:linear-gradient(90deg,#FDE2EE 0%,#D6C3F9 100%) */
      gradient: { colors: ['#FDE2EE', '#D6C3F9'], start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
      surface: '#FDE2EE',
      /** box-shadow:0 8px 24px rgba(147,69,230,.12) */
      shadowColor: '#9345E6',
      shadowOpacity: 0.12,
      /** 浅色档没有 inset 描边：显式 transparent（组件照常渲染那一层，视觉为零） */
      ringColor: 'transparent',
      /** .phone.light .fav-duo::after{background:rgba(255,255,255,.75)} */
      dividerColor: 'rgba(255, 255, 255, 0.75)',
      /** .phone.light .fav-card .fc-art{background:rgba(255,255,255,.7)} */
      artBg: 'rgba(255, 255, 255, 0.7)',
      /** .phone.light .fav-card .fc-art{box-shadow:0 2px 8px rgba(0,0,0,.04)} */
      artShadowColor: '#000000',
      artShadowOpacity: 0.04,
      /** .phone.light .fav-card h3 / p */
      titleColor: '#1A1A1A',
      subColor: 'rgba(0, 0, 0, 0.45)',
      /** .phone.light 左半心形 #D233F8；右半（.fc-half:last-child）电话 #7129E8 */
      loveIcon: '#D233F8',
      offlineIcon: '#7129E8',
    },
  },
} as const

/* ================= 已缓存屏（.off-*，U86 件 parts/mine/offline.css） ================= */

/**
 * 「已缓存」（离线收听）整屏的度量：外层 `.pl-layer{padding:0;overflow:hidden}` 归屏根
 * （screens/Offline），固定段 `.pl-head` 与顶排 `.pl-top` 是跨件原子（PL_LAYER / PlTop），
 * 本块只收口径段 `.off-meta` / `.off-n` / `.off-lede` 与那根轴 `.off-list` 自己的内衬与列距。
 */
export const OFFLINE = {
  /** .off-meta{margin:18px 0 0;gap:5px} */
  metaMarginTop: 18,
  metaGap: 5,
  /** .off-n{font-size:15px;font-weight:900;letter-spacing:.2px;font-variant-numeric:tabular-nums} */
  countSize: 15,
  countWeight: '900',
  countLetterSpacing: 0.2,
  /** .off-lede{font-size:11.5px;line-height:1.6;color:var(--text-2)} */
  ledeSize: 11.5,
  ledeLineHeightRatio: 1.6,
  /** #offlineLayer>.off-list{padding:10px 16px 34px}（底部再补真机安全区） */
  listPaddingTop: 10,
  listPaddingX: 16,
  listPaddingBottom: 34,
  /** .off-list{gap:2px} */
  listGap: 2,
} as const

/* ================= 封面播放角标（.play-badge） ================= */

// styles.css L208-213，压在封面右下（recent-card / pl-card 共用）
export const PLAY_BADGE = {
  size: 24,
  /** right / bottom 偏移 */
  offset: 8,
  /** 图标 11px，margin-left 1px（视觉居中补偿） */
  icon: 11,
  iconOffset: 1,
} as const

/* ================= 横向胶囊选择条（.rank-tabs / .cat-row） ================= */

// styles.css L242-243：gap 7，margin:-2px 0 12px（rank-tabs）
// styles.css L322-329：cat-row 吸顶形态 —— 贴屏边横滑，gap 7，上 14 / 下 14，内上 3 内下 8
export const CHIP_ROW = {
  gap: 7,
  marginTop: -2,
  marginBottom: 12,
  /** .cat-row margin:14px -16px 0 */
  catMarginTop: 14,
  /**
   * .cat-row margin-bottom:14 —— 原型里它与后继 .section 的 margin-top:26 发生 CSS 外边距折叠，
   * 有效间隙取大者 26；RN 无折叠，这里置 0，由 Section 的 26 提供唯一间距（阶段 5 修掉的偏松问题）。
   */
  catMarginBottom: 0,
  /** .cat-row padding:3px 16px 8px */
  catPaddingTop: 3,
  catPaddingBottom: 8,
} as const

/* ================= 首页轮播（.banner-wrap / .banner-track / .banner / .banner-dots） ================= */

// styles.css L174-190。轮播单卡宽度 = 屏宽 - 两侧 .page 内边距（.banner width:100%）
export const BANNER = {
  /** .banner-wrap margin-top:14px */
  marginTop: 14,
  /** .banner-track 卡片间 gap:12px（同时用于计算 snapToInterval） */
  trackGap: 12,
  /** .banner 高 150 / padding 16 */
  height: 150,
  padding: 16,
  /** .veil to top rgba(0,0,0,.62) → rgba(0,0,0,.05) 62% 处 → 透明；RN 用 stops 表达 */
  veilAlphas: [0.62, 0.05, 0],
  veilStops: [0, 0.6, 1],
  /** .b-tag padding 4px 9px */
  tagPaddingY: 4,
  tagPaddingX: 9,
  /** .banner p margin-top:3px；色 rgba(255,255,255,.78)——图上文字不随主题反转 */
  subMarginTop: 3,
  subAlpha: 0.78,
  /** .banner-dots gap 5 / margin-top 10；i 5×5，.on 宽 16 */
  dotsGap: 5,
  dotsMarginTop: 10,
  dotSize: 5,
  dotActiveWidth: 16,
  /** .banner-dots i border-radius:3px */
  dotRadius: 3,
  /** .banner-dots i 底色 rgba(255,255,255,.22)：浅深两套都按「主文字色 × 该浓度」推导 */
  dotIdleAlpha: 0.22,
  /** 自动换播间隔（app.js renderBanners 的 setInterval 4200） */
  autoSwap: 4200,
} as const

/* ================= 快捷入口（.quick-row / .quick / .qa） ================= */

// styles.css L193-197：四等分 grid，gap 8；封面块 60×60、圆角 20（即 RADIUS.art）
export const QUICK_ROW = {
  marginTop: 22,
  /** grid-template-columns:repeat(4,1fr) */
  columns: 4,
  gap: 8,
  /** .quick .qa 60×60 */
  artSize: 60,
  /** .qa 内图标 20px（app.js artIcon(q.seed, q.icon, '20px')） */
  iconSize: 20,
  /** .quick 内图文 gap 8 */
  labelGap: 8,
  /** `.quick:active{transform:scale(.92)}`（styles.css L223），过渡 `.2s` 即 MOTION.fast */
  pressScale: 0.92,
} as const

/* ================= 横向滑动容器（.hscroll） ================= */

// styles.css L200：margin:0 -16px + padding-left/right 16px（贴屏边滑），gap 12
export const H_SCROLL = {
  gap: 12,
  /** padding-bottom:2px */
  paddingBottom: 2,
} as const

/* ================= 继续收听卡（.recent-card） ================= */

// styles.css L203-207：固定宽 112，封面 112×112
export const RECENT_CARD = {
  width: 112,
  /** .rt margin-top:8px */
  titleMarginTop: 8,
  /** .rs margin-top:2px */
  subMarginTop: 2,
  /** `.recent-card:active{transform:scale(.95)}`（styles.css L232），过渡 `.2s` 即 MOTION.fast */
  pressScale: 0.95,
} as const

/* ================= 每日推荐卡（.daily-card） ================= */

// styles.css L216-229：高 98 的横向卡，左封面 98×98 仅右侧圆角
export const DAILY_CARD = {
  height: 98,
  /** 封面与正文 gap 14 / 卡片右内边距 16 */
  gap: 14,
  padding: 16,
  /** .dc-art 98×98，圆角取 RADIUS.l（左上/左下为 0） */
  artSize: 98,
  /** h3 / p 上边距 */
  titleMarginTop: 4,
  subMarginTop: 3,
  /** .date 胶囊：top/right 16，padding 4px 8px，圆角取 RADIUS.tag */
  dateTop: 16,
  dateRight: 16,
  datePaddingY: 4,
  datePaddingX: 8,
} as const

/* ================= 歌手卡（.artist-card） ================= */

// styles.css L285-288：横滑排里的圆形头像 + 单行名字
export const ARTIST_CARD = {
  /** .artist-card width:76px */
  width: 76,
  /** .artist-card .art 68×68，圆形 */
  artSize: 68,
  /** .artist-card gap:8px */
  gap: 8,
  /** `.artist-card:active{transform:scale(.93)}`（styles.css L339），过渡 `.2s` 即 MOTION.fast */
  pressScale: 0.93,
} as const

/* ================= 播放页（.player-layer，styles.css L504-588） ================= */

// 顶栏 / 舞台 / 曲信息 / 进度 / 控制 / 工具行逐段提取；
// 播放浮层是「全屏页」而非右推层，接入形态见 screens/Player 与 navigation/entry
export const PLAYER = {
  /** .player-layer padding:56px 22px 32px（56 含 52 模拟状态栏，真机 = 实测状态栏 + 4） */
  paddingTopReserve: 4,
  paddingX: 22,
  paddingBottom: 32,
  /** 浮层上滑入场时长（transition transform .46s） */
  enterDuration: 460,
  /** .player-top / .pl-top grid 34/1fr/34（返回钮复用 BUTTON.iconSize 档） */
  topRightSlot: 34,
  /** .player-crumb gap 8 */
  crumbGap: 8,
  /** .player-stage padding:16px 0 */
  stagePaddingY: 16,
  /** 舞台横滑（唱片 ↔ 歌词）接管阈值：水平位移 ≥ 24px 且 ≥ 垂直位移 × 1.5 才算一次横滑；
   *  判定纯函数见 screens/Player/PlayerStageSwipe.ts 的 resolveStageSwipe */
  stageSwipeMinDx: 24,
  stageSwipeSlope: 1.5,
  /** .player-bg：blur(70px) 不可用，降级为封面渐变底 × .45 透明度 */
  bgOpacity: 0.45,
  /** .player-bg 140deg 的 start/end 近似（近竖向略右斜） */
  bgStart: { x: 0.2, y: 0 },
  bgEnd: { x: 0.8, y: 1 },
  /** .disc 206×206 全圆 */
  discSize: 206,
  /** .disc inset 0 0 0 8px rgba(0,0,0,.35)：内圈刻纹环 */
  discInnerRing: 8,
  discInnerRingAlpha: 0.35,
  /** .disc 外 1px rgba(255,255,255,.1) 高光 */
  discRingAlpha: 0.1,
  /** .disc::after inset 38%：中心孔直径 = 盘径 × 0.24 */
  discHoleRatio: 0.24,
  discHoleAlpha: 0.55,
  discHoleRingAlpha: 0.12,
  /** .lyric-wrap::before/::after 渐隐带：height 48px、压盖深度 rgba(8,8,12,.8)（styles.css L534-536）。
   *  2026-10-13 起 RN 侧不再用压盖渐变层（真机成黑框），这两个值改作「行透明度插值」的
   *  带宽与最大衰减深度，见 components/LyricList 的 fadeRamp */
  lyricFadeHeight: 48,
  lyricFadeAlpha: 0.8,
  /** .lyric-scroll padding:0 6px */
  lyricPaddingX: 6,
  /** .ln 13.5px / line-height 26 / opacity .75（字号走 FONT_SIZE.bodyLg） */
  lyricLineHeight: 26,
  lyricOpacity: 0.75,
  /** .ln.on 17px / 800 */
  lyricActiveSize: 17,
  /** .ln.on text-shadow 0 5px 22px <color>（styles.css L612 / L1171）：颜色走 colors.lyricGlow（两套主题各一档），此处只收偏移与半径。
   *  QA D77（2026-10-16 审计轮）回到原型原值 5 / 22（此前自降为 1 / 6，理由见色板 lyricGlow 处的遗留风险记录） */
  lyricGlowOffsetY: 5,
  lyricGlowRadius: 22,
  /** .ln-note margin-top 14 / opacity .8（字号走 FONT_SIZE.tiny） */
  lyricNoteMarginTop: 14,
  lyricNoteAlpha: 0.8,
  /** .player-meta gap 12 */
  metaGap: 12,
  /** .player-artist margin-top 5（字号 FONT_SIZE.body） */
  artistMarginTop: 5,
  /** .pc.fav 40×40 / 图标 24 */
  favSize: 40,
  favIcon: 24,
  /** .player-source gap 7 / margin-top 10（字号 FONT_SIZE.caption） */
  sourceGap: 7,
  sourceMarginTop: 10,
  /** .seek 高 5 圆角 3，margin 24px 0 8px；::before inset -14px -3px 为触区外扩 */
  seekHeight: 5,
  seekRadius: 3,
  seekMarginTop: 24,
  seekMarginBottom: 8,
  /** 触区纵向外扩 14（横向的 -3 有意不采纳：拖拽层必须与视觉条严格等宽，
   *  宽度多算 3px 就会让 locationX/宽度 的映射偏差，落位差之毫厘；同旧 UI pressBar 口径）。
   *  2026-10-15 撤掉上一版 seekSettleMs 冻结保护窗口：改回旧 UI 机制后不需要它（见 SeekControl 注释） */
  seekHitPadY: 14,
  /** .seek em 旋钮 11px 白，主色光晕 */
  seekThumb: 11,
  /** 舞台下方指示点 .stage-dots（styles.css L634-638）：gap 6 / margin -4 0 2 /
   *  点 5×5 全圆 currentColor（= text 色）透明度 .28，当前态加宽成 16 胶囊、透明度 1。
   *  原型横屏/Pad 隐藏是「同屏无翻页」所致，RN 固定竖屏 → 常显，不做隐藏逻辑 */
  stageDotsGap: 6,
  stageDotsMarginTop: -4,
  stageDotsMarginBottom: 2,
  stageDotSize: 5,
  stageDotActiveWidth: 16,
  stageDotIdleOpacity: 0.28,
  /** .player-controls：居中 gap 38 / margin-top 18（styles.css L641，三颗制） */
  controlsGap: 38,
  controlsMarginTop: 18,
  /** .pc 46×46 全圆；.pc.ghost 图标 27；.pc.tool 图标 21 + 标签 9.5（FONT_SIZE.micro）。
   *  2026-10-13 控件行改版后主行只剩 ghost/main 两类，tool 度量仅供 PcButton 保留变体引用 */
  pcSize: 46,
  pcGhostIcon: 27,
  pcToolIcon: 21,
  pcToolLabelSize: 9.5,
  pcToolGap: 2,
  /** .pc.main 64×64 渐变底 / 图标 27 */
  mainSize: 64,
  mainIcon: 27,
  /** .player-tools：两端对齐 gap 2 / margin-top 14（styles.css L649） */
  toolsGap: 2,
  toolsMarginTop: 14,
  /** .pt-btn padding 9px 2px / 图标 21（styles.css L650-652，纯图标版：无圆角底、无文字） */
  ptPaddingY: 9,
  ptPaddingX: 2,
  ptIcon: 21,
  /** .pc:active scale(.93) / .pt-btn:active scale(.94) */
  pcPressScale: 0.93,
  ptPressScale: 0.94,
  /** .pc.fav:active 同为 .pc 规则的 scale(.93) */
  favPressScale: 0.93,
} as const

/* ================= LRC 浮窗（.lrc-float，styles.css L666-681 + app.js syncFloat / bindFloatDrag） ================= */

// 原型 #lrcFloat 的**App 内可拖动歌词气泡**视觉。逐值提取自
// styles.css L666-681（8 条规则，件：new_design/parts/player/lrc-float.*）；拖动边界 / 点按判定
// 来自 app.js bindFloatDrag（L1907-1932）。
// 阶段 3（feature.md【newui】）换线记录：歌词浮窗改走系统级悬浮窗（core/desktopLyric），
// 这条应用内气泡的宿主（旧 hooks/useLrcFloat + screens/Main/LrcFloatDock）已下线，
// 本组 token 与视觉件 components/LrcFloat 一并留存，等原型口径回来再用。
export const LRC_FLOAT = {
  /** left:16px / top:520px 初始位（原型 .screen 内绝对坐标；RN 按窗口坐标落同值） */
  initialLeft: 16,
  initialTop: 520,
  /** max-width:236px */
  maxWidth: 236,
  /** padding:9px 10px 9px 12px */
  paddingTop: 9,
  paddingRight: 10,
  paddingBottom: 9,
  paddingLeft: 12,
  /** border-radius:22px（与 RADIUS.card 同值但语义不同，就近定义，L611 先例） */
  radius: 22,
  /** gap:8px */
  gap: 8,
  /** .lf-line：12.5px / 700 / line-height 1.3 = 16.25 / max-width:160px
   *  （字号与 FONT_SIZE.smallLg 同值但语义不同，就近定义） */
  lineSize: 12.5,
  lineHeight: 16.25,
  lineMaxWidth: 160,
  /** .lf-src：7px 圆点；box-shadow 0 0 9px var(--tint) 同色光晕（原型原值、无浓度衰减）——
   *  RN 用 shadow* 近似表达，elevation 是 Android 兜底一档（同 SHADOW.glow 量级） */
  srcDot: 7,
  srcGlow: 9,
  srcGlowElevation: 6,
  /** .lf-close：19px 全圆 / 图标 12px / opacity .6；:active 归 scale(.85) + opacity 1 */
  closeSize: 19,
  closeIcon: 12,
  closeOpacity: 0.6,
  closePressScale: 0.85,
  /** .lrc-float.drag：拖动态 transform:scale(1.05)（transition:none，即时生效）；
   *  松手按基础 transition .28s var(--ease) 回 1（时长与 MOTION.toggle 同值但语义不同） */
  dragScale: 1.05,
  scaleDuration: 280,
  /** 拖动边界（app.js L1920-1922 的 clamp）：left ∈ [8, 屏宽-宽-8]；top ∈ [56, 屏高-高-96] */
  boundLeft: 8,
  boundRight: 8,
  boundTop: 56,
  boundBottom: 96,
  /** 点按 / 拖动判定（app.js L1922 / L1930）：全过程 |dx|+|dy| 的峰值 < 4px 即点按 → 打开播放页 */
  tapSlop: 4,
} as const

/* ================= 迷你播放条（.minibar，styles.css L453-477） ================= */

export const MINIBAR = {
  /** 高 58 / 圆角 20 */
  height: 58,
  radius: 20,
  /** left/right 12 */
  marginX: 12,
  /** bottom: safe-b + 66（Tab 栏 60 之上再抬 6） */
  gapAboveTabBar: 6,
  /** .mini-progress 高 2（底 rgba(255,255,255,.09) 归到 glassStrong .085） */
  progressHeight: 2,
  /** .mini-main padding 0 12 / gap 11 */
  paddingX: 12,
  gap: 11,
  /** .mini-art 42×42 圆角 11 */
  artSize: 42,
  artRadius: 11,
  /** .mini-sub gap 6 / margin-top 2 / .sep 1×9 */
  subGap: 6,
  subMarginTop: 2,
  sepWidth: 1,
  sepHeight: 9,
  /** .mini-act 34 全圆 / 图标 19（primary 内 17） */
  actSize: 34,
  actIcon: 19,
  primaryIcon: 17,
  /** .mini-act:active scale(.9) */
  pressScale: 0.9,
  /** `.minibar.is-dragging{opacity:.94}`（styles.css L717）：拖拽中整条微透，交回过渡时复原 */
  dragOpacity: 0.94,

  /* ---- 磁吸圆点（.minibar.is-snapped，styles.css L727-864，含 2026-10-24 的 CD 碟面那一族）----
   * 完整条与圆点是同一只条的两形态：完整条 58 高 / 20 圆角 / 左右各留 12；
   * 圆点是「正圆 + 离屏边 3」贴在屏幕上，点一下展开回完整条（不直接进播放页）。 */
  /** --mini-dot:56px（`.wide .minibar{--mini-dot:52px}`，styles.css L1446；Pad 那档 60，本 App 无 Pad 档不做） */
  snappedSize: 56,
  /** `.wide .minibar{--mini-dot:52px}`（styles.css L1446） */
  snappedSizeWide: 52,
  /** --mini-edge:3px：圆点外缘离屏边的那一线（不把投影与进度弧切掉） */
  snappedEdge: 3,
  /** `.minibar.is-snapped .mini-main{padding:4px}` + 封面 = 直径 − 8（48 见方，随直径走） */
  snappedArtInset: 4,
  /** `.is-snapped::after` 的 mask：100%−2.1 → 100%−1.8，即贴外缘的 2px 环带 */
  snappedRingWidth: 2,
  /** `.mini-dock-mark .eq{height:11px;gap:1.5px}`（L861）：完整条那颗状态标里三柱的度量。
   *  **本轮不动完整条那颗标**（它还没在 RN 落地），这两个值因此暂时没有消费点，但不能删：
   *  它们是上面那条共享规则（完整条 / 贴边两态同一份 .eq 声明）的直译，
   *  且 gap 1.5 是对账脚本数值池里的登记值 —— 2026-10-26 实删过一次，parity 立刻报
   *  `common-control/minibar .mini-dock-mark .eq { gap: 1.5px }` 的 B 类缺值。
   *  彻底清掉的前提是完整条那颗标落地（届时它自己会消费这两档），或对账脚本给这条选择器做豁免，
   *  两件都不在本轮范围，故按「先 grep 再权衡」保留。 */
  snappedEqHeight: 11,
  snappedEqGap: 1.5,

  /* ---- 贴边态那张「在转的 CD」（2026-10-26；原型 `--mini-cd-*` :root L40-45 +
     `.minibar.is-snapped .mini-art` / `::before` / `::after`，styles.css L796-826）----
   * 碟面 = 原来那张封面（直径 − 8）上压四层光学件：中心孔 / 两道同心纹 / 一道柔光带 / 碟沿。
   * 四层压在**封面图上**、不压在页面底色上，所以跟播放页 `.disc` 同一口径：深浅两套同值，不随主题反相
   * （原型注释：浅色主题下这四层底下压的仍是封面，反相成叠黑反而糊成一块灰）。
   * 故颜色只登记浓度、基色一律取 ART_INK（白 fg / 黑 veil），不进色板。 */
  /** `.mini-art{animation:spin 12s linear infinite}`（L796-801）：一圈 12s 匀速；
   *  播放页那张 `.disc` 是 22s（MOTION.discSpin），48 的小碟走更短一圈 */
  cdSpinMs: 12000,
  /** `.mini-art::after{inset:38%}`（L823-826）→ 孔直径 = 碟径 × 24%（与 PLAYER.discHoleRatio 同源同值） */
  cdHoleRatio: 0.24,
  /** --mini-cd-hole:rgba(0,0,0,.55)（孔底；与 .disc::after 逐字相同） */
  cdHoleAlpha: 0.55,
  /** --mini-cd-hole-line:rgba(255,255,255,.12)（孔内 1px 高光，同为 .disc 那一档） */
  cdHoleRingAlpha: 0.12,
  /** --mini-cd-groove:rgba(255,255,255,.09)：两道同心纹共用的线色浓度 */
  cdGrooveAlpha: 0.09,
  /** 两道纹的半径占**碟半径**的比例（原型 radial-gradient closest-side 的 62% / 84%），线宽各 1px */
  cdGrooveInnerRatio: 0.62,
  cdGrooveOuterRatio: 0.84,
  cdGrooveWidth: 1,
  /** --mini-cd-rim:rgba(255,255,255,.18)：碟沿 1px（与外圈 miniDotLine 分开：那是圆点的边，这是碟的边） */
  cdRimWidth: 1,
  cdRimAlpha: 0.18,
  /** --mini-cd-sheen:rgba(255,255,255,.20)：
   *  `linear-gradient(115deg,transparent 24%,白.20 44%,transparent 64%)`。
   *  三停点各给一档透明度与位置（基色取 ART_INK.fg 由组件合成，不写 'transparent' 关键字——
   *  Android 的 LinearGradient 把 transparent 当 rgba(0,0,0,0)，插值会带出灰黑）；
   *  start/end 是按 CSS 115° 算出的渐变线两端（单位方框坐标，115° = 下行偏右：
   *  方向向量 (sin115°,−cos115°) ≈ (.9063,.4226)，方框边长 S 时半线长 S(.9063+.4226)/2 = .6645S，
   *  于是 start = (.5−.6022, .5−.2808) / end = (.5+.6022, .5+.2808)，可反过来代回 CSS 验算） */
  cdSheenAlphas: [0, 0.2, 0],
  cdSheenStops: [0.24, 0.44, 0.64],
  cdSheenStart: { x: -0.1, y: 0.22 },
  cdSheenEnd: { x: 1.1, y: 0.78 },
  /** 暂停时孔里那枚静三角（`.minibar.is-snapped .mini-dock-mark` 11×11 + `.ic` 7，L846-854 / L860）：
   *  容器透明底、无描边、无模糊，墨色取 ART_INK.fg（--mini-cd-ink:#fff，两套主题同值） */
  cdMarkSize: 11,
  cdMarkIcon: 7,
  /** `.minibar.is-snapped .mini-dock-mark .ic{margin-left:1px}`：静三角的视觉居中补偿 */
  cdMarkIconOffset: 1,
  /** `--mini-morph:.18s`（styles.css L692，2026-10-24 由 .2s 收窄）：两态互相变形的时长。
   *  切 Tab / 进出推入层那几条重置路径不走它——那几帧整页刚重铺，一律一帧落位（见 MinibarHost.applySnap）。 */
  morphMs: 180,
  /** 手势三段门槛（app.js MINI L2589-2594）：<8 点击 / 8–24 弹回 / ≥24 吸附 */
  slop: 8,
  commit: 24,
  /** `--pull:22`：完整条几乎铺满屏宽，拖动只给这一段「拎起来拉一把」的余量 */
  pull: 22,
  /** 完整条拖动余量的压缩比（app.js miniPullPx：`raw * .45` 后钳到 ±pull） */
  pullDamp: 0.45,
  /** `--ease-snap:cubic-bezier(.3,.72,.2,1)`：吸附 / 变形那条缓动 */
  snapEasing: [0.3, 0.72, 0.2, 1],
  /** `--mini-art-alpha`：圆点里封面压到的透明度（深 .70 / 浅 .76，原型 L32 与 L1509） */
  snappedArtAlpha: { dark: 0.7, light: 0.76 },
} as const

/* ================= 底部浮层（.sheet，styles.css L716-733，阶段 9b） ================= */

// 原型 .sheet 是所在层的绝对定位覆盖（遮罩 + 上滑体），RN 侧同构实现为
// 「所在屏幕根 View 内的 absolute-fill 覆盖层」（见 components/Sheet）。
export const SHEET = {
  /** .sheet-mask 底 rgba(0,0,0,.55)（styles.css L710） */
  maskAlpha: 0.55,
  /** .sheet-mask backdrop-filter:blur(3px)（styles.css L710）
   *  2026-10-14 第 14 轮：遮罩接共通毛玻璃依赖 @react-native-community/blur 的 BlurView
   *  真模糊（原「无模糊依赖降级为纯半透明黑」注释作废）；不可用时仍退回纯 .55 黑。 */
  maskBlur: 3,
  /** .sheet-body border-radius:28px 28px 40px 40px（styles.css L712）。
   *  底部 40px 的口径澄清：原型 .screen 是 border-radius:44px + overflow:hidden 的假机框
   *  （styles.css L77），40 是为了让贴底面板外缘嵌合机框圆角；RN 真机面板直接贴物理屏底边，
   *  机框圆角由硬件承担，底部照此口径应为直角 —— 2026-10-14 第 14 轮真机反馈缺陷 1 改 0。 */
  radiusTop: 28,
  radiusBottom: 0,
  /** padding:8px 20px 30px */
  paddingTop: 8,
  paddingX: 20,
  paddingBottom: 30,
  /** max-height:78%（按窗口高折算的滚动上限） */
  maxHeightRatio: 0.78,
  /** 顶边 1px 高光 inset rgba(255,255,255,.1)：取色板 lineStrong（dark .14）近似 */
  /** .sheet-handle 36×4 胶囊（底色 .18 = 色板 overlayStrong），margin 6 auto 14 */
  handleWidth: 36,
  handleHeight: 4,
  handleRadius: 2,
  handleMarginTop: 6,
  handleMarginBottom: 14,
  /** .sheet-sub margin-top:5 / line-height 1.6（12.5px × 1.6 = 20） */
  subMarginTop: 5,
  subLineHeight: 20,
  /** 浮层内「开关/设置行」面板（原型 .eq-switch padding:12px 14px / radius:14 / gap:12）。
   *  2026-10-13 均衡浮层随假能力移除后，此度量归为浮层通用行面板，仍供 TimerSheet 的
   *  「等当前这首放完再停」开关行复用（底 chip / 描边 line 走色板）。 */
  rowPaddingY: 12,
  rowPaddingX: 14,
  rowRadius: 14,
  rowGap: 12,
  /** 动效：遮罩淡入 .3s（= MOTION.slow）、体贴 .4s、整体退场 visibility 延迟 .42s。
   *  token 文件内不能前向引用 MOTION，写死并注明 */
  bodyDuration: 400,
  exitDuration: 420,
  /** 触底判定距离（px）：滚动到距内容底不足此值即视为「到底」，浮层分页用
   *  （RN ScrollView 无 FlatList 式 onEndReachedThreshold 比例语义，取固定像素近似） */
  endReachThreshold: 300,
  /** 浮层虚拟化主体（Sheet 的 list 路径，2026-10-16 评论浮层 OOM 修复轮）的回收参数：
   *  评论卡含回复线程行高约 90~160px，体贴视口最高 78% 窗口高（≈5~7 行），
   *  首屏铺满一屏略有余、批间不空窗；windowSize 与页面级 PageListView 同档 */
  listInitialNumToRender: 8,
  listMaxToRenderPerBatch: 6,
  listWindowSize: 7,
  /** 虚拟化主体（FlatList/VirtualizedList）底部额外补偿 padding：
   *  Sheet body 有 overflow:hidden，若最后一个 item 的 bottom edge 刚好贴到容器底、
   *  又没 getItemLayout 精确算 offset（或 VirtualizedList 窗口边界），就会被裁半截。
   *  保守取一行 SongRow（≈50px）和一行评论（≈160px）的折中，两场景都够。 */
  listBottomCompensation: 100,
} as const

/* ================= 二次确认浮层（QA D-09，#confirmSheet，index.html L498-509；
   .cf-actions / .cf-btn，styles.css L501-505） ================= */

export const CONFIRM_SHEET = {
  /** .cf-actions display:flex gap:10 margin-top:20 */
  actionsGap: 10,
  actionsMarginTop: 20,
  /** .cf-btn flex:1 / height:44 / border-radius:15 / font-size:14 / font-weight:800 */
  btnHeight: 44,
  btnRadius: 15,
  btnFontSize: 14,
  /** .cf-btn:active transform:scale(.98) */
  pressScale: 0.98,
} as const

/* ================= 提示胶囊（.toast，styles.css L795-803 + app.js L101-107，QA D-09 观感） ================= */

// 原型 .toast 是深色贴片胶囊（--glass 底 + --glass-ink 字 + 1px --line-strong 描边），
// RN 此前走系统 ToastAndroid 白框——颜色/圆角/时长全收敛到这里，色板键不进本块（glassPatch 家族）
export const TOAST = {
  /** padding:10px 16px（L798） */
  paddingY: 10,
  paddingHorizontal: 16,
  /** border-radius:14px（数值与 RADIUS.control 同但语义不同，就近定义，L611 先例） */
  radius: 14,
  /** font-weight:600（字号 = FONT_SIZE.smallLg，组件侧引用该键；字符串形态直入 RN fontWeight 联合类型） */
  fontWeight: '600',
  /** max-width:78%（按窗口宽折算） */
  maxWidthRatio: 0.78,
  /** bottom:190px（原型 .screen 844 高含 --safe-b 22 → 净 168，RN 侧再加实测底部安全区） */
  bottomGap: 168,
  /** 未示出时下沉位移：transform:translate(-50%,14px) → .show 归零（L797/L803） */
  riseOffset: 14,
  /** 进出场过渡时长 .32s var(--ease)（L801） */
  animDuration: 320,
  /** 停留时长（app.js L107 setTimeout 2000，覆盖重展时重新计时 L106） */
  visibleMs: 2000,
  /** 长文案档：原调用位以 'long' 标记的长句（原型只有 2000 一档，此值是 RN 侧自定参数，
   *  对齐 ToastAndroid.LONG 的 3.5s 量级，避免长句读不完） */
  visibleMsLong: 3500,
  /** box-shadow:0 16px 40px -12px rgba(0,0,0,.8)（L800）：负 spread 无法表达，降 opacity 近似 */
  shadowColor: '#000000',
  shadowOffsetY: 16,
  shadowRadius: 40,
  shadowOpacity: 0.5,
  elevation: 10,
} as const

/* ================= 评论行（.cmt-*，styles.css L632-646，阶段 9b） ================= */

export const COMMENT = {
  /** .cmt-total b 19px（FONT_SIZE.headingLg）/ gap:8 / margin-bottom:2 */
  totalGap: 8,
  totalMarginBottom: 2,
  /** .cmt-item gap:11 / padding:13px 0 / border-top 1px line */
  itemGap: 11,
  itemPaddingY: 13,
  /** .cmt-item .art 34×34 全圆 */
  avatarSize: 34,
  /** .cmt-line gap:8；.cmt-like gap:4、图标 13 */
  lineGap: 8,
  likeGap: 4,
  likeIcon: 13,
  /** meta 行（用户名 · 时间 · 点赞）内元素间距——比旧 lineGap 略紧，meta 是一簇视觉 */
  metaGap: 6,
  /** .cmt-text margin-top:4 / line-height 1.55（13 × 1.55 ≈ 20） */
  textMarginTop: 4,
  textLineHeight: 20,
  /** .cmt-reply margin-top:7 / padding:8px 10px / radius:10（底 .05 归 chip） */
  replyMarginTop: 7,
  replyPaddingY: 8,
  replyPaddingX: 10,
  replyRadius: 10,
  /* ---- 回复层级（bug-fix「评论浮窗」第 2 条，2026-10-13）----
   * 原型只画了单层 .cmt-reply 样例，以下三项为新 UI 在同一设计语言下的自造度量。 */
  /** 回复线程每级缩进：取 12，贴近 .cmt-item gap 11 / chip padding 10 的量级，不散写魔数 */
  replyIndent: 12,
  /** 回复线程左侧竖线宽（层级线索）：1px 在深底 surface 上几乎看不见，2px 才可读 */
  threadRuleWidth: 2,
  /** 回复线程与上级评论之间的间距 */
  threadMarginTop: 6,
  /**
   * 回复呈现深度上限：实测五平台（kw/wy/tx/mg/kg）comment filterComment 给到的结构化
   * 数据最深只有 2 级（根评论 + 一层回复数组，回复项自身不再带 reply），3 是防御性余量——
   * 万一未来出现更深层级，超过上限的回复平铺在限额一级显示，
   * 避免长串回复把正文挤成窄条（参照主流音乐 App 对深层回复停止缩进的做法）。
   */
  maxReplyDepth: 3,
  /** 分页状态行：padding 照抄旧 List.tsx Footer 样式（createStyle footer padding:10） */
  morePadding: 10,
} as const

/* ================= 搜索层（.search-layer，styles.css L776-808，阶段 9b） ================= */

// 原型 .pl-layer 右推转场 transform translateX 100% → 0 / .44s（L394-402），
// 新 UI 用 RNN push + elementTransitions translationX 复刻（见 navigation/entry）。
export const SEARCH = {
  /** 转场时长（.pl-layer transition .44s） */
  enterDuration: 440,
  /** .sc-top padding:54px 14px 12px（54 含 52px 模拟状态栏，真机 = 实测状态栏 + 2） */
  statusBarReserve: 2,
  paddingX: 14,
  paddingBottom: 12,
  gap: 10,
  /** .sc-box 高 40 / 圆角 13 / paddingX 11 / gap 9 / 图标 16；输入 14.5（FONT_SIZE.title） */
  boxHeight: 40,
  boxRadius: 13,
  boxPaddingX: 11,
  boxGap: 9,
  boxIcon: 16,
  /** .sc-box:focus-within 描边 rgba(255,92,138,.5) 1.5px */
  focusRingWidth: 1.5,
  focusRingAlpha: 0.5,
  /** .sc-x 18×18 全圆（底 .18 = overlayStrong）/ 图标 10 */
  clearSize: 18,
  clearIcon: 10,
  /** .sc-cancel 13.5（FONT_SIZE.bodyLg）/ padding:6px 2px */
  cancelPaddingY: 6,
  /** .sc-body padding:0 16px 40px */
  bodyPaddingX: 16,
  bodyPaddingBottom: 40,
  /** .sc-tabs gap:22 / padding:6px 16px 9px；指示条 17×3（bottom -5 → 绝对定位近似） */
  tabsGap: 22,
  tabsPaddingTop: 6,
  tabsPaddingX: 16,
  tabsPaddingBottom: 9,
  tabIndicatorWidth: 17,
  tabIndicatorHeight: 3,
  /** .sc-tabs button.on::after border-radius:2px */
  tabIndicatorRadius: 2,
  /** ::after bottom:-5px：RN 的 bottom 语义与 CSS 相同，横条底边压到文字盒下方 5px */
  tabIndicatorPad: 5,
  /** .sc-tabs em 11px，左距 5，opacity .65 */
  tabCountMarginLeft: 5,
  tabCountOpacity: 0.65,
  /** .sc-label margin:18px 0 10px */
  labelMarginTop: 18,
  labelMarginBottom: 10,
  /** .sc-clear 11.5 / 图标 13 */
  clearWordIcon: 13,
  /** .hot-words gap:8（与 .q-chips 相同，另见 CHIP_FLOW） */
  wordsGap: 8,
  /** .sc-empty padding:46px 0 / 12.5 line-height 1.9 ≈ 24；b 14（FONT_SIZE.rank 档） */
  emptyPaddingY: 46,
  emptyLineHeight: 24,
  /** .sc-hint margin-top:16 */
  hintMarginTop: 16,
} as const

/* ================= 歌单详情层（.pl-layer，styles.css L394-431，阶段 9c） ================= */

// 原型 .pl-layer 是「右推整页 + 层内整体滚动」：顶排 / hero / 操作排都在滚动内容里，
// RN 侧用 FlatList 的 ListHeaderComponent 承载（见 screens/SonglistDetail）。
// 转场与搜索层同源（同一条 .pl-layer 规则），此处独立成块供 entry 与页面取度量。
export const PL_LAYER = {
  /** 右推转场时长（.pl-layer transition transform .44s，与 SEARCH.enterDuration 同源同值） */
  enterDuration: 440,
  /** .pl-layer padding:58px 16px 34px（58 含 52px 模拟状态栏，真机 = 实测状态栏 + 6） */
  paddingTopReserve: 6,
  paddingX: 16,
  paddingBottom: 34,
  /**
   * .pl-bg inset:0 height:56% opacity:.42（blur(64) 不可用：降级为封面种子渐变直接铺底）。
   * 降级后必须走 `CoverWash`：显式压在内容之下 + 整层不吃触摸 + 下沿渐隐（原型的模糊自带收边）。
   */
  bgHeightRatio: 0.56,
  bgAlpha: 0.42,
  /** .pl-hero margin:22px 0 2px / gap 14 / min-height 124 */
  heroMarginTop: 22,
  heroMarginBottom: 2,
  heroMinHeight: 124,
  heroGap: 14,
  /** .pl-hero .art 124×124（圆角走 RADIUS.art=20；外投影负 spread 无法表达，取 SHADOW.card 近似） */
  heroArtSize: 124,
  /** .ph-body gap:6；h3 18(=FONT_SIZE.heading)/900 lh1.35；.ph-sub 11.5(FONT_SIZE.captionLg) lh1.5 */
  heroBodyGap: 6,
  heroTitleLineHeightRatio: 1.35,
  heroSubLineHeightRatio: 1.5,
  /** .ph-meta gap:6 / 10.5px(FONT_SIZE.tiny)；.sep 竖线 1×9 */
  metaGap: 6,
  metaSepWidth: 1,
  metaSepHeight: 9,
  /** .pl-actions margin:18px 0 16px / gap:8（ghost 占 flex:1；icon-btn 走 BUTTON.iconSizeLg 档） */
  actionsMarginTop: 18,
  actionsMarginBottom: 16,
  actionsGap: 8,
} as const

/* ================= 选项行（.group-label / .opt-row / .radio，styles.css L670-687，阶段 9d） ================= */

// 音源设置浮层（#sourceSheet）的「已安装音源 / 音乐平台」两组列表行；
// 后续任何「单选列表浮层」都复用它。底色 rgba(255,255,255,.045) 归到色板 chip(.055)、
// 描边 inset line 归到色板 line（已知近似）；选中态渐变走 GRADIENTS.brandSoft（原型 --grad-soft L677）。
export const OPTION_ROW = {
  /** .group-label：10.5 / 800 / letter-spacing 1.3 / text-3 / margin 20 0 9 */
  labelSize: 10.5,
  labelLetterSpacing: 1.3,
  labelMarginTop: 20,
  labelMarginBottom: 9,
  /** .group-label.fold：右槽（折叠开关）与组名的间距（styles.css L776，件 group-label.css L13） */
  labelFoldGap: 10,
  /** .opt-list gap:7 */
  listGap: 7,
  /** .opt-row：gap 11 / padding 11 12 / radius 15 */
  gap: 11,
  paddingY: 11,
  paddingX: 12,
  radius: 15,
  /** .opt-row.on 描边 inset rgba(255,92,138,.34)（RN 无 inset，转 1px 实描边） */
  onBorderColor: 'rgba(255, 92, 138, 0.34)',
  /** .opt-row.off opacity */
  offAlpha: 0.42,
  /** .radio：18×18 全圆，未选 1.6px 内环（原型改版后走 var(--hairline-strong)，随主题反相，
   *  原 radioRingAlpha / radioCenterRingAlpha 两个白环浓度键因此失去用途，2b 轮清理） */
  radioSize: 18,
  radioRingWidth: 1.6,
  /** 选中：inset 6px 主色 → 中心留 18-6×2=6 亮环（同为 --hairline-strong） */
  radioFill: 6,
  radioCenterRingWidth: 1.6,
  /** .or-body gap:3；b 14/700；small 10.5/600；em 11 */
  bodyGap: 3,
  versionGap: 6,
  /** .or-state：10.5 / 800，前 6px 圆点，gap:5 */
  stateGap: 5,
  stateDotSize: 6,
  /** .opt-ic（styles.css L688-690，单曲操作面板动作行图标底）：30×30 圆角 10，
   * 底 rgba(255,255,255,.07) 归色板 glass、描边归 line、图标 16 取 text-2 */
  iconBoxSize: 30,
  iconBoxRadius: 10,
  iconBoxIcon: 16,
  /** .opt-row:active scale(.99) */
  pressScale: 0.99,
} as const

/* ================= 设定页分组行（.set-hero / .set-group / .set-list / .set-row，styles.css L436-456，2026-10-13） ================= */

// 原型 styles.css 只给深色一套：列表底 rgba(255,255,255,.045) 归色板 chip（同 StatRow 口径）、
// 1px 内描边与 .set-row border-top 归 line、按压态 rgba(255,255,255,.07) 归 press（近似，原型 .07 vs 色板 .06）、
// .set-ic 底 rgba(255,255,255,.07) 归 glass、.set-row.on 底走 GRADIENTS.brandSoft（--grad-soft L17）。
// .sg-label 与 .group-label 字号/字重/字距/下距完全一致，共通组件 GroupLabel 直接复用。
export const SETTINGS = {
  /** .set-hero margin:8px 2px 2px */
  heroMarginTop: 8,
  heroMarginX: 2,
  heroMarginBottom: 2,
  /** .sh-sub 12px / line-height 1.65（12 × 1.65 ≈ 20） */
  heroSubSize: 12,
  heroSubLineHeight: 20,
  /** .set-group margin-top:26px（Pad 侧 .pad 规则为 22，手机端取主规则 26） */
  groupMarginTop: 26,
  /** .sg-label margin:0 0 9px 3px（下距 9 由 GroupLabel 自带，这里补左距并抹掉其上距） */
  groupLabelMarginLeft: 3,
  /** .set-list border-radius:18px → 组件直接用 RADIUS.m（该键注释即 .set-list，语义相同） */
  /** .set-row gap:11 / padding:13px 14px */
  rowGap: 11,
  rowPaddingY: 13,
  rowPaddingX: 14,
  /** .set-ic 28×28、圆角 9；内部 .ic 15 */
  iconBoxSize: 28,
  iconBoxRadius: 9,
  iconGlyphSize: 15,
  /** .st-l gap:2 */
  bodyGap: 2,
  /** .st-l b 14 / 700 / letter-spacing .1（数值与 FONT_SIZE.rank 同但语义不同，就近定义，同 L611 先例） */
  titleSize: 14,
  titleLetterSpacing: 0.1,
  /** .st-l em 11 / line-height 1.45（≈16） */
  hintSize: 11,
  hintLineHeight: 16,
  /** .st-r gap:4 / 12 / 600；.ic 14 / opacity .5 */
  valueGap: 4,
  valueSize: 12,
  valueIconSize: 14,
  valueIconAlpha: 0.5,
  /**
   * 可点行的按压底色补间时长：`.set-row{transition:.18s var(--ease)}`（styles.css L626）
   * + `.set-row:active{background:var(--fill-1)}`（L628）。
   * `.18s` 是本族唯一一档（其余多为 .2s），故不能套 `MOTION.fast` 的 200。
   * 另注：`.set-row.info`（不可点的信息行）原型写的是 `:active{background:transparent}`（L642）——
   * RN 侧对应「onPress 不传 → 渲染成纯 View」，压根没有按压态，这一条无需另做键。
   */
  rowPressMs: 180,
} as const

/* ================= 单曲操作面板头部（.more-song，styles.css L446-451，阶段 9e） ================= */

// #moreSheet 顶部的「封面 + 歌名 + 平台徽标 + 歌手 · 专辑」信息排；
// 歌名 14.5 走 FONT_SIZE.title（.ms-t L450）、副行 11.5 走 captionLg（.ms-s L451）、
// 分隔线描边归色板 line（L447 border-bottom 1px solid var(--line)）。
export const MORE_SONG = {
  /** display:flex gap:11（L447） */
  gap: 11,
  /** padding-bottom:13 / margin-bottom:13（L447） */
  paddingB: 13,
  marginB: 13,
  /** .more-song .art 44×44 / radius 11（L448） */
  artSize: 44,
  artRadius: 11,
  /** .ms-s margin-top:3；行内 badge 与文字 gap:6（app.js L732 内联样式） */
  subMarginTop: 3,
  subGap: 6,
} as const

/* ================= 输入行（.op-box / .op-input / .op-go，styles.css L763-774，阶段 9d） ================= */

// 原型「打开歌单」贴链接输入行；音源浮层的「导入音源」同款复用。
// 输入底 rgba(255,255,255,.07) 归到色板 glass、描边归 line（同 .sc-box L711-712 口径）。
export const OP_BOX = {
  gap: 9,
  marginTop: 16,
  /** .op-input / .op-go 高 42 */
  height: 42,
  inputRadius: 13,
  inputPaddingX: 14,
  /** .op-input:focus 描边 1.5px rgba(255,92,138,.5)（同 SEARCH.focusRing*） */
  focusRingWidth: 1.5,
  focusRingAlpha: 0.5,
  goRadius: 13,
  goPaddingX: 18,
  /** .op-go:active scale(.955) */
  goPressScale: 0.955,
  /** `.op-go{transition:.16s var(--ease)}`（styles.css L941）——本族最快的一档，比 MOTION.fast 还短 40ms */
  goPressMs: 160,
  /** .op-err：margin-top 10 / 11.5 / 行高 1.65 / #FF8B7E（= 色板 err） */
  errMarginTop: 10,
  errLineHeight: 19,
} as const

/* ================= 本机导入钮（.op-file，styles.css L813-817，件 op-box.css L31-37） ================= */

// 音源浮层「从本机选择一份音源文件」那枚次级整宽钮：与 .op-go 同族但降一档（无渐变、无投影），
// 原型把它做成 label 包隐藏 file input，RN 侧对应 selectFile() 系统选取器（方案 A 单路）。
export const OP_FILE = {
  /** margin-top:9（贴在 .op-box 下面，比组标题的 16 近一档） */
  marginTop: 9,
  height: 40,
  radius: 13,
  /** 图标与文字间距 6；图标 15 */
  gap: 6,
  iconSize: 15,
  /** .op-file:active scale(.99) */
  pressScale: 0.99,
} as const

/* ================= 「修改」浮层的头像一行（.av-box / .av-preview / .av-acts，styles.css L1089-1097） ================= */

/**
 * 2026-10-24 原型把 #nameSheet 扩成「昵称 + 头像」两件事，头像一行是：
 * 左边一颗 64 的圆预览（就是顶栏那颗圆放大一号），右边两枚 .op-file 次级钮上下叠
 * （选一张本机图片 / 改回昵称首字）。预览本身走共通件 BrandAvatar（同一个渐变首字 / 同一张图），
 * 这里只登记这一行的几何：外框 14 间距、距副题 16、预览 64 见方、右列两钮之间 8。
 * 圆角取 RADIUS.full（原型 `border-radius:50%` 的百分比圆在 RN 就是全圆），预览首字字号 24 是本行专属
 * （比我的页 .mh-art 的 26 小一号），字重与字距沿用 FONT_WEIGHT.black / LETTER_SPACING.wider（原型 .av-preview 的 900 / .5）。
 */
export const AVATAR_ROW = {
  /** .av-box：display:flex / align-items:center / gap:14（L1092） */
  gap: 14,
  /** .av-box：margin-top:16（贴 .sheet-sub 之下，与 .op-box 的 16 同档） */
  marginTop: 16,
  /** .av-preview：64×64 见方（L1093） */
  previewSize: 64,
  /** .av-preview：font-size:24（L1095；同一规则里 font-weight:900 / letter-spacing:.5 归上面两族 token） */
  previewFontSize: 24,
  /** .av-acts：两枚次级钮上下叠，gap:8（L1096）；`.av-acts .op-file{margin-top:0}`（L1097）由列内不留上边距表达 */
  actsGap: 8,
} as const

/* ================= 行尾移除钮（.or-del，styles.css L771-774，件 opt-list.css L43-48） ================= */

// 「已安装音源」每行行尾那棵垃圾桶：只在带移除动作的列表行出现（原型 comment「只在这份列表里出现」）。
// 常态取 text-3 墨色，按下才转 dangerInk（原型 :active{color:var(--danger-ink)}，不做常驻红钮）。
export const OR_DEL = {
  size: 28,
  radius: 9,
  iconSize: 14,
  /** .or-del:active scale(.9) */
  pressScale: 0.9,
  /** RN 触控放大：28×28 低于系统最小热区，外扩 6 补足（件里 CSS 无对应物，属 RN 侧适配） */
  hitSlop: 6,
} as const

/* ================= 列表折叠开关（.fold-toggle / .fold-more，styles.css L777-787，件 group-label.css L15-24 / opt-list.css L51-55） ================= */

// 组标题右侧的折叠开关：文字 + 一颗 chevron，靠旋转分收合两态。
// 件里 rotate(90deg)（合，箭头朝下＝「展开」）↔ rotate(270deg)（开，箭头朝上＝「收起」）；
// RN 的 transform rotate 同为顺时针，角度直接照搬。
export const FOLD_TOGGLE = {
  gap: 2,
  /** 件里 padding:2px 0 + margin:-2px -2px 是同一件事（扩热区不改布局）；RN 不认负 margin，
   *  竖向留 padding、横向交给 hitSlop，两个用途共用这一个数 */
  hitPadding: 2,
  fontSize: 11,
  iconSize: 13,
  /** .fold-toggle .ic{opacity:.7} */
  iconAlpha: 0.7,
  /** 两态箭头角（件 L20 / L22） */
  iconAngleCollapsed: '90deg',
  iconAngleExpanded: '270deg',
} as const

// 列表尾「还有 N 个音源没显示」行：整行可点，与开关做的是同一件事（两条入口都通向展开）。
export const FOLD_MORE = {
  paddingY: 9,
  paddingX: 12,
  radius: 13,
  fontSize: 11.5,
  /** .fold-more:active scale(.99) */
  pressScale: 0.99,
} as const

/* ================= 换行胶囊组（.q-chips styles.css L760 / .hot-words L804） ================= */

export const CHIP_FLOW = {
  /** 两条规则同为 flex-wrap gap:8px，合并一个度量 */
  gap: 8,
} as const

/* ================= 字体 ================= */

export const FONT_SIZE = {
  /** .sr-src 来源角标 */
  micro: 9.5,
  /** .q-tag / .b-tag */
  tiny: 10.5,
  /** .recent-card .rs / .pl-card .ps */
  caption: 11,
  /** .quick span / .sr-sub */
  captionLg: 11.5,
  /** .daily-card p */
  small: 12,
  /** .chip / .section-more */
  smallLg: 12.5,
  /** .searchbar .ph / .pl-card .pt */
  body: 13,
  /** .ghost-btn */
  bodyLg: 13.5,
  /** .song-row .rank */
  rank: 14,
  /** .sr-title / .sc-input */
  title: 14.5,
  /** .sb-time 状态栏时间 */
  status: 15,
  /** .more-song .ms-t */
  titleLg: 15.5,
  /** .section-sub 区段小标题 */
  headingSm: 16,
  /** .stat b 统计数字 */
  statValue: 17,
  /** .daily-card h3 */
  heading: 18,
  /** .section-title */
  headingLg: 19,
  /** .sheet-title 浮层大标题（styles.css L668） */
  sheetTitle: 20,
  /** .player-info h3 播放页曲名 */
  playerTitle: 21,
  /** .mh-name 昵称 */
  mineName: 20,
  /** .banner h3 / .page-title */
  display: 22,
  /** .page-title（歌单 / 排行 / 设定页大标题） */
  displayLg: 24,
  /** .mh-art b 头像首字 */
  mineInitial: 26,
} as const

export const FONT_WEIGHT = {
  medium: '500',
  semibold: '600',
  bold: '700',
  extraBold: '800',
  black: '900',
} as const

/** 字距（对应原型 letter-spacing） */
export const LETTER_SPACING = {
  tight: 0.2,
  normal: 0.3,
  wide: 0.4,
  wider: 0.5,
  kicker: 1,
  kickerWide: 1.6,
} as const

/* ================= 动效 ================= */

// --ease: cubic-bezier(.22,.61,.36,1)；时长提取自各 transition / animation
export const MOTION = {
  /** 交互反馈（.icon-btn:active 等） */
  fast: 200,
  /** 常规过渡（.chip 等） */
  base: 220,
  /** 页面 / 状态切换（.topbar pinned、浮层） */
  slow: 300,
  /** 开关轨道与旋钮（.toggle transition .28s） */
  toggle: 280,
  /** 呼吸灯周期（.pulse-dot） */
  pulse: 2200,
  /** 正在播放均衡条周期（.eq） */
  eq: 1000,
  /** 唱片自转一圈（.disc animation:spin 22s） */
  discSpin: 22000,
  /** 标准缓动曲线（Easing.bezier 参数） */
  easing: [0.22, 0.61, 0.36, 1],
  /** ScrollView.onScroll 事件节流（ms），分页触底检测用 */
  scrollThrottle: 16,
  /**
   * 封面图加载完成的淡入（ms）。RN 侧改进项：原型封面是硬切（CSS 没有对应 transition），
   * 真机网络图解码完那一下会「啪」地换脸，补一层短淡入（150–200 档的中间值）。
   */
  artFade: 170,
  /**
   * 整块内容替换的状态档切换淡入（ms）。同样原型无（DOM 直换），RN 侧为「输入 → 在途 → 结果」
   * 这类整块换面补一层轻淡入；只在状态档变化时触发，数据在同一档内刷新不重放。
   */
  contentFade: 120,
} as const

/* ================= 阴影 ================= */

// CSS box-shadow 含负 spread，RN 无法完全表达，取视觉近似；
// 原型主张以「表面色 + 1px 描边 + 模糊」分层，阴影仅少量场景使用
export const SHADOW: Record<
  'card' | 'float' | 'knob' | 'chrome' | 'glow' | 'playerMain' | 'miniPrimary' | 'lrcFloat' | 'ghostSolid',
  ShadowSpec
> = {
  /** --shadow 0 18px 44px -18px rgba(0,0,0,.75) */
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 36,
    elevation: 10,
  },
  /** .minibar 0 -2px 40px -10px rgba(0,0,0,.7) */
  float: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 14,
  },
  /** .toggle i 旋钮 0 2px 6px rgba(0,0,0,.4)（blur 6 折算为 radius 3） */
  knob: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  /** .topbar.pinned 0 12px 26px -18px rgba(0,0,0,.9)（负 spread 无法表达，降 opacity 近似） */
  chrome: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 13,
    elevation: 6,
  },
  /** .tab.is-active::before 0 0 12px rgba(255,92,138,.8) 主色光晕 */
  glow: {
    shadowColor: '#FF5C8A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  /** .pc.main 0 14px 34px -12px rgba(255,92,138,.85)（负 spread 无法表达，降 opacity 近似） */
  playerMain: {
    shadowColor: '#FF5C8A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 10,
  },
  /** .mini-act.primary 0 6px 16px -6px rgba(255,92,138,.8) */
  miniPrimary: {
    shadowColor: '#FF5C8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 6,
  },
  /** .lrc-float 0 14px 32px -12px rgba(0,0,0,.85)（U61 轮；负 spread 无法表达，
   *  同 .toast 口径降 opacity 近似：offsetY 14 / radius 32 / alpha .85 → .5 档） */
  lrcFloat: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 10,
  },
  /** .ghost-btn.solid 0 14px 28px -16px rgba(255,92,138,.9)（styles.css L330，_base L202；
   *  负 spread 无法表达，同 playerMain 口径折算：radius 28-16=12、alpha .9 → .5 档） */
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
 * 顶栏总高（原型 .topbar padding 54/16/10 + 行高 46）。
 * 原型 54 中已含 52px 模拟状态栏，真机改为「实测状态栏 + statusBarReserve 微调」。
 * 顶栏高度与滚动内容上留白共用此值（.viewport padding-top:110px 即顶栏高）。
 *
 * 宽屏档传第二个入参（`useWideLayout().wide`，来源 `wideStructuralOf`）：原型
 * `.wide .topbar{padding:36px 22px 10px}`（styles.css:1314）+ 行高 46 = 92，与
 * `.wide .viewport{padding-top:92px}`（styles.css:1315）互为对账——那条 36 = 32 状态栏 + 4，
 * 故本函数在宽屏档用 `wide.statusReserve`（4）替掉竖屏的 2，代实测状态栏即得顶栏总高。
 * 不传（compact）逐值与改前完全相同。
 */
export const topbarHeight = (statusBarHeight: number, wide?: WideStructural): number =>
  statusBarHeight + (wide?.statusReserve ?? TOP_BAR.statusBarReserve) + TOP_BAR.rowHeight + TOP_BAR.paddingBottom

/**
 * 轻量宽屏的三档标识（判据 = 屏内宽；原型的屏内宽 = 外框宽 − 11×2（app.js:3491），
 * RN 的窗口宽即同一条屏内宽，换算见上方 `WIDE` 块注释；阈值 600 / 840 出自 app.js:3485 `WIDE_TIERS`）。
 * compact 即手机竖屏档：列数、间隙、内容盒与结构度量都与分档之前逐值一致。
 */
export type WideTier = 'compact' | 'medium' | 'expanded'

/** 屏内宽 → 档位（< 600 compact / 600-839 medium / ≥ 840 expanded，判据同 app.js:3492） */
export const wideTierOf = (windowWidth: number): WideTier => {
  if (windowWidth < WIDE.compactUpper) return 'compact'
  return windowWidth < WIDE.mediumUpper ? 'medium' : 'expanded'
}

/** 该档的栅格列数：compact 仍取 CARD_GRID.columns（2），medium 3，expanded 4 */
export const wideColumnsOf = (windowWidth: number): number => {
  switch (wideTierOf(windowWidth)) {
    case 'medium': return WIDE.mediumColumns
    case 'expanded': return WIDE.expandedColumns
    default: return CARD_GRID.columns
  }
}

/**
 * 该档的栅格间隙（行 / 列）：medium 16×14（styles.css:1318 / 1320）、expanded 16×12
 * （styles.css:1319 / 1321）；**compact 返回 undefined** = 消费侧继续吃 CARD_GRID 的 14×12 基线。
 */
export const wideGridGapOf = (windowWidth: number): { rowGap: number, columnGap: number } | undefined => {
  switch (wideTierOf(windowWidth)) {
    case 'medium': return { rowGap: WIDE.mediumRowGap, columnGap: WIDE.mediumColumnGap }
    case 'expanded': return { rowGap: WIDE.expandedRowGap, columnGap: WIDE.expandedColumnGap }
    default: return undefined
  }
}

/** 该档的内容盒限宽；compact 返回 undefined = 不限宽（样式侧等价于「根本没写 maxWidth」） */
export const wideContentMaxWidthOf = (windowWidth: number): number | undefined =>
  wideTierOf(windowWidth) === 'compact' ? undefined : WIDE.contentMaxWidth

/**
 * 该档的结构度量覆盖（medium / expanded 共用同一组，原型 `.wide` 那族规则不分列数档）；
 * compact 返回 undefined —— 消费侧写 `wide?.xxx ?? 竖屏基线 token`，竖屏那侧不落任何宽样式。
 * 返回的是模块级同一个对象引用（memo 组件的样式数组不因档位对象换引用而失效）。
 */
export const wideStructuralOf = (windowWidth: number): WideStructural | undefined =>
  wideTierOf(windowWidth) === 'compact' ? undefined : WIDE_STRUCTURAL

/**
 * 单列行屏那根「620 居中轴」的左右内衬：原型 `max(16px, calc((100% - 620px) / 2))`
 * （styles.css:1335-1340 的 #plLayer / #episodeLayer / .pl-head / #offlineLayer>.off-list /
 * #radioLayer>.pod-list / #podcastLayer>.ep-list 六处同式，100% = 该屏内宽 = RN 窗口宽）。
 * 窗口比 620 窄时自动退回 16（算不出负内衬）；compact 返回 undefined = 吃各自竖屏基线（都是 16）。
 */
export const wideLayerPaddingXOf = (windowWidth: number): number | undefined =>
  wideTierOf(windowWidth) === 'compact'
    ? undefined
    : Math.max(LAYOUT.screenPaddingX, (windowWidth - WIDE.contentMaxWidth) / 2)

/**
 * 内容盒实际宽 = min(窗口宽, 该档限宽 620)（styles.css:1316 `.wide .page{max-width:620px}`）。
 * 「按屏宽算尺寸」的三条派生度量（网格单卡 / 快捷四格 / 轮播满宽）都先过这一道，
 * 卡片才不会在限宽居中的内容盒里按整屏宽铺开；compact 档此函数是恒等映射（零变化）。
 * 净宽口径：盒宽先收、再减 `.page` 左右各 16，620 的盒给的是 **588** 净宽（原型 headless 实测
 * 4 列 138 = (588 − 12×3)/4、3 列 186.67 = (588 − 14×2)/3），下面的三个函数都按这条推。
 */
export const wideContentWidth = (windowWidth: number): number => {
  const maxWidth = wideContentMaxWidthOf(windowWidth)
  return maxWidth === undefined ? windowWidth : Math.min(windowWidth, maxWidth)
}

/**
 * 网格单卡宽度：(内容盒宽 - 两侧 .page 内边距 - 列间隙 × (列数 - 1)) / 列数。
 * RN 无 CSS 的 1fr，凡是用 CardGrid 摆卡片的场合都靠它算出封面边长（.pl-card .art 为 1:1）。
 * 入参仍叫 windowWidth（各处直传 useWindowDimensions 的宽），**盒宽换算在函数内先做**
 * （wideContentWidth 收盒 → 再算列），行总宽恒等于盒净宽、不溢出。
 */
export const gridItemWidth = (windowWidth: number, columns: number, columnGap: number): number =>
  (wideContentWidth(windowWidth) - LAYOUT.screenPaddingX * 2 - columnGap * (columns - 1)) / columns

/**
 * 快捷入口单格宽度（.quick-row 的 repeat(4,1fr)：盒宽减两侧内边距与三个间隙后四等分）。
 */
export const quickItemWidth = (windowWidth: number): number =>
  (wideContentWidth(windowWidth) - LAYOUT.screenPaddingX * 2 - QUICK_ROW.gap * (QUICK_ROW.columns - 1)) /
  QUICK_ROW.columns

/**
 * 轮播单卡宽度（.banner width:100%，相对 .page 内容盒）。
 * 横滑的 snapToInterval = 卡宽 + 轨道间隙，故一并给出步长。
 * 盒宽同样过 wideContentWidth：限宽居中后轮播不能比内容盒还宽。
 */
export const bannerItemWidth = (windowWidth: number): number =>
  wideContentWidth(windowWidth) - LAYOUT.screenPaddingX * 2

/* ================= 品牌首字头像（.avatar-btn .avatar / .mh-art 共通化） ================= */

/**
 * 顶栏左上角（.avatar-btn 34px）与「我的」页头部（.mh-art 58px）两处头像是同一视觉家族：
 * 品牌粉→紫对角渐变圆底 + 居中文本首字（原型 app.js renderProfile 保证两处同一个字）。
 * 2026-10-12 真机走查反馈两处「样式不一致」：原型里首字色（.avatar #fff vs .mh-art #12060c）、
 * 描边与角度本就写了两份，落地后并排看尤其突兀。现收敛为共通组件 BrandAvatar，
 * 唯一差异是直径与字号（引用既有 token，不再各自硬写）；
 * 渐变统一取 GRADIENTS.art，字色统一取主题 onGradient（原型品牌渐变上白字的主惯例）。
 * 放在文件末尾：需引用 FONT_SIZE（定义在后段）。
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
