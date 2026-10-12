import { getMusicInfo } from './musicInfo'

export default {
  async getPic(songInfo) {
    const info = await getMusicInfo(songInfo.songmid)
    return info.img
  },
}
