import { LIST_IDS } from '@/config/constant'
import { addListMusics } from '@/core/list'
import { playList, playNext } from '@/core/player/player'
import { addTempPlayList } from '@/core/player/tempPlayList'
import settingState from '@/store/setting/state'
import { getListMusicSync } from '@/utils/listManage'
import { confirmDialog, openUrl, shareMusic, toast } from '@/utils/tools'
import { addDislikeInfo, hasDislike } from '@/core/dislikeList'
import playerState from '@/store/player/state'
import musicSdk from '@/utils/musicSdk'
import { toOldMusicInfo } from '@/utils'

export const handlePlay = (musicInfo: LX.Music.MusicInfoOnline) => {
  void addListMusics(LIST_IDS.DEFAULT, [musicInfo], settingState.setting['list.addMusicLocationType']).then(() => {
    const index = getListMusicSync(LIST_IDS.DEFAULT).findIndex(m => m.id == musicInfo.id)
    if (index < 0) return
    void playList(LIST_IDS.DEFAULT, index)
  })
}
export const handlePlayLater = (musicInfo: LX.Music.MusicInfoOnline, selectedList: LX.Music.MusicInfoOnline[], onCancelSelect: () => void) => {
  if (selectedList.length) {
    addTempPlayList(selectedList.map(s => ({ listId: '', musicInfo: s })))
    onCancelSelect()
  } else {
    addTempPlayList([{ listId: '', musicInfo }])
  }
}


export const handleShare = (musicInfo: LX.Music.MusicInfoOnline) => {
  shareMusic(settingState.setting['common.shareType'], settingState.setting['download.fileName'], musicInfo)
}

export const handleShowMusicSourceDetail = async(minfo: LX.Music.MusicInfoOnline) => {
  const url = musicSdk[minfo.source as LX.OnlineSource]?.getMusicDetailPageUrl(toOldMusicInfo(minfo))
  if (!url) return
  void openUrl(url)
}


export const handleDislikeMusic = async(musicInfo: LX.Music.MusicInfoOnline) => {
  const confirm = await confirmDialog({
    message: global.i18n.t('lists_dislike_music_tip', { name: musicInfo.name }),
    cancelButtonText: global.i18n.t('cancel_button_text_2'),
    confirmButtonText: global.i18n.t('confirm_button_text'),
    bgClose: false,
  })
  if (!confirm) return
  await addDislikeInfo([{ name: musicInfo.name, singer: musicInfo.singer }])
  toast(global.i18n.t('lists_dislike_music_add_tip'))
  if (hasDislike(playerState.playMusicInfo.musicInfo)) {
    void playNext(true)
  }
}

