import { useEffect, useState } from 'react'
import Lyric, { type Lines } from 'lrc-file-parser'
// import { getStore, subscribe } from '@/store'
export type Line = Lines[number]
type PlayHook = (line: number, text: string) => void
type SetLyricHook = (lines: Lines) => void

// ==================== 逐字歌词（lxlyric） ====================
// lxlyric 格式：每行 `[mm:ss.xxx]<offset,duration>文<offset,duration>字...`
// offset/duration 单位为毫秒，相对于所在行的起始时间
export interface WordLyricLine {
  time: number // 行起始时间（ms）
  text: string // 整行文本
  words: Array<{ time: number, duration: number, text: string }> // 字级时间信息
}
type WordPlayHook = (line: number, time: number) => void
type WordSetLyricHook = (lines: WordLyricLine[]) => void

const WORD_LINE_REG = /^\[(\d+):(\d+(?:\.\d+)?)](.*)$/
const WORD_REG = /<(\d+),(\d+)(?:,\d+)?>([^<]*)/g

export const parseWordLyric = (lxlyric: string): WordLyricLine[] => {
  const lines: WordLyricLine[] = []
  for (const rawLine of lxlyric.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const match = WORD_LINE_REG.exec(line)
    if (!match) continue
    const time = parseInt(match[1]) * 60000 + Math.round(parseFloat(match[2]) * 1000)
    const words: WordLyricLine['words'] = []
    let text = ''
    WORD_REG.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = WORD_REG.exec(match[3]))) {
      if (!m[3]) continue
      words.push({ time: parseInt(m[1]), duration: parseInt(m[2]), text: m[3] })
      text += m[3]
    }
    // 无逐字标记的行（纯 LRC 行混入）：将整行作为一个"字"，保持行结构完整
    if (!words.length) {
      const rawText = match[3].replace(/<[^>]*>/g, '')
      if (!rawText) continue
      words.push({ time: 0, duration: 0, text: rawText })
      text = rawText
    }
    lines.push({ time, text, words })
  }
  return lines.sort((a, b) => a.time - b.time)
}

const lrcTools = {
  isInited: false,
  lrc: null as Lyric | null,
  currentLineData: { line: 0, text: '' },
  currentLines: [] as Lines,
  playHooks: [] as PlayHook[],
  setLyricHooks: [] as SetLyricHook[],
  isPlay: false,
  isShowTranslation: false,
  isShowRoma: false,
  lyricText: '',
  translationText: '' as string | null | undefined,
  romaText: '' as string | null | undefined,
  init() {
    if (this.isInited) return
    this.isInited = true
    this.lrc = new Lyric({
      onPlay: this.onPlay.bind(this),
      onSetLyric: this.onSetLyric.bind(this),
      offset: 100, // offset time(ms), default is 150 ms
    })
  },
  onPlay(line: number, text: string) {
    this.currentLineData.line = line
    // console.log(line)
    this.currentLineData.text = text
    for (const hook of this.playHooks) hook(line, text)
  },
  onSetLyric(lines: Lines) {
    this.currentLines = lines
    this.currentLineData.line = 0
    this.currentLineData.text = ''
    for (const hook of this.playHooks) hook(-1, '')
    for (const hook of this.setLyricHooks) hook(lines)
  },
  addPlayHook(hook: PlayHook) {
    this.playHooks.push(hook)
    hook(this.currentLineData.line, this.currentLineData.text)
  },
  removePlayHook(hook: PlayHook) {
    this.playHooks.splice(this.playHooks.indexOf(hook), 1)
  },
  addSetLyricHook(hook: SetLyricHook) {
    this.setLyricHooks.push(hook)
    hook(this.currentLines)
  },
  removeSetLyricHook(hook: SetLyricHook) {
    this.setLyricHooks.splice(this.setLyricHooks.indexOf(hook), 1)
  },
  setLyric() {
    const extendedLyrics = [] as string[]
    if (this.isShowTranslation && this.translationText) extendedLyrics.push(this.translationText)
    if (this.isShowRoma && this.romaText) extendedLyrics.push(this.romaText)
    this.lrc!.setLyric(this.lyricText, extendedLyrics)
  },
}

// 逐字歌词引擎：与逐行引擎互斥，同一时刻只有一个处于激活状态
let isWordLyricMode = false // 当前是否处于逐字模式（由 setWordLyric 按数据是否存在自动设置）
const wordLyricTools = {
  lines: [] as WordLyricLine[],
  currentLine: -1,
  currentTime: 0, // 当前全局播放时间（ms），驱动行查找
  currentLineTime: 0, // 当前行内已播时间（ms），驱动逐字着色
  isPlay: false,
  rate: 1,
  timer: null as NodeJS.Timeout | null,
  startPos: 0, // play() 时的播放位置（ms）
  startTimestamp: 0, // play() 时的时间戳，用于计算真实经过时间
  isShowTranslation: false,
  isShowRoma: false,
  translationLines: [] as string[],
  romaLines: [] as string[],
  playHooks: [] as WordPlayHook[],
  setLyricHooks: [] as WordSetLyricHook[],
  onPlay(line: number, time: number) {
    // 注意：time 为行内已播时间，不能写回 currentTime（后者是全局播放时间）
    this.currentLine = line
    this.currentLineTime = time
    for (const hook of this.playHooks) hook(line, time)
  },
  onSetLyric(lines: WordLyricLine[]) {
    this.lines = lines
    this.currentLine = -1
    this.currentTime = 0
    this.currentLineTime = 0
    for (const hook of this.setLyricHooks) hook(lines)
  },
  addPlayHook(hook: WordPlayHook) {
    this.playHooks.push(hook)
    hook(this.currentLine, this.currentLineTime)
  },
  removePlayHook(hook: WordPlayHook) {
    this.playHooks.splice(this.playHooks.indexOf(hook), 1)
  },
  addSetLyricHook(hook: WordSetLyricHook) {
    this.setLyricHooks.push(hook)
    hook(this.lines)
  },
  removeSetLyricHook(hook: WordSetLyricHook) {
    this.setLyricHooks.splice(this.setLyricHooks.indexOf(hook), 1)
  },
  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },
  // 根据当前时间计算所在行及行内已播时间
  updateLine() {
    if (!this.lines.length) return
    const time = this.currentTime
    let line = -1
    for (let i = this.lines.length - 1; i >= 0; i--) {
      if (time >= this.lines[i].time) {
        line = i
        break
      }
    }
    const lineChanged = line != this.currentLine
    if (lineChanged || this.isPlay) {
      this.onPlay(line, line >= 0 ? time - this.lines[line].time : 0)
    }
  },
  play(time: number) {
    this.isPlay = true
    this.currentTime = time
    this.startPos = time
    this.startTimestamp = Date.now()
    this.clearTimer()
    this.updateLine()
    this.timer = setInterval(() => {
      // 基于真实时间戳计算经过时间，避免定时器延迟导致的时间丢失（与 lrc-file-parser 同机制）
      this.currentTime = this.startPos + (Date.now() - this.startTimestamp) * this.rate
      this.updateLine()
    }, 50)
  },
  pause() {
    this.isPlay = false
    this.clearTimer()
  },
  setRate(rate: number) {
    this.rate = rate
  },
}


export const init = async() => {
  lrcTools.init()
}

export const setLyric = (lyric: string, translation?: string, romalrc?: string) => {
  lrcTools.isPlay = false
  lrcTools.lyricText = lyric
  lrcTools.translationText = translation
  lrcTools.romaText = romalrc
  lrcTools.setLyric()
}

/**
 * 设置逐字歌词
 * 传入空字符串或解析不到有效行时自动回退到逐行模式
 */
export const setWordLyric = (lxlyric: string, translation?: string, romalrc?: string) => {
  const lines = lxlyric ? parseWordLyric(lxlyric) : []
  wordLyricTools.isShowTranslation = !!translation
  wordLyricTools.isShowRoma = !!romalrc
  wordLyricTools.translationLines = translation ? translation.split('\n').map(l => l.replace(/^\[\d+:\d+(?:\.\d+)?]/, '')) : []
  wordLyricTools.romaLines = romalrc ? romalrc.split('\n').map(l => l.replace(/^\[\d+:\d+(?:\.\d+)?]/, '')) : []
  wordLyricTools.pause()
  isWordLyricMode = lines.length > 0
  wordLyricTools.onSetLyric(lines)
}

export const setPlaybackRate = (playbackRate: number) => {
  lrcTools.lrc!.setPlaybackRate(playbackRate)
  wordLyricTools.setRate(playbackRate)
}
export const toggleTranslation = (isShow: boolean) => {
  lrcTools.isShowTranslation = isShow
  if (!lrcTools.lyricText) return
  lrcTools.setLyric()
}
export const toggleRoma = (isShow: boolean) => {
  lrcTools.isShowRoma = isShow
  if (!lrcTools.lyricText) return
  lrcTools.setLyric()
}
export const play = (time: number) => {
  // console.log(time)
  lrcTools.isPlay = true
  // 两个引擎互斥驱动：逐字模式下只跑逐字引擎，避免双份定时器争抢导致滚动动画卡顿
  if (isWordLyricMode) {
    lrcTools.lrc!.pause()
    wordLyricTools.play(time)
  } else {
    wordLyricTools.pause()
    lrcTools.lrc!.play(time)
  }
}
export const pause = () => {
  // console.log('pause')
  lrcTools.isPlay = false
  lrcTools.lrc!.pause()
  wordLyricTools.pause()
}

/**
 * 颜色插值：按进度 t(0~1) 在两种颜色间渐变，用于逐字歌词平滑着色
 * 支持 rgb()/rgba()/hex 格式，解析失败时返回起始色
 */
export const lerpColor = (from: string, to: string, t: number): string => {
  const parse = (color: string): [number, number, number] | null => {
    const rgb = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (rgb) return [+rgb[1], +rgb[2], +rgb[3]]
    const hex = color.match(/^#([0-9a-f]{6})$/i)
    if (hex) {
      const v = parseInt(hex[1], 16)
      return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
    }
    return null
  }
  const a = parse(from)
  const b = parse(to)
  if (!a || !b) return from
  const p = Math.max(0, Math.min(1, t))
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * p)},${Math.round(a[1] + (b[1] - a[1]) * p)},${Math.round(a[2] + (b[2] - a[2]) * p)})`
}

// on lyric play hook
export const useLrcPlay = (autoUpdate = true) => {
  const [lrcInfo, setLrcInfo] = useState(lrcTools.currentLineData)
  useEffect(() => {
    if (!autoUpdate) return
    const setLrcCallback: SetLyricHook = () => {
      setLrcInfo({ line: 0, text: '' })
    }
    const playCallback: PlayHook = (line, text) => {
      setLrcInfo({ line, text })
    }
    lrcTools.addSetLyricHook(setLrcCallback)
    lrcTools.addPlayHook(playCallback)
    setLrcInfo(lrcTools.currentLineData)
    return () => {
      lrcTools.removeSetLyricHook(setLrcCallback)
      lrcTools.removePlayHook(playCallback)
    }
  }, [autoUpdate])

  return lrcInfo
}

// on lyric set hook
export const useLrcSet = () => {
  const [lines, setLines] = useState<Lines>(lrcTools.currentLines)
  useEffect(() => {
    const callback = (lines: Lines) => {
      setLines(lines)
    }
    lrcTools.addSetLyricHook(callback)
    return () => { lrcTools.removeSetLyricHook(callback) }
  }, [])

  return lines
}

// ==================== 逐字歌词 hooks ====================

/**
 * 逐字歌词播放状态：当前行 + 行内已播时间（ms）
 */
export const useWordLyricPlay = (autoUpdate = true) => {
  const [info, setInfo] = useState({ line: wordLyricTools.currentLine, time: wordLyricTools.currentLineTime })
  useEffect(() => {
    if (!autoUpdate) return
    const callback: WordPlayHook = (line, time) => {
      setInfo({ line, time })
    }
    wordLyricTools.addPlayHook(callback)
    return () => { wordLyricTools.removePlayHook(callback) }
  }, [autoUpdate])

  return info
}

/**
 * 逐字歌词行数据
 */
export const useWordLyricSet = () => {
  const [lines, setLines] = useState<WordLyricLine[]>(wordLyricTools.lines)
  useEffect(() => {
    const callback: WordSetLyricHook = (lines) => {
      setLines(lines)
    }
    wordLyricTools.addSetLyricHook(callback)
    return () => { wordLyricTools.removeSetLyricHook(callback) }
  }, [])

  return lines
}

/**
 * 当前逐字歌词的翻译/罗马音行（与逐字行按索引对齐）
 */
export const useWordLyricExtended = () => {
  const [info, setInfo] = useState({ translation: wordLyricTools.translationLines, roma: wordLyricTools.romaLines })
  useEffect(() => {
    const callback: WordSetLyricHook = () => {
      setInfo({ translation: wordLyricTools.translationLines, roma: wordLyricTools.romaLines })
    }
    wordLyricTools.addSetLyricHook(callback)
    return () => { wordLyricTools.removeSetLyricHook(callback) }
  }, [])

  return info
}
