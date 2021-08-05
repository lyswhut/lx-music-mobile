import { NativeModules } from 'react-native'

const { LyricModule } = NativeModules

let isShowLyric = false

/**
 * show lyric
 * @param {Number} isLock is lock lyric window
 * @returns {Promise} Promise
 */
export const showLyric = (isLock = false) => {
  if (isShowLyric) return Promise.resolve()
  return LyricModule.showLyric(isLock).then(() => {
    isShowLyric = true
  })
}

/**
 * hide lyric
 * @returns {Promise} Promise
 */
export const hideLyric = () => {
  if (!isShowLyric) return Promise.resolve()
  return LyricModule.hideLyric().then(() => {
    isShowLyric = false
  })
}


/**
 * play lyric
 * @param {Number} time play time
 * @returns {Promise} Promise
 */
export const play = time => {
  if (!isShowLyric) return Promise.resolve()
  return LyricModule.play(time)
}

/**
 * pause lyric
 * @returns {Promise} Promise
 */
export const pause = () => {
  if (!isShowLyric) return Promise.resolve()
  return LyricModule.pause()
}

/**
 * set lyric
 * @param {String} lyric lyric str
 * @param {String} translation lyric translation
 * @returns {Promise} Promise
 */
export const setLyric = (lyric, translation) => {
  if (!isShowLyric) return Promise.resolve()
  return LyricModule.setLyric(lyric, translation)
}

/**
 * toggle show translation
 * @param {Boolean} isShowTranslation is show translation
 * @returns {Promise} Promise
 */
export const toggleTranslation = isShowTranslation => {
  if (!isShowLyric) return Promise.resolve()
  return LyricModule.toggleTranslation(isShowTranslation)
}

/**
 * toggle is lock lyric window
 * @param {Boolean} isLock is lock lyric window
 * @returns {Promise} Promise
 */
export const toggleLock = isLock => {
  if (!isShowLyric) return Promise.resolve()
  return LyricModule.toggleLock(isLock)
}

