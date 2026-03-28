import { NativeModules, NativeEventEmitter } from 'react-native'

const { LyricModule } = NativeModules

// export const themes = [
//   { id: 'green', value: '#07c556' },
//   { id: 'yellow', value: '#fffa12' },
//   { id: 'blue', value: '#19b5fe' },
//   { id: 'red', value: '#ff1222' },
//   { id: 'pink', value: '#f1828d' },
//   { id: 'purple', value: '#c851d4' },
//   { id: 'orange', value: '#ffad12' },
//   { id: 'grey', value: '#bdc3c7' },
//   { id: 'black', value: '#333333' },
//   { id: 'white', value: '#ffffff' },
// ]

// export const textPositionX = [
//   { id: 'left', value: 'LEFT' },
//   { id: 'center', value: 'CENTER' },
//   { id: 'right', value: 'RIGHT' },
// ]
// export const textPositionY = [
//   { id: 'top', value: 'TOP' },
//   { id: 'center', value: 'CENTER' },
//   { id: 'bottom', value: 'BOTTOM' },
// ]

// const getThemeColor = themeId => (themes.find(t => t.id == themeId) || themes[0]).value
// const getTextPositionX = x => (textPositionX.find(t => t.id == x) || textPositionX[0]).value
// const getTextPositionY = y => (textPositionY.find(t => t.id == y) || textPositionY[0]).value
const getAlpha = (num: number) => num / 100
const getTextSize = (num: number) => num / 10

/**
 * 发送歌词事件
 * @param isShow
 * @returns
 */
export const setSendLyricTextEvent = async(isSend: boolean) => {
  return LyricModule.setSendLyricTextEvent(isSend)
}

/**
 * show lyric
 */
export const showDesktopLyricView = async({
  isShowToggleAnima,
  isSingleLine,
  width,
  maxLineNum,
  isLock,
  unplayColor,
  playedColor,
  shadowColor,
  opacity,
  textSize,
  positionX,
  positionY,
  textPositionX,
  textPositionY,
}: {
  isShowToggleAnima: boolean
  isSingleLine: boolean
  width: number
  maxLineNum: number
  isLock: boolean
  unplayColor: string
  playedColor: string
  shadowColor: string
  opacity: number
  textSize: number
  positionX: number
  positionY: number
  textPositionX: LX.AppSetting['desktopLyric.textPosition.x']
  textPositionY: LX.AppSetting['desktopLyric.textPosition.y']
}): Promise<void> => {
  return LyricModule.showDesktopLyric({
    isSingleLine,
    isShowToggleAnima,
    isLock,
    unplayColor,
    playedColor,
    shadowColor,
    alpha: getAlpha(opacity),
    textSize: getTextSize(textSize),
    lyricViewX: positionX,
    lyricViewY: positionY,
    textX: textPositionX.toUpperCase(),
    textY: textPositionY.toUpperCase(),
    width,
    maxLineNum,
  })
}

/**
 * hide lyric
 */
export const hideDesktopLyricView = async(): Promise<void> => {
  return LyricModule.hideDesktopLyric()
}


/**
 * play lyric
 * @param {Number} time play time
 * @returns {Promise} Promise
 */
export const play = async(time: number): Promise<void> => {
  return LyricModule.play(time)
}

/**
 * pause lyric
 */
export const pause = async(): Promise<void> => {
  return LyricModule.pause()
}

/**
 * set lyric
 * @param lyric lyric str
 * @param translation lyric translation
 * @param romalrc lyric translation
 */
export const setLyric = async(lyric: string, translation: string, romalrc: string): Promise<void> => {
  return LyricModule.setLyric(lyric, translation || '', romalrc || '')
}

export const setPlaybackRate = async(rate: number): Promise<void> => {
  return LyricModule.setPlaybackRate(rate)
}

/**
 * toggle show translation
 * @param isShowTranslation is show translation
 */
export const toggleTranslation = async(isShowTranslation: boolean): Promise<void> => {
  return LyricModule.toggleTranslation(isShowTranslation)
}

/**
 * toggle show roma lyric
 * @param isShowRoma is show roma lyric
 */
export const toggleRoma = async(isShowRoma: boolean): Promise<void> => {
  return LyricModule.toggleRoma(isShowRoma)
}

/**
 * toggle is lock lyric window
 * @param isLock is lock lyric window
 */
export const toggleLock = async(isLock: boolean): Promise<void> => {
  return LyricModule.toggleLock(isLock)
}

/**
 * set color
 * @param unplayColor
 * @param playedColor
 * @param shadowColor
 */
export const setColor = async(unplayColor: string, playedColor: string, shadowColor: string): Promise<void> => {
  return LyricModule.setColor(unplayColor, playedColor, shadowColor)
}

/**
 * set text alpha
 * @param alpha text alpha
 */
export const setAlpha = async(alpha: number): Promise<void> => {
  return LyricModule.setAlpha(getAlpha(alpha))
}

/**
 * set text size
 * @param size text size
 */
export const setTextSize = async(size: number): Promise<void> => {
  return LyricModule.setTextSize(getTextSize(size))
}

export const setShowToggleAnima = async(isShowToggleAnima: boolean): Promise<void> => {
  return LyricModule.setShowToggleAnima(isShowToggleAnima)
}

export const setSingleLine = async(isSingleLine: boolean): Promise<void> => {
  return LyricModule.setSingleLine(isSingleLine)
}

export const setPosition = async(x: number, y: number): Promise<void> => {
  return LyricModule.setPosition(x, y)
}

export const setMaxLineNum = async(maxLineNum: number): Promise<void> => {
  return LyricModule.setMaxLineNum(maxLineNum)
}

export const setWidth = async(width: number): Promise<void> => {
  return LyricModule.setWidth(width)
}

// export const fixViewPosition = async(): Promise<void> => {
//   return LyricModule.fixViewPosition()
// }

export const setLyricTextPosition = async(textX: LX.AppSetting['desktopLyric.textPosition.x'], textY: LX.AppSetting['desktopLyric.textPosition.y']): Promise<void> => {
  return LyricModule.setLyricTextPosition(textX.toUpperCase(), textY.toUpperCase())
}

export const checkOverlayPermission = async(): Promise<void> => {
  return LyricModule.checkOverlayPermission()
}

export const openOverlayPermissionActivity = async(): Promise<void> => {
  return LyricModule.openOverlayPermissionActivity()
}

export const onPositionChange = (handler: (position: { x: number, y: number }) => void): () => void => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const eventEmitter = new NativeEventEmitter(LyricModule)
  const eventListener = eventEmitter.addListener('set-position', event => {
    handler(event as { x: number, y: number })
  })

  return () => {
    eventListener.remove()
  }
}

export const onLyricLinePlay = (handler: (lineInfo: { text: string, extendedLyrics: string[] }) => void): () => void => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const eventEmitter = new NativeEventEmitter(LyricModule)
  const eventListener = eventEmitter.addListener('lyric-line-play', event => {
    handler(event as { text: string, extendedLyrics: string[] })
  })

  return () => {
    eventListener.remove()
  }
}

