/** 主题模式：浅色 / 深色 / 跟随系统 */
export type ThemeMode = 'light' | 'dark' | 'system'

/** 实际生效的配色方案（system 解析后的结果） */
export type ThemeScheme = 'light' | 'dark'

/**
 * 语义色板：浅色与深色共用同一套键名，仅取值不同；组件一律从这里取，禁止写死色值。
 */
export interface ThemeColors {
  /** 中性底 --bg */
  bg: string
  /** 次级底 --bg-soft */
  bgSoft: string
  /** 卡面 --surface */
  surface: string
  /** 卡面抬升 --surface-2 */
  surface2: string
  /** 卡面再抬升 --surface-3 */
  surface3: string
  /** 细分割线 --line */
  line: string
  /** 强分割线 --line-strong */
  lineStrong: string
  /** 主文字 --text */
  text: string
  /** 次级文字 --text-2 */
  text2: string
  /** 三级文字 --text-3 */
  text3: string
  /** 品牌主色 --brand */
  brand: string
  /** 品牌辅色 --brand-2 */
  brand2: string
  /** 品牌点缀色 --brand-3 */
  brand3: string
  /** 成功 / 可用 --ok */
  ok: string
  /** 正在播放行 1px 内描边 */
  playingBorder: string
  /** 渐变上的文字 / 图标色 */
  onBrand: string
  /** 渐变底上的白字 */
  onGradient: string
  /** brand 16% 洗底（选中态图标按钮底） */
  brandWash: string
  /** 开关轨道底色（off 态） */
  switchOff: string
  /** 开关旋钮色（恒为白，浅深同值） */
  switchKnob: string
  /** 屏幕背景辉光 A（紫） */
  glowA: string
  /** 屏幕背景辉光 B（粉） */
  glowB: string
  /** 封面底部压暗遮罩起点色 */
  artScrim: string
  /** 播放进度条轨道底（浅档为同浓度深灰） */
  seekTrack: string
  /* ==== 语义化填充 / 描边 / 贴片 token ==== */
  /** --fill-1：行按下的瞬时底色 */
  fill1: string
  /** --fill-2：控件底（chip / 图标按钮 / 输入框 / 次级按钮） */
  fill2: string
  /** --fill-3：控件按压加重 */
  fill3: string
  /** --fill-4：结构件底（进度轨 / 开关底 / 清除角标 / 拖拽条） */
  fill4: string
  /** --hairline：1px inset 细描边 */
  hairline: string
  /** --hairline-strong：1px inset 强描边 */
  hairlineStrong: string
  /** --card：分组容器底（深=叠白；浅=实心白）；仅在 colors 命名空间内 */
  card: string
  /** --glass：浮在封面图上的毛玻璃贴片底 */
  glassPatch: string
  /** --glass-ink：图上毛玻璃贴片上的文字色 */
  glassPatchInk: string
  /** --danger-ink：危险文案色（深底亮珊瑚 / 浅底深红，按底反转保对比） */
  dangerInk: string
  /** 歌词当前行投影色；深色浓、浅色淡，半径/偏移见 PLAYER.lyricGlow* */
  lyricGlow: string
  /* ==== 磁吸圆点那一族 ====
   * 迷你播放条贴边态的底 / 外圈进度弧 / 发丝描边；底色比 glassPatch 薄一档，以透出底下内容。 */
  /** --mini-veil：圆点底，比 --glass 薄一档 */
  miniVeil: string
  /** --mini-ring：外圈进度弧的整环底色 */
  miniRing: string
  /** --mini-dot-line：圆点外缘 1px 发丝描边 */
  miniDotLine: string
}

/** 主题对象：配色方案 + 色板 */
export interface Theme {
  scheme: ThemeScheme
  colors: ThemeColors
}

/** 渐变描述（数据层，与 react-native-linear-gradient 解耦） */
export interface GradientSpec {
  colors: readonly string[]
  start: { readonly x: number, readonly y: number }
  end: { readonly x: number, readonly y: number }
}

/**
 * 玻璃层规格（BlurredContainer 的输入）：intensity 对应 CSS blur 半径，
 * tintBase × tintAlphas 对应 background 染色；色值一律引用色板键，禁止写死。
 */
export interface GlassLayerSpec {
  /** 模糊半径（Android 侧库内折算 ≈×0.8 且封顶 25） */
  intensity: number
  /** 染色基色：色板键 */
  tintBase: keyof ThemeColors
  /** 染色分段 alpha（沿 start→end 方向）；省略则直取 colors[tintBase] 原值 */
  tintAlphas?: readonly number[]
  /** 分段位置（与 tintAlphas 等长；缺省均布） */
  tintLocations?: readonly number[]
  start: { readonly x: number, readonly y: number }
  end: { readonly x: number, readonly y: number }
  /** 真模糊不可用时的降级打底色键（不透明表面色） */
  fallbackBase: keyof ThemeColors
}

/** 阴影预设（CSS box-shadow 的 RN 近似，负 spread 无法表达） */
export interface ShadowSpec {
  shadowColor: string
  shadowOffset: { width: number, height: number }
  shadowOpacity: number
  shadowRadius: number
  elevation: number
}

/** 主题上下文值 */
export interface ThemeContextValue {
  /** 用户选择的模式 */
  mode: ThemeMode
  /** 解析后的实际配色方案 */
  scheme: ThemeScheme
  /** 当前主题对象 */
  theme: Theme
  /** 切换模式（自动持久化） */
  setMode: (mode: ThemeMode) => void
}
