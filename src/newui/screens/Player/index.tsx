import { useCallback, useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Navigation } from 'react-native-navigation'

import { MUSIC_TOGGLE_MODE_LIST } from '@/config/constant'
import { getPlayQuality } from '@/core/music/utils'
import { playNext, playPrev, togglePlay } from '@/core/player/player'
import { useTimeoutExitTimeInfo } from '@/core/player/timeoutExit'
import { updateSetting } from '@/core/common'
import { useLrcPlay, useLrcSet } from '@/plugins/lyric'
import { useIsPlay, usePlayMusicInfo, usePlayerMusicInfo, useProgress } from '@/store/player/hook'
import { useSettingValue } from '@/store/setting/hook'

import {
  ConfirmSheet,
  DiscArt,
  LyricList,
  NewUiToastHost,
  PcButton,
  PlayerBg,
  PlayerMeta,
  PlayerSource,
  PlayerTop,
  PlayerToolButton,
  SeekControl,
  SeekTime,
  StageDots,
  pickArtPalette,
} from '@/newui/components'
import {
  NEW_UI_PLAYER_CRUMB,
  NEW_UI_PLAYER_LRC_PERMISSION_ASK,
  NEW_UI_PLAYER_LYRIC_EMPTY,
  NEW_UI_PLAYER_LYRIC_NOTE,
  NEW_UI_PLAYER_NO_SONG,
  NEW_UI_PLAYER_PREV_RESTART_SEC,
  NEW_UI_PLAYER_TOOL_ARIA,
  NEW_UI_SHEET_COMMENT,
  PLAYER_PLAY_MODE_META,
  QUALITY_LABEL,
  getPlatformMeta,
  newUiPlayerApiSourceText,
  newUiPlayerLoopAria,
  newUiPlayerQueueAria,
} from '@/newui/const'
import {
  useApiSourceName,
  useDesktopLyricToggle,
  useFavoriteToggle,
  useLayerAppeared,
  useNewUiSystemBar,
  usePlayQueue,
  useSafeArea,
} from '@/newui/hooks'
import {
  FONT_SIZE,
  PLATFORM_TINTS,
  PLAYER,
  type PlatformTintKey,
  useTheme,
} from '@/newui/theme'
import { formatDuration, isOnlineMusic, showNewUiToast } from '@/newui/utils'

import { CommentSheet, QueueSheet, TimerSheet } from './sheets'
import {
  PlayerStageSwipe,
  type StageSwipeDirection,
} from './PlayerStageSwipe'

export interface PlayerScreenProps {
  /** react-native-navigation 注入的组件 ID */
  componentId: string
}

/**
 * 播放页：数据只读订阅 store/player 与 plugins/lyric，动作转发现有 core/player。
 * LRC 浮窗走系统级悬浮窗（desktopLyric.enable），无权限时由 ConfirmSheet 引导授权。
 */
export const PlayerScreen = ({ componentId }: PlayerScreenProps) => {
  const theme = useTheme()
  const { top, bottom } = useSafeArea()
  useNewUiSystemBar(componentId)
  // 唱盘自转是 JS 驱动的 60fps 动画，等本层 appear 后再起，避免和转场抢帧。
  const appeared = useLayerAppeared(componentId)

  const musicInfo = usePlayerMusicInfo()
  const playMusicInfo = usePlayMusicInfo()
  const playing = useIsPlay()
  const { nowPlayTime, maxPlayTime, nowPlayTimeStr, maxPlayTimeStr } = useProgress()
  const playQuality = useSettingValue('player.playQuality')
  const togglePlayMethod = useSettingValue('player.togglePlayMethod')
  const apiName = useApiSourceName()
  const { loved, toggle: toggleFav } = useFavoriteToggle()
  // 播放列表条数只进 aria-label，不显示在按钮上
  const { hasSong: queueHasSong, rows: queueRows } = usePlayQueue()

  const lrcLines = useLrcSet()
  const { line: lrcIndex } = useLrcPlay()

  // 歌词与唱片互斥占同一舞台，入口是舞台横滑（右滑进歌词 / 左滑回唱片）
  const [lyricOn, setLyricOn] = useState(false)

  // 休眠定时剩余秒数（到点行为由 core/player/timeoutExit 决定）
  const { time: timerTime } = useTimeoutExitTimeInfo()
  // LRC 浮窗是系统级悬浮窗：复用 core/desktopLyric 与设置键 desktopLyric.enable；
  // 无权限时由本 hook 弹 ConfirmSheet，确认后跳系统悬浮窗授权界面。
  const {
    enabled: floatEnabled,
    toggle: toggleFloat,
    askPermission,
    onPermissionConfirm,
    onPermissionDismiss,
  } = useDesktopLyricToggle()
  // 底部浮层一次只开一个
  const [openSheet, setOpenSheet] = useState<'timer' | 'comment' | 'queue' | null>(null)
  // 评论浮层只取在线曲目，本地曲目为 null（isOnlineMusic 需先判空收窄）
  const currentMusic = playMusicInfo.musicInfo
  const commentMusic = useMemo(
    () => (currentMusic != null && isOnlineMusic(currentMusic) ? currentMusic : null),
    [currentMusic],
  )

  // 平台角标取曲目自身 source；下载项无顶层 source，需用 'source' in 收窄
  const sourceKey = currentMusic && 'source' in currentMusic ? currentMusic.source : undefined
  const sourceMeta = sourceKey ? getPlatformMeta(sourceKey) : null
  const sourceTint = sourceKey
    ? PLATFORM_TINTS[sourceKey as PlatformTintKey] ?? theme.colors.text3
    : theme.colors.text3
  // 音质回显实际生效档：在线曲目按曲目音质 × 音源档位自动降档，本地/下载仍按所选档显示
  const qualityLabel = QUALITY_LABEL[
    commentMusic != null ? getPlayQuality(playQuality, commentMusic) : playQuality
  ]
  const artSeed = `album:${musicInfo.album || musicInfo.name}`
  // 无 blur 依赖，用同一种子色板画对角渐变 × .45 透明度降级
  const [bgC1, bgC2] = useMemo(() => pickArtPalette(artSeed), [artSeed])

  // progress.progress 口径不稳，一律用原始秒数自算比例
  const ratio = maxPlayTime > 0 ? Math.min(nowPlayTime / maxPlayTime, 1) : 0

  const handleClose = useCallback(() => {
    void Navigation.pop(componentId)
  }, [componentId])

  const handleSeekCommit = useCallback(
    (next: number) => {
      if (maxPlayTime > 0) global.app_event.setProgress(next * maxPlayTime)
    },
    [maxPlayTime],
  )

  // 循环五态按 MUSIC_TOGGLE_MODE_LIST 轮转
  const modeMeta = PLAYER_PLAY_MODE_META[togglePlayMethod] ?? PLAYER_PLAY_MODE_META[MUSIC_TOGGLE_MODE_LIST[0]]
  const handleLoopToggle = useCallback(() => {
    const index = MUSIC_TOGGLE_MODE_LIST.indexOf(togglePlayMethod)
    const next = MUSIC_TOGGLE_MODE_LIST[(index + 1) % MUSIC_TOGGLE_MODE_LIST.length]
    updateSetting({ 'player.togglePlayMethod': next })
    // toast 带「循环模式 · 」前缀；档位名认不出来时不报半截句
    const label = PLAYER_PLAY_MODE_META[next]?.label
    if (label != null) showNewUiToast(newUiPlayerLoopAria(label))
  }, [togglePlayMethod])

  /**
   * 「上一曲」：已播过 3 秒时第一下回到开头，再按才是前一首（走既有进度提交路径）。
   */
  const handlePrevPress = useCallback(() => {
    if (maxPlayTime > 0 && nowPlayTime > NEW_UI_PLAYER_PREV_RESTART_SEC) {
      handleSeekCommit(0)
      return
    }
    void playPrev()
  }, [handleSeekCommit, maxPlayTime, nowPlayTime])

  // 右滑 → 歌词，左滑 → 唱片
  const handleStageSwipe = useCallback((direction: StageSwipeDirection) => {
    setLyricOn(direction === 'right')
  }, [])

  return (
    <View
      nativeID="newui.player.content"
      style={[
        styles.root,
        {
          backgroundColor: theme.colors.bg,
          paddingTop: top + PLAYER.paddingTopReserve,
          paddingHorizontal: PLAYER.paddingX,
          paddingBottom: PLAYER.paddingBottom,
        },
      ]}
    >
      {/* 封面色渐变铺底（毛玻璃降级） */}
      <PlayerBg colors={[bgC1, bgC2]} />

      {/* 右侧留空位保持面包屑居中 */}
      <PlayerTop
        onClose={handleClose}
        closeLabel="收起播放页"
        crumbText={NEW_UI_PLAYER_CRUMB}
        qualityLabel={qualityLabel}
      />

      {/* 唱片 ↔ 歌词舞台（横滑切换） */}
      <View style={styles.stage}>
        <PlayerStageSwipe
          phase={lyricOn ? 'lyric' : 'disc'}
          onSwipe={handleStageSwipe}
          enabled={openSheet == null}
        >
          {lyricOn ? (
            lrcLines.length > 0 ? (
              <LyricList lines={lrcLines} activeIndex={lrcIndex} note={NEW_UI_PLAYER_LYRIC_NOTE} />
            ) : (
              <Text style={[styles.emptyLyric, { color: theme.colors.text3 }]}>
                {NEW_UI_PLAYER_LYRIC_EMPTY}
              </Text>
            )
          ) : musicInfo.id ? (
            <DiscArt playing={playing && appeared} artSeed={artSeed} artUri={musicInfo.pic ?? undefined} />
          ) : (
            <Text style={[styles.emptyLyric, { color: theme.colors.text3 }]}>
              {NEW_UI_PLAYER_NO_SONG}
            </Text>
          )}
        </PlayerStageSwipe>
      </View>

      {/* 指示点纯视觉，不挂点击 */}
      <StageDots lyricOn={lyricOn} />

      <PlayerMeta
        title={musicInfo.name || NEW_UI_PLAYER_NO_SONG}
        artist={musicInfo.album ? `${musicInfo.singer} — ${musicInfo.album}` : musicInfo.singer}
        loved={loved}
        onToggleFav={toggleFav}
      />

      <PlayerSource
        sourceLabel={sourceMeta?.short}
        sourceTint={sourceTint}
        qualityLabel={qualityLabel}
        text={newUiPlayerApiSourceText(apiName)}
      />

      <SeekControl ratio={ratio} onCommit={handleSeekCommit} />
      <SeekTime currentText={nowPlayTimeStr} durationText={maxPlayTimeStr} />

      <View style={styles.controls}>
        {/* playPrev/playNext 首参是 isAutoToggle，不能直接接 onPress，需无参转接 */}
        <PcButton kind="ghost" name="prev" onPress={handlePrevPress} accessibilityLabel="上一曲" />
        <PcButton
          kind="main"
          name={playing ? 'pause' : 'play'}
          onPress={togglePlay}
        />
        <PcButton kind="ghost" name="next" onPress={() => { void playNext() }} accessibilityLabel="下一曲" />
      </View>

      {/* 工具行：定时 / 循环 / LRC 浮窗 / 评论 / 播放列表，状态只靠换图标 */}
      <View style={styles.tools}>
        <PlayerToolButton
          name={timerTime > 0 ? 'timerOn' : 'timer'}
          accessibilityLabel={timerTime > 0 ? NEW_UI_PLAYER_TOOL_ARIA.timerOn(formatDuration(timerTime)) : NEW_UI_PLAYER_TOOL_ARIA.timerOff}
          onPress={() => setOpenSheet('timer')}
        />
        <PlayerToolButton
          name={modeMeta.icon}
          accessibilityLabel={newUiPlayerLoopAria(modeMeta.label)}
          onPress={handleLoopToggle}
        />
        <PlayerToolButton
          name={floatEnabled ? 'floatOn' : 'float'}
          accessibilityLabel={floatEnabled ? NEW_UI_PLAYER_TOOL_ARIA.floatOn : NEW_UI_PLAYER_TOOL_ARIA.floatOff}
          onPress={toggleFloat}
        />
        <PlayerToolButton
          name="comment"
          accessibilityLabel={NEW_UI_PLAYER_TOOL_ARIA.comment}
          onPress={() => {
            // 评论只对在线曲目有意义：本地曲 / 无歌时如实提示，不开空面板
            if (playMusicInfo.musicInfo == null) {
              showNewUiToast(NEW_UI_SHEET_COMMENT.noSong)
              return
            }
            if (commentMusic == null) {
              showNewUiToast(NEW_UI_SHEET_COMMENT.localSong)
              return
            }
            setOpenSheet('comment')
          }}
        />
        {/* 播放列表：图标复用 list，条数只写在无障碍名上 */}
        <PlayerToolButton
          name="list"
          accessibilityLabel={newUiPlayerQueueAria(queueHasSong ? queueRows.length : null)}
          onPress={() => { setOpenSheet('queue') }}
        />
      </View>

      <TimerSheet
        visible={openSheet === 'timer'}
        onClose={() => setOpenSheet(null)}
        bottomInset={bottom}
      />
      <CommentSheet
        visible={openSheet === 'comment'}
        musicInfo={commentMusic}
        onClose={() => setOpenSheet(null)}
        bottomInset={bottom}
      />
      {/* 播放列表面板：行内「⋯」浮在其上（同 z-index，后声明者在上） */}
      <QueueSheet
        visible={openSheet === 'queue'}
        onClose={() => { setOpenSheet(null) }}
        bottomInset={bottom}
      />
      {/* 悬浮窗授权引导：挂在提示胶囊之前，提示仍压在浮层之上 */}
      <ConfirmSheet
        visible={askPermission}
        title={NEW_UI_PLAYER_LRC_PERMISSION_ASK.title}
        body={NEW_UI_PLAYER_LRC_PERMISSION_ASK.body}
        okLabel={NEW_UI_PLAYER_LRC_PERMISSION_ASK.okLabel}
        cancelLabel={NEW_UI_PLAYER_LRC_PERMISSION_ASK.cancelLabel}
        onConfirm={onPermissionConfirm}
        onClose={onPermissionDismiss}
        bottomInset={bottom}
      />
      {/* 提示胶囊：屏幕根层最后一子，压在浮层之上 */}
      <NewUiToastHost bottomInset={bottom} />
    </View>
  )
}

PlayerScreen.displayName = 'NewUIPlayerScreen'

const styles = StyleSheet.create({
  /** 子层按文档顺序叠在渐变底之上 */
  root: {
    flex: 1,
  },
  stage: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PLAYER.stagePaddingY,
  },
  emptyLyric: {
    fontSize: FONT_SIZE.body,
    textAlign: 'center',
    paddingHorizontal: PLAYER.paddingX,
  },
  controls: {
    marginTop: PLAYER.controlsMarginTop,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: PLAYER.controlsGap,
  },
  tools: {
    marginTop: PLAYER.toolsMarginTop,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: PLAYER.toolsGap,
  },
})
