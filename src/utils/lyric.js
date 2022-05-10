import {
  play as lrcPlay,
  setLyric as lrcSetLyric,
  pause as lrcPause,
  toggleTranslation as lrcToggleTranslation,
  toggleRoma as lrcToggleRoma,
  init as lrcInit,
} from '@/plugins/lyric'
import {
  play as lrcdPlay,
  setLyric as lrcdSetLyric,
  pause as lrcdPause,
  toggleTranslation as lrcdToggleTranslation,
  toggleRoma as lrcdToggleRoma,
} from '@/utils/lyricDesktop'

/**
 * init lyric
 * @returns {Promise}
 */
export const init = () => {
  return lrcInit()
}

/**
 * set lyric
 * @param {String} lyric lyric str
 * @param {String} translation lyric translation
 */
export const setLyric = (lyric, translation = '', romalrc = '') => {
  lrcdSetLyric(lyric, translation, romalrc)
  lrcSetLyric(lyric, translation, romalrc)
}

/**
 * play lyric
 * @param {Number} time play time
 */
export const play = time => {
  lrcPlay(time)
  lrcdPlay(time)
}

/**
 * pause lyric
 */
export const pause = () => {
  lrcPause()
  lrcdPause()
}

/**
 * toggle show translation
 * @param {Boolean} isShowTranslation is show translation
 */
export const toggleTranslation = isShowTranslation => {
  lrcToggleTranslation(isShowTranslation)
  lrcdToggleTranslation(isShowTranslation)
}

/**
 * toggle show roma lyric
 * @param {Boolean} isShowLyricRoma is show roma lyric
 */
export const toggleRoma = isShowLyricRoma => {
  lrcToggleRoma(isShowLyricRoma)
  lrcdToggleRoma(isShowLyricRoma)
}

