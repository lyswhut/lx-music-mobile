/**
 * 单集 ↔ 远控的中转表（文件头见 `podPlayer.ts` 第三节）。
 *
 * `src/plugins/player/service.ts` 是播放服务那一侧的文件，它**只认这张表**：一个函数指针、
 * 零依赖、零 import。为什么要这么薄：service 是 RNTP 的播放服务入口，把电台数据层（AsyncStorage、
 * 提示总线、快照订阅）整个拉进那条链路既没必要也要多担一份加载顺序的风险；反过来
 * `podPlayer.ts` 在加载时把实现注册进来，电台 UI 没被加载过（= 从没播过单集）时表是空的，
 * service 照旧走歌曲那套，行为与改动前一字不差。
 */
export interface PodRemoteHandlers {
  /** 单集此刻是不是正占着播放器（暂停中也算：远控 Play 要能把它续上） */
  isActive: () => boolean
  play: () => void
  pause: () => void
  /** 通知栏进度条拖动（原生给的是秒） */
  seek: (position: number) => void
  /** 落盘进度并停住这一集（远控 Stop 在退出应用之前调） */
  flush: () => Promise<void>
}

let handlers: PodRemoteHandlers | null = null

/** 由 `podPlayer.ts` 在模块加载时注册（只有一处调用点） */
export const registerPodRemoteHandlers = (next: PodRemoteHandlers | null): void => {
  handlers = next
}

/** service 侧读这张表；null = 电台 UI 从没加载过 / 已注销 */
export const getPodRemoteHandlers = (): PodRemoteHandlers | null => handlers
