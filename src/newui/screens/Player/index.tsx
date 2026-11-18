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
 * 播放页（对应原型 .player-layer，styles.css L504-588 / app.js paintPlayer + renderLyric）。
 * 界面层容器：全部数据只读订阅既有 store/player 与 plugins/lyric，
 * 动作全部转发现有 core/player、core/common、app_event —— 不触碰播放逻辑。
 * 阶段 9b：定时 / 评论 / LRC 浮窗入口接真浮层与真逻辑（sheets/）。
 * 阶段 3（feature.md【newui】「歌词浮窗要是系统浮窗，不是应用内浮窗」）：浮窗钮接回
 * core/desktopLyric 那条系统级悬浮窗线（设置键 desktopLyric.enable，与旧 UI 同一个开关），
 * U61 的应用内气泡线下线；无悬浮窗权限时以共通件 ConfirmSheet 引导跳系统授权界面。
 * 2026-10-13（清单第 4 条）：均衡器为假能力（播放内核无频段增益通道），已整体移除。
 * 2026-10-12（原型同步轮 6）：主行改三颗居中（定时移出）、工具行四颗纯图标（状态只换图标）、
 * 舞台下方新增唱片/歌词指示点。
 * 2026-10-15（拆件转正轮）：U50/U51/U55/U56/U58 五个原内联单元转正为独立组件
 * （PlayerBg / PlayerTop / PlayerMeta / PlayerSource / SeekTime），渲染零变化、接线原样。
 */
export const PlayerScreen = ({ componentId }: PlayerScreenProps) => {
  const theme = useTheme()
  const { top, bottom } = useSafeArea()
  useNewUiSystemBar(componentId)

  // —— 真实数据（只读复用）——
  const musicInfo = usePlayerMusicInfo()
  const playMusicInfo = usePlayMusicInfo()
  const playing = useIsPlay()
  const { nowPlayTime, maxPlayTime, nowPlayTimeStr, maxPlayTimeStr } = useProgress()
  const playQuality = useSettingValue('player.playQuality')
  const togglePlayMethod = useSettingValue('player.togglePlayMethod')
  const apiName = useApiSourceName()
  const { loved, toggle: toggleFav } = useFavoriteToggle()
  // 工具行第 5 颗「播放列表」的条数（原型 paintQueueBtn：屏内不加文字，条数只写在 aria-label 上）
  const { hasSong: queueHasSong, rows: queueRows } = usePlayQueue()

  const lrcLines = useLrcSet()
  const { line: lrcIndex } = useLrcPlay()

  // 原型 .player-layer.lyric-on：歌词与唱片互斥占同一个舞台。
  // 2026-10-13（清单第 2 条）：切换入口从【歌词】工具钮换成舞台横滑（右滑进歌词 / 左滑回唱片），
  // 显示状态仍是这一个 boolean，没为手势新造一套
  const [lyricOn, setLyricOn] = useState(false)

  // —— 阶段 9b：入口的真接线（定时 / 评论 / LRC 浮窗）——
  // 休眠定时剩余秒数（到点行为由 core/player/timeoutExit 决定）
  const { time: timerTime } = useTimeoutExitTimeInfo()
  // LRC 浮窗 = **系统级悬浮窗**（feature.md【newui】阶段 3：不是应用内浮窗，参考旧 UI）。
  // 接线整条复用旧 UI 既有链路 core/desktopLyric + 设置键 desktopLyric.enable（同一开关，
  // 与旧 UI 设定页 / 播放详情页的桌面歌词钮共享状态）：开 = 校验悬浮窗权限 → showDesktopLyric，
  // 关 = hideDesktopLyric；逐行歌词、拖动与位置记忆都由原生窗口与 core/init 承担，本钮只管入口与回显。
  // 窗口内容体的观感由设置项 desktopLyric.style.* 决定（原生侧绘制），原型 U61 那套 App 内气泡玻璃
  // 视觉在这里无从落地——本轮按「先保证是系统浮窗」取舍，U61 视觉件留在 components/LrcFloat 待用。
  // 无权限时由本 hook 弹出共通件 ConfirmSheet 征求，同意即走旧 UI 既有授权流程
  // （openDesktopLyricOverlayPermissionActivity 跳系统悬浮窗授权界面），不另造机制。
  const {
    enabled: floatEnabled,
    toggle: toggleFloat,
    askPermission,
    onPermissionConfirm,
    onPermissionDismiss,
  } = useDesktopLyricToggle()
  // 底部 sheets：一次只开一个（同原型 #sheet 单实例）
  // 'queue' = 正在播放页的播放列表面板（件 U80，由工具行第 5 颗 #btnQueue 开）
  const [openSheet, setOpenSheet] = useState<'timer' | 'comment' | 'queue' | null>(null)
  // 评论浮层取当前曲目的在线信息；本地曲目为 null（入口直接 toast）
  // playMusicInfo.musicInfo 类型为 PlayMusic | null，isOnlineMusic 只接 PlayMusic，先判空再收窄
  const currentMusic = playMusicInfo.musicInfo
  const commentMusic = useMemo(
    () => (currentMusic != null && isOnlineMusic(currentMusic) ? currentMusic : null),
    [currentMusic],
  )

  // 平台角标取曲目自身的 source（本地曲目为 'local'；没有在播曲目时为空，不显示角标）
  // 'source' in 收窄：下载项（ListItem）无顶层 source，口径同 MinibarHost
  const sourceKey = currentMusic && 'source' in currentMusic ? currentMusic.source : undefined
  const sourceMeta = sourceKey ? getPlatformMeta(sourceKey) : null
  const sourceTint = sourceKey
    ? PLATFORM_TINTS[sourceKey as PlatformTintKey] ?? theme.colors.text3
    : theme.colors.text3
  // 音质标签回显「实际生效档」而不是设置里存的那档（2026-10-13 兜底条）：
  // 在线曲目直接问播放核心取地址用的同一个 getPlayQuality（core/music/utils.ts L218-230，只读复用），
  // 它按曲目音质 × 音源档位表自动降档；本地/下载曲目无此降档语境，仍按所选档显示。
  const qualityLabel = QUALITY_LABEL[
    commentMusic != null ? getPlayQuality(playQuality, commentMusic) : playQuality
  ]
  const artSeed = `album:${musicInfo.album || musicInfo.name}`
  // 背景降级：blur(70) 无依赖可用，用同一种子色板画对角渐变 × .45 透明度
  const [bgC1, bgC2] = useMemo(() => pickArtPalette(artSeed), [artSeed])

  // progress.progress 字段在既有 action 里口径不稳，一律用原始秒数自算比例
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

  // 循环五态循着既有 MUSIC_TOGGLE_MODE_LIST 轮转（同旧 PlayDetail 的 PlayModeBtn 口径）
  const modeMeta = PLAYER_PLAY_MODE_META[togglePlayMethod] ?? PLAYER_PLAY_MODE_META[MUSIC_TOGGLE_MODE_LIST[0]]
  const handleLoopToggle = useCallback(() => {
    const index = MUSIC_TOGGLE_MODE_LIST.indexOf(togglePlayMethod)
    const next = MUSIC_TOGGLE_MODE_LIST[(index + 1) % MUSIC_TOGGLE_MODE_LIST.length]
    updateSetting({ 'player.togglePlayMethod': next })
    // toast 带「循环模式 · 」前缀（原型 app.js L1329 `toast('循环模式 · ' + LOOP_NAME[state.loop])`，
    // QA D76：此前只报档位名，前缀缺失；档位名认不出来时不报半截句）
    const label = PLAYER_PLAY_MODE_META[next]?.label
    if (label != null) showNewUiToast(newUiPlayerLoopAria(label))
  }, [togglePlayMethod])

  /**
   * 「上一曲」（原型 app.js L2615 `state.t > 3 ? seekTo(0) : step(-1)`，QA D03）：
   * 当前这首已经播过 3 秒时，第一下先回到开头，再按才是前一首——跳转走的就是
   * 进度条那一条既有提交路径（app_event.setProgress），不另碰播放核心。
   */
  const handlePrevPress = useCallback(() => {
    if (maxPlayTime > 0 && nowPlayTime > NEW_UI_PLAYER_PREV_RESTART_SEC) {
      handleSeekCommit(0)
      return
    }
    void playPrev()
  }, [handleSeekCommit, maxPlayTime, nowPlayTime])

  // 舞台横滑落定时翻一次互斥状态（右滑 → 歌词，左滑 → 唱片）
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
      {/* .player-bg：封面色渐变铺底（毛玻璃降级方案） */}
      <PlayerBg colors={[bgC1, bgC2]} />

      {/* .player-top：grid 34 / 1fr / 34（右侧留空位保持面包屑居中） */}
      <PlayerTop
        onClose={handleClose}
        closeLabel="收起播放页"
        crumbText={NEW_UI_PLAYER_CRUMB}
        qualityLabel={qualityLabel}
      />

      {/* .player-stage：唱片 ↔ 歌词（横滑切换：右滑进歌词、左滑回唱片） */}
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
            <DiscArt playing={playing} artSeed={artSeed} artUri={musicInfo.pic ?? undefined} />
          ) : (
            <Text style={[styles.emptyLyric, { color: theme.colors.text3 }]}>
              {NEW_UI_PLAYER_NO_SONG}
            </Text>
          )}
        </PlayerStageSwipe>
      </View>

      {/* .stage-dots：唱片 ↔ 歌词翻页的纯视觉指示（aria-hidden，不挂点击；RN 固定竖屏常显） */}
      <StageDots lyricOn={lyricOn} />

      {/* .player-meta：曲名 / 歌手 + 收藏 */}
      <PlayerMeta
        title={musicInfo.name || NEW_UI_PLAYER_NO_SONG}
        artist={musicInfo.album ? `${musicInfo.singer} — ${musicInfo.album}` : musicInfo.singer}
        loved={loved}
        onToggleFav={toggleFav}
      />

      {/* .player-source：平台角标 + 音质 + 音源说明 */}
      <PlayerSource
        sourceLabel={sourceMeta?.short}
        sourceTint={sourceTint}
        qualityLabel={qualityLabel}
        text={newUiPlayerApiSourceText(apiName)}
      />

      {/* .seek + .seek-time */}
      <SeekControl ratio={ratio} onCommit={handleSeekCommit} />
      <SeekTime currentText={nowPlayTimeStr} durationText={maxPlayTimeStr} />

      {/* .player-controls：上一曲 / 播停 / 下一曲（原型 index.html L339-343：居中 gap 38 三颗制；
          「定时」已按改版挪进次级工具行，第 5 枚「均衡」钮早已随假能力移除） */}
      <View style={styles.controls}>
        {/* playPrev/playNext 首参是 isAutoToggle（布尔），不能直接接 onPress（会收到事件对象），必须无参转接 */}
        <PcButton kind="ghost" name="prev" onPress={handlePrevPress} accessibilityLabel="上一曲" />
        <PcButton
          kind="main"
          name={playing ? 'pause' : 'play'}
          onPress={togglePlay}
        />
        <PcButton kind="ghost" name="next" onPress={() => { void playNext() }} accessibilityLabel="下一曲" />
      </View>

      {/* .player-tools：定时 / 循环 / LRC 浮窗 / 评论 / 播放列表（原型 index.html L348-355，件 U60 五颗）——
          纯图标：无选中底色、无文字标签，状态只靠换图标（timer↔timerOn、float↔floatOn、循环五态五轮廓），
          剩余倒计时不显示在按钮上，只进 aria 文案与定时面板副标题，逐秒回写（原型 app.js L1765-1776） */}
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
        {/* 第 5 颗「播放列表」（原型 #btnQueue，件 U60 index.html L348-355）：
            图标复用 sprite 现成的 "list"，不新增 symbol；屏内不加文字、不给选中底色，
            条数只写在无障碍名上（paintQueueBtn app.js L2289 逐字），随这一列的变动回写 */}
        <PlayerToolButton
          name="list"
          accessibilityLabel={newUiPlayerQueueAria(queueHasSong ? queueRows.length : null)}
          onPress={() => { setOpenSheet('queue') }}
        />
      </View>

      {/* 阶段 9b 底部浮层：定时 / 评论（同原型单实例 #sheet） */}
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
      {/* 播放列表面板（件 U80）：一条按播放顺序平铺的列，行内「⋯」由它自己叠在本面板之上
          （原型 #moreSheet 排在 #playerSheet 之后 —— 同 z-index，后声明的压上面）。
          排在各面板之后、二次确认之前，与原型 index.html 的先后一致（L488 → L502 → L513） */}
      <QueueSheet
        visible={openSheet === 'queue'}
        onClose={() => { setOpenSheet(null) }}
        bottomInset={bottom}
      />
      {/* 悬浮窗授权引导（阶段 3）：共通件 ConfirmSheet 承载，正文/键名对齐旧 UI 那条授权提示；
          确认后跳系统「显示悬浮窗口」授权界面（旧 UI 同一 core 函数），本屏不写权限机制。
          挂在提示胶囊之前（原型 .sheet z-index 80 < .toast 90，提示仍压在浮层之上） */}
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
      {/* 提示胶囊（QA D-09 观感）：屏幕根层最后一子——原型 .toast z-index:90 压在浮层之上 */}
      <NewUiToastHost bottomInset={bottom} />
    </View>
  )
}

PlayerScreen.displayName = 'NewUIPlayerScreen'

const styles = StyleSheet.create({
  /** .player-layer flex 纵排；子层浮在渐变底之上（RN 天然按文档顺序叠放） */
  root: {
    flex: 1,
  },
  /** .player-stage flex:1 / place-items:center / padding 16px 0 */
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
  /** .player-controls：居中 gap 38 / margin-top 18（styles.css L641，三颗制改版） */
  controls: {
    marginTop: PLAYER.controlsMarginTop,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: PLAYER.controlsGap,
  },
  /** .player-tools：两端对齐 / gap 2 / margin-top 14（钮都是 flex:1，四枚等分整行、无空槽） */
  tools: {
    marginTop: PLAYER.toolsMarginTop,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: PLAYER.toolsGap,
  },
})
