/** 主题模式：浅色 / 深色 / 跟随系统 */
export type ThemeMode = 'light' | 'dark' | 'system'

/** 实际生效的配色方案（system 解析后的结果） */
export type ThemeScheme = 'light' | 'dark'

/**
 * 语义色板：浅色与深色共用同一套键名，仅取值不同。
 * 深色值精确提取自 new_design/styles.css 的 :root 与散落规则；浅色值取自同一文件的 .phone.light 档。
 * 原型没有对应物的早期自造键（err / glass / glassStrong / chip / overlay / overlayStrong /
 * glassBorder / tagBorder / press / pressStrong）已整组删除——组件侧全部迁到了 fill / hairline /
 * card / glassPatch / lineStrong 这套与原型同名的 token，留着只会在浅色档上留非原型值（QA D80）。
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
  /** 正在播放行 1px 内描边（.song-row.playing inset rgba(255,255,255,.07)） */
  playingBorder: string
  /** 渐变上的文字 / 图标色（.chip.on / .pc.main） */
  onBrand: string
  /** 渐变底上的白字（.avatar / .b-tag / .rk-name / .fav-card .fc-go 原型均为 #fff） */
  onGradient: string
  /** brand 16% 洗底（选中态图标按钮底 .icon-btn.on） */
  brandWash: string
  /** 开关轨道底色（.toggle off 态 rgba(255,255,255,.16)） */
  switchOff: string
  /** 开关旋钮色（.toggle i 恒为白，浅深同值） */
  switchKnob: string
  /** 屏幕背景辉光 A（紫） */
  glowA: string
  /** 屏幕背景辉光 B（粉） */
  glowB: string
  /** 封面底部压暗遮罩起点色（.art-scrim） */
  artScrim: string
  /** 播放进度条轨道底（.seek 的 rgba(255,255,255,.14)，浅档为同浓度的深灰） */
  seekTrack: string
  /* ==== 语义化填充 / 描边 / 贴片 token（原型 a688d76 / 2af1af9 / 8debf8c 改版新增） ====
   * 与上方旧 key 并存，旧 key 的组件替换下一轮进行；取值照抄 new_design/styles.css。 */
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
  /** --card：分组容器底（深=叠白 .045；浅=实心白，iOS 分组列表式）。注意与 RADIUS.card（圆角半径 22）同词不同层级，此键只在 colors 命名空间内 */
  card: string
  /** --glass：浮在封面图上的毛玻璃贴片底（≠ 旧 glass——旧 glass 语义是控件叠白底 fill-2） */
  glassPatch: string
  /** --glass-ink：图上毛玻璃贴片上的文字色 */
  glassPatchInk: string
  /** --danger-ink：危险文案色（深底亮珊瑚 / 浅底深红，按底反转保对比） */
  dangerInk: string
  /** 歌词当前行投影色（.ln.on text-shadow）：原型深 rgba(0,0,0,.55)（styles.css L612）/
   *  浅 rgba(21,22,28,.22)（L1171 单独覆盖）——原型注释言明此为无法反相表达的真差异，两套各给一档。
   *  2026-10-15 曾把两档浓度自降为 .30 / .10（怕 RN 大半径阴影糊成暗块），2026-10-16 审计轮按
   *  「原型即真相」回到原值；半径/偏移见 PLAYER.lyricGlow*，真机若确实脏再改口径 */
  lyricGlow: string
  /* ==== 磁吸圆点那一族（原型 :root L27-35 / 浅色 .phone.light L1506-1512） ====
   * 迷你播放条「贴边收圆」态的底、外圈进度弧、发丝描边与正中状态标各一档。
   * 与 glassPatch 同属浮在上面的贴片，但底色刻意薄一档 —— 圆点要透出底下是字还是封面。 */
  /** --mini-veil：圆点底（深 .30 / 浅 .26，比 --glass 薄一档） */
  miniVeil: string
  /** --mini-ring：外圈进度弧的整环底色 */
  miniRing: string
  /** --mini-dot-line：圆点外缘 1px 发丝描边 */
  miniDotLine: string
  /* 2026-10-26：原 --mini-mark-bg / -ink / -line 三键（贴边态正中那颗 22px 毛玻璃状态标）
     随 CD 碟面改造退役整组删除——播放中不再渲染状态标，暂停只在中心孔里落一枚 7px 白三角
     （容器 11×11、透明底、无描边，墨色取 ART_INK.fg）。 */
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
 * 玻璃层规格（共通件 BlurredContainer 的输入，见 theme.GLASS）。
 * 对应原型 CSS 的两段事实：backdrop-filter: blur(Npx) → intensity；
 * background: rgba / linear-gradient → tintBase × tintAlphas（× tintLocations）。
 * tint / 兜底一律引用色板键（keyof ThemeColors），浅深两套主题自动跟随，禁止写死色值。
 */
export interface GlassLayerSpec {
  /** 模糊半径（CSS blur() px 原值；Android 侧库内折算 blurRadius≈×0.8 且封顶 25） */
  intensity: number
  /** 染色基色：色板键（对应原型 rgba 的基色来源，如 .tabbar 的 rgba(8,8,12,…) 即 bg） */
  tintBase: keyof ThemeColors
  /** 染色分段 alpha（沿 start→end 方向，顶→底）；单色位传一段即可。
   *  省略 = 染色直取 colors[tintBase] 原值（token 自带该主题 alpha，如 glassPatch 深 .74 / 浅 .82
   *  两套 alpha 不同档，无法用「基色 × 单一乘子」表达，.minibar 即此形态） */
  tintAlphas?: readonly number[]
  /** 分段位置（与 tintAlphas 等长；缺省均布） */
  tintLocations?: readonly number[]
  start: { readonly x: number, readonly y: number }
  end: { readonly x: number, readonly y: number }
  /** 真模糊不可用时的降级打底色键：不透明表面色，保证与内容分层不糊成一片（2026-10-12 已验收形态） */
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
