import { useLrcPlay, useWordLyricPlay, useWordLyricSet, lerpColor } from '@/plugins/lyric'
import { useIsPlay, useStatusText } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { getWordLyricColors } from '@/config/wordLyricColors'
// import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'


export default ({ autoUpdate }: { autoUpdate: boolean }) => {
  const { text } = useLrcPlay(autoUpdate)
  const { line: wordLine, time } = useWordLyricPlay(autoUpdate)
  const wordLines = useWordLyricSet()
  const isShowWordLyric = useSettingValue('player.isShowWordLyric')
  // 逐字模式下显示逐字引擎的当前行（此时逐行引擎已暂停，其 text 不再更新）
  const isWordMode = isShowWordLyric && wordLines.length > 0
  const statusText = useStatusText()
  const isPlay = useIsPlay()
  const theme = useTheme()
  // 逐字高亮颜色跟随播放详情页的颜色/亮度/对比设置
  const wordLyricColor = useSettingValue('player.wordLyricColor')
  const wordLyricBrightness = useSettingValue('player.wordLyricBrightness')
  const wordLyricContrast = useSettingValue('player.wordLyricContrast')
  const { playedColor, waitColor } = getWordLyricColors(wordLyricColor, wordLyricBrightness, wordLyricContrast, theme['c-primary'], theme['c-350'])
  // console.log('render status')

  // 逐字模式下：小播放器同样按播放进度逐字高亮当前行
  if (isPlay && isWordMode && wordLine >= 0) {
    const lineData = wordLines[wordLine]
    if (lineData?.words.length) {
      return (
        <Text numberOfLines={1} size={12}>
          {lineData.words.map((word, index) => {
            const progress = word.duration > 0
              ? (time - word.time) / word.duration
              : (time >= word.time ? 1 : 0)
            return <Text key={index} color={lerpColor(waitColor, playedColor, progress)}>{word.text}</Text>
          })}
        </Text>
      )
    }
  }

  const status = isPlay
    ? (isWordMode ? (wordLine >= 0 ? wordLines[wordLine]?.text ?? '' : '') : text)
    : statusText

  return <Text numberOfLines={1} size={12}>{status}</Text>
}

// const styles = createStyle({
//   text: {
//     // fontSize: 10,
//     // lineHeight: 18,
//     // height: 18,
//     // height: '100%',
//     // backgroundColor: 'rgba(0,0,0,0.2)',
//   },
// })
