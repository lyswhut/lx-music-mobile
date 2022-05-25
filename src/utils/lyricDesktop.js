import { NativeModules, NativeEventEmitter } from 'react-native'

const { LyricModule } = NativeModules

let isShowLyric = false

export const themes = [
  { id: 'green', value: '#07c556' },
  { id: 'yellow', value: '#fffa12' },
  { id: 'blue', value: '#19b5fe' },
  { id: 'red', value: '#ff1222' },
  { id: 'pink', value: '#f1828d' },
  { id: 'purple', value: '#c851d4' },
  { id: 'orange', value: '#ffad12' },
  { id: 'grey', value: '#bdc3c7' },
  { id: 'black', value: '#333333' },
  { id: 'white', value: '#ffffff' },
]

export const textPositionX = [
  { id: 'left', value: 'LEFT' },
  { id: 'center', value: 'CENTER' },
  { id: 'right', value: 'RIGHT' },
]
export const textPositionY = [
  { id: 'top', value: 'TOP' },
  { id: 'center', value: 'CENTER' },
  { id: 'bottom', value: 'BOTTOM' },
]

const getThemeColor = themeId => (themes.find(t => t.id == themeId) || themes[0]).value
const getTextPositionX = x => (textPositionX.find(t => t.id == x) || textPositionX[0]).value
const getTextPositionY = y => (textPositionY.find(t => t.id == y) || textPositionY[0]).value
const getAlpha = num => parseInt(num) / 100
const getTextSize = num => parseInt(num) / 10


/**
 * show lyric
 * @param {Number} isLock is lock lyric window
 * @returns {Promise} Promise
 */
export const showLyric = ({
  isShowToggleAnima,
  isSingleLine,
  width,
  maxLineNum,
  isLock,
  themeId,
  opacity,
  textSize,
  positionX,
  positionY,
  textPositionX,
  textPositionY,
}) => {
  if (isShowLyric) return Promise.resolve()
  return LyricModule.showLyric({
    isSingleLine,
    isShowToggleAnima,
    isLock,
    themeColor: getThemeColor(themeId),
    alpha: getAlpha(opacity),
    textSize: getTextSize(textSize),
    lyricViewX: positionX,
    lyricViewY: positionY,
    textX: getTextPositionX(textPositionX),
    textY: getTextPositionY(textPositionY),
    width,
    maxLineNum,
  }).then(() => {
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
export const setLyric = (lyric, translation, romalrc) => {
  if (!isShowLyric) return Promise.resolve()
  return LyricModule.setLyric(lyric, translation || '', romalrc || '')
}

/**
 * toggle show translation
 * @param {Boolean} isShowTranslation is show translation
 * @returns {Promise} Promise
 */
export const toggleTranslation = isShowTranslation => {
  // if (!isShowLyric) return Promise.resolve()
  return LyricModule.toggleTranslation(isShowTranslation)
}

/**
 * toggle show roma lyric
 * @param {Boolean} isShowRoma is show roma lyric
 * @returns {Promise} Promise
 */
export const toggleRoma = isShowRoma => {
  // if (!isShowLyric) return Promise.resolve()
  return LyricModule.toggleRoma(isShowRoma)
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

/**
 * set theme
 * @param {*} themeId theme id
 * @returns {Promise} Promise
 */
export const setTheme = themeId => {
  if (!isShowLyric) return Promise.resolve()
  return LyricModule.setColor(getThemeColor(themeId))
}

/**
 * set text alpha
 * @param {*} alpha text alpha
 * @returns {Promise} Promise
 */
export const setAlpha = alpha => {
  if (!isShowLyric) return Promise.resolve()
  return LyricModule.setAlpha(getAlpha(alpha))
}

/**
 * set text size
 * @param {*} size text size
 * @returns {Promise} Promise
 */
export const setTextSize = size => {
  if (!isShowLyric) return Promise.resolve()
  return LyricModule.setTextSize(getTextSize(size))
}

export const setShowToggleAnima = isShowToggleAnima => {
  if (!isShowLyric) return Promise.resolve()
  return LyricModule.setShowToggleAnima(isShowToggleAnima)
}

export const setSingleLine = isSingleLine => {
  if (!isShowLyric) return Promise.resolve()
  return LyricModule.setSingleLine(isSingleLine)
}

export const setPosition = (x, y) => {
  if (!isShowLyric) return Promise.resolve()
  return LyricModule.setPosition(x, y)
}

export const setMaxLineNum = maxLineNum => {
  if (!isShowLyric) return Promise.resolve()
  return LyricModule.setMaxLineNum(maxLineNum)
}

export const setWidth = width => {
  if (!isShowLyric) return Promise.resolve()
  return LyricModule.setWidth(width)
}

export const fixViewPosition = () => {
  if (!isShowLyric) return Promise.resolve()
  return LyricModule.fixViewPosition()
}

export const setLyricTextPosition = (textX, textY) => {
  if (!isShowLyric) return Promise.resolve()
  return LyricModule.setLyricTextPosition(getTextPositionX(textX), getTextPositionY(textY))
}

export const checkOverlayPermission = () => {
  return LyricModule.checkOverlayPermission()
}

export const openOverlayPermissionActivity = () => {
  return LyricModule.openOverlayPermissionActivity()
}

export const onPositionChange = callback => {
  const eventEmitter = new NativeEventEmitter(LyricModule)
  const eventListener = eventEmitter.addListener('set-position', event => {
    callback(event)
  })

  return () => {
    eventListener.remove()
  }
}

