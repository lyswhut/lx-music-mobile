/**
 * 曲目 → 展示字段映射（首页 / 榜单 / 歌单详情 / 播放浮层共用）。
 * 只做「读」与「格式化」，不碰播放与数据获取。
 */
import { PLATFORM_TINTS, type PlatformTintKey } from '@/newui/theme'
import { getPlatformMeta, QUALITY_LABEL, UNPLAYABLE_LABEL } from '@/newui/const'

/** 无封面时的程序化纹理种子前缀：同专辑的歌得到同一张底图 */
const ART_SEED_PREFIX = 'album:'

/**
 * 能否进「临时播放队列」：只有在线曲目可以。
 * 本地曲目与下载项各自挂在具体列表上，交给临时队列会拿不到地址。
 */
export const isOnlineMusic = (musicInfo: LX.Player.PlayMusic): musicInfo is LX.Music.MusicInfoOnline =>
  'meta' in musicInfo && musicInfo.source !== 'local'

/** 展示层需要的歌曲字段 */
export interface SongDisplay {
  /** 标题 */
  title: string
  /** 歌手（副行第三段）；各段由 SongRow 自行拼接 */
  artist: string
  /** 专辑（副行第四段）；无专辑名时为空字符串，SongRow 整段不渲染 */
  album: string
  /** 歌手 · 专辑合成文本；仅非歌曲行版面使用 */
  subtitle: string
  /** 来源角标文案（QQ / 网易 / 酷狗 / 本地 …） */
  sourceLabel: string
  /** 来源 tint；无对应平台色时为 undefined，由组件回落主题色 */
  sourceTint?: string
  /** 封面种子，决定渐变与纹理 */
  artSeed: string
  /** 封面图地址；无图时为 undefined，Art 会画程序化底 */
  artUri?: string
  /** 时长文本，直接沿用已格式化好的 interval（例：03:55） */
  durationText?: string
  /** 音质角标文案；不能播时为「暂不能播」，本地曲目为空 */
  qualityLabel: string
}

/**
 * 逐首显示该曲实际有的最高音质档位（各曲未必同档，比显示全局档位更不易误导）。
 */
const maxQualityLabel = (musicInfo: LX.Music.MusicInfoOnline): string => {
  const qualitys = musicInfo.meta._qualitys
  if (qualitys.flac24bit) return QUALITY_LABEL.flac24bit
  if (qualitys.flac ?? qualitys.ape) return QUALITY_LABEL.flac
  if (qualitys['320k']) return QUALITY_LABEL['320k']
  return QUALITY_LABEL['128k']
}

/**
 * 把一条曲目映射成展示字段。
 * @param musicInfo 既有数据（在线曲目或本地曲目）
 * @param playable 当前音源能否取到这首歌的地址
 */
export const toSongDisplay = (
  musicInfo: LX.Music.MusicInfo,
  playable: boolean,
): SongDisplay => {
  const albumName = musicInfo.meta.albumName
  const isLocal = musicInfo.source === 'local'
  let qualityLabel: string
  if (isLocal) qualityLabel = '' // 本地文件没有平台音质概念，不显示角标
  else if (!playable) qualityLabel = UNPLAYABLE_LABEL
  else qualityLabel = maxQualityLabel(musicInfo as LX.Music.MusicInfoOnline)

  const artist = musicInfo.singer
  const album = albumName ?? ''

  return {
    title: musicInfo.name,
    artist,
    album,
    // 单行合成文本只给非歌曲行版面用
    subtitle: album ? `${artist} · ${album}` : artist,
    sourceLabel: getPlatformMeta(musicInfo.source).short,
    sourceTint: PLATFORM_TINTS[musicInfo.source as PlatformTintKey],
    artSeed: `${ART_SEED_PREFIX}${albumName || musicInfo.name}`,
    artUri: musicInfo.meta.picUrl ?? undefined,
    durationText: musicInfo.interval ?? undefined,
    qualityLabel,
  }
}
