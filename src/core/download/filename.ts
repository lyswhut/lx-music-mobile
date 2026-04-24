import settingState from '@/store/setting/state'

const ILLEGAL_CHARS_RXP = /[\\/:\*?"<>|]/g

export const generateFileName = (musicInfo: LX.Music.MusicInfoOnline, quality: LX.Quality, ext: string): string => {
  const formatType = settingState.setting['download.fileName']
  const name = musicInfo.name.replace(ILLEGAL_CHARS_RXP, '_')
  const singer = musicInfo.singer.replace(ILLEGAL_CHARS_RXP, '_')

  let fileName: string
  switch (formatType) {
    case '歌手 - 歌名':
      fileName = singer ? `${singer} - ${name}` : name
      break
    case '歌名':
      fileName = name
      break
    case '歌名 - 歌手':
    default:
      fileName = singer ? `${name} - ${singer}` : name
      break
  }

  return `${fileName}.${ext}`
}
