import { useEffect, useState } from 'react'
import Lyric from 'lrc-file-parser'
// import { getStore, subscribe } from '@/store'

const lrcTools = {
  isInited: false,
  lrc: null,
  currentLineData: { line: 0, text: '' },
  currentLines: [],
  playHooks: [],
  setLyricHooks: [],
  isPlay: false,
  isShowTranslation: false,
  isShowRoma: false,
  lyricText: '',
  translationText: '',
  romaText: '',
  init() {
    if (this.isInited) return
    this.isInited = true
    this.lrc = new Lyric({
      onPlay: this.onPlay.bind(this),
      onSetLyric: this.onSetLyric.bind(this),
      offset: 100, // offset time(ms), default is 150 ms
    })
  },
  onPlay(line, text) {
    this.currentLineData.line = line
    // console.log(line)
    this.currentLineData.text = text
    for (const hook of this.playHooks) hook(line, text)
  },
  onSetLyric(lines) {
    this.currentLines = lines
    for (const hook of this.setLyricHooks) hook(lines)
    for (const hook of this.playHooks) hook(-1, '')
  },
  addPlayHook(callback) {
    this.playHooks.push(callback)
    callback(this.currentLineData.line, this.currentLineData.text)
  },
  removePlayHook(callback) {
    this.playHooks.splice(this.playHooks.indexOf(callback), 1)
  },
  addSetLyricHook(callback) {
    this.setLyricHooks.push(callback)
    callback(this.currentLines)
  },
  removeSetLyricHook(callback) {
    this.setLyricHooks.splice(this.setLyricHooks.indexOf(callback), 1)
  },
  setLyric() {
    const extendedLyrics = []
    if (this.isShowTranslation && this.translationText) extendedLyrics.push(this.translationText)
    if (this.isShowRoma && this.romaText) extendedLyrics.push(this.romaText)
    this.lrc.setLyric(this.lyricText, extendedLyrics)
  },
}


export const init = async() => {
  lrcTools.init()
}

export const setLyric = (lyric, translation, romalrc) => {
  lrcTools.isPlay = false
  lrcTools.lyricText = lyric
  lrcTools.translationText = translation
  lrcTools.romaText = romalrc
  lrcTools.setLyric()
}
export const toggleTranslation = isShow => {
  lrcTools.isShowTranslation = isShow
  if (!lrcTools.lyricText) return
  lrcTools.setLyric()
}
export const toggleRoma = isShow => {
  lrcTools.isShowRoma = isShow
  if (!lrcTools.lyricText) return
  lrcTools.setLyric()
}
export const play = time => {
  // console.log(time)
  lrcTools.isPlay = true
  lrcTools.lrc.play(time)
}
export const pause = () => {
  // console.log('pause')
  lrcTools.isPlay = false
  lrcTools.lrc.pause()
}

// on lyric play hook
export const useLrcPlay = () => {
  const [lrcInfo, setLrcInfo] = useState({ line: 0, text: '' })
  useEffect(() => {
    const setLrcCallback = () => {
      setLrcInfo({ line: 0, text: '' })
    }
    const playCallback = (line, text) => {
      setLrcInfo({ line, text })
    }
    lrcTools.addSetLyricHook(setLrcCallback)
    lrcTools.addPlayHook(playCallback)
    return () => {
      lrcTools.removeSetLyricHook(setLrcCallback)
      lrcTools.removePlayHook(playCallback)
    }
  }, [setLrcInfo])

  return lrcInfo
}

// on lyric set hook
export const useLrcSet = () => {
  const [lines, setLines] = useState([])
  useEffect(() => {
    const callback = lines => {
      setLines(lines)
    }
    lrcTools.addSetLyricHook(callback)
    return () => lrcTools.removeSetLyricHook(callback)
  }, [setLines])

  return lines
}

