import { addDislikeInfo, clearDislikeInfo, overwirteDislikeInfo } from '@/utils/dislikeManage'
import Event from './Event'
import { saveDislikeListRules } from '@/utils/data'
import { setDislikeInfo } from '@/core/dislikeList'

const updateList = async(dislikeInfo: LX.Dislike.DislikeInfo) => {
  await saveDislikeListRules(dislikeInfo.rules)
  setDislikeInfo(dislikeInfo)
}

export class DislikeEvent extends Event {
  dislike_changed() {
    this.emit('dislike_changed')
  }

  /**
   * 覆盖整个列表数据
   * @param dislikeData 列表数据
   * @param isRemote 是否属于远程操作
   */
  async dislike_data_overwrite(dislikeData: LX.Dislike.DislikeRules, isRemote: boolean = false) {
    const dislikeInfo = await overwirteDislikeInfo(dislikeData)
    await updateList(dislikeInfo)
    this.emit('dislike_data_overwrite', dislikeData, isRemote)
    this.dislike_changed()
  }

  /**
   * 批量添加歌曲到列表
   * @param dislikeId 列表id
   * @param musicInfos 添加的歌曲信息
   * @param addMusicLocationType 添加在到列表的位置
   * @param isRemote 是否属于远程操作
   */
  async dislike_music_add(musicInfo: LX.Dislike.DislikeMusicInfo[], isRemote: boolean = false) {
    const dislikeInfo = await addDislikeInfo(musicInfo)
    await updateList(dislikeInfo)
    this.emit('dislike_music_add', musicInfo, isRemote)
    this.dislike_changed()
  }

  /**
   * 清空列表内的歌曲
   * @param ids 列表Id
   * @param isRemote 是否属于远程操作
   */
  async dislike_music_clear(isRemote: boolean = false) {
    const dislikeInfo = await clearDislikeInfo()
    await updateList(dislikeInfo)
    this.emit('dislike_music_clear', isRemote)
    this.dislike_changed()
  }
}


type EventMethods = Omit<EventType, keyof Event>


declare class EventType extends DislikeEvent {
  on<K extends keyof EventMethods>(event: K, listener: EventMethods[K]): any
  off<K extends keyof EventMethods>(event: K, listener: EventMethods[K]): any
}

export type DislikeEventTypes = Omit<EventType, keyof Omit<Event, 'on' | 'off'>>
export const createDislikeEventHub = (): DislikeEventTypes => {
  return new DislikeEvent()
}

