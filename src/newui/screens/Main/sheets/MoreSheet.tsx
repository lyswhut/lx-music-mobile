import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Keyboard, StyleSheet, Text, View } from 'react-native'

import { addListMusics, getListMusics, removeListMusics } from '@/core/list'
import { handlePlayLater } from '@/components/OnlineList/listAction'
import { LIST_IDS } from '@/config/constant'
import { useSettingValue } from '@/store/setting/hook'

import { Art, GroupLabel, OptionRow, Sheet, SrcBadge } from '@/newui/components'
import { NEW_UI_SHEET_MORE, NEW_UI_SHEET_QUEUE } from '@/newui/const'
import { hasPlatformHome, useApiSupport, useLoveSongs, useMyPlaylists } from '@/newui/hooks'
import { FONT_SIZE, FONT_WEIGHT, MORE_SONG, OPTION_ROW, useTheme } from '@/newui/theme'
import { isOnlineMusic, showNewUiToast, toSongDisplay } from '@/newui/utils'

export interface MoreSheetProps {
  visible: boolean
  /** 目标曲目；null 时不渲染内容（退场帧走镜像值） */
  musicInfo: LX.Music.MusicInfo | null
  onClose: () => void
  /** 底部安全区（透传给 Sheet） */
  bottomInset?: number
  /**
   * 宿主单：只有自建歌单详情层才传，主屏 / 搜索 / 平台歌单等落点不传，
   * 那一行「从本单移出」就不出现。判定由宿主页算好再传。
   */
  hostListId?: string
  hostListName?: string
  /**
   * 场景：'queue' = 播放列表面板行内「⋯」，菜单换成队列专用项；
   * 其余落点不传（默认 'default'）。
   */
  scene?: 'default' | 'queue'
  /** queue 场景的行集与动作（宿主算好传入，本面板纯展示） */
  queueActions?: NewUiQueueMoreActions
}

/**
 * 播放列表面板行内「⋯」的行集：只看这次要播什么 / 指定下一首 / 切过去听，
 * 收藏、加入歌单等不重复铺。
 */
export interface NewUiQueueMoreActions {
  /** 是不是正在出声的那一行 */
  isCurrent: boolean
  /** 当前行唯一一项：这首从头再放 */
  onAgain: () => void
  /** 听这一首 */
  onPlay: () => void
  /** 下一曲播放 */
  onNext: () => void
  /**
   * 「移出」的文案与动作；缺省 = 这一行移不出，就不给死按钮。
   * 写哪一种文案由宿主按「这一列是谁家的」决定。
   */
  remove?: { label: string, onPress: () => void }
}

/**
 * 单曲操作面板：头部（封面 + 歌名 + 平台徽标 + 歌手 · 专辑）+ 动作行
 * （收藏 / 下一曲播放 / 自建详情层里「从本单移出」/ 逐自建歌单「加入」）。
 * 动作全部只读复用既有函数；加入候选只留纯自建歌单（收藏来的挂平台侧，塞歌平台不认）。
 */
export const MoreSheet = ({ visible, musicInfo, onClose, bottomInset, hostListId, hostListName, scene = 'default', queueActions }: MoreSheetProps) => {
  const theme = useTheme()
  const assertApiSupport = useApiSupport()
  const loveSongs = useLoveSongs()
  const myLists = useMyPlaylists()
  // 插入位置（顶部 / 底部）跟随用户设置
  const addMusicLocationType = useSettingValue('list.addMusicLocationType')

  // 退场动画期间父层可能已把 musicInfo 置 null：镜像最后一帧，避免内容闪空
  const lastRef = useRef<LX.Music.MusicInfo | null>(musicInfo)
  if (musicInfo != null) lastRef.current = musicInfo
  const song = musicInfo ?? lastRef.current

  // 「我喜欢」里逐首有 id，直接同步判定
  const loved = song != null && loveSongs.some(s => s.id === song.id)

  // 本面板无输入控件，从带键盘的屏打开时键盘会盖住上半，故打开即收起键盘；
  // 此逻辑只挂这里，不可下沉到通用 Sheet（会顶掉 NameSheet / SourceSheet 的 autoFocus）
  useEffect(() => {
    if (visible) Keyboard.dismiss()
  }, [visible])

  // 可加入的歌单 = 用户自建列表（排除 love / default 两个系统列表），
  // 并排掉有平台坐标的收藏单（挂在平台侧，塞歌平台不认）
  const playlists = useMemo(
    () => myLists.filter(list =>
      list.id !== LIST_IDS.LOVE &&
      list.id !== LIST_IDS.DEFAULT &&
      !hasPlatformHome(list)),
    [myLists],
  )

  // 查重名单 = 候选名单 + 宿主单（防御未来「非候选却是自建单」的落点）
  const playlistIdsKey = useMemo(() => {
    const ids = playlists.map(list => list.id)
    if (hostListId != null && hostListId !== '' && !ids.includes(hostListId)) ids.push(hostListId)
    return ids.join('|')
  }, [playlists, hostListId])

  // 去重表：逐歌单查这首歌在不在（getListMusics 自带缓存）
  const [existsMap, setExistsMap] = useState<Readonly<Record<string, boolean>>>({})
  const songId = song?.id ?? ''

  // 「从本单移出」行出现条件：传了宿主单且这首歌确实在其中（复用同一批查重结果）
  const inHostList = hostListId != null && hostListId !== '' && existsMap[hostListId] === true
  // 必须带 visible 依赖、每次打开重查：song 走 lastRef 镜像，关闭后 songId 不归 ''，
  // 否则同一首歌「加入 → 关闭 → 再开」依赖不变，effect 不重跑，已加入的行不置灰
  useEffect(() => {
    if (!visible) return
    // queue 场景没有「加入歌单」行，查重整段跳过
    if (scene === 'queue') return
    if (!songId || playlistIdsKey.length === 0) {
      setExistsMap({})
      return
    }
    let alive = true
    const ids = playlistIdsKey.split('|')
    void Promise.all(ids.map(id => getListMusics(id).then(musics => musics.some(m => m.id === songId))))
      .then(results => {
        if (!alive) return
        const next: Record<string, boolean> = {}
        ids.forEach((id, i) => {
          next[id] = results[i]
        })
        setExistsMap(next)
      })
      .catch(() => {
        // 读列表失败不去阻断面板：按「不在」渲染，写入路径自会再查重
      })
    return () => {
      alive = false
    }
  }, [visible, playlistIdsKey, songId, scene])

  /* ---- 动作：点后即关层 + toast；查重失败不关层 ---- */
  const handleFav = useCallback(() => {
    if (song == null) return
    if (loved) {
      void removeListMusics(LIST_IDS.LOVE, [song.id]).then(() => {
        onClose()
        showNewUiToast(NEW_UI_SHEET_MORE.favRemoved)
      })
      return
    }
    void addListMusics(LIST_IDS.LOVE, [song], addMusicLocationType).then(() => {
      onClose()
      showNewUiToast(NEW_UI_SHEET_MORE.favAdded)
    })
  }, [addMusicLocationType, loved, onClose, song])

  const handlePlayLaterPress = useCallback(() => {
    // handlePlayLater 只接受在线曲目；面板无多选态，selectedList 传空数组
    if (song == null || !isOnlineMusic(song)) return
    handlePlayLater(song, [], () => {})
    onClose()
    showNewUiToast(NEW_UI_SHEET_MORE.playLaterAdded(song.name))
  }, [onClose, song])

  const handleAddToList = useCallback((listId: string, listName: string) => {
    if (song == null) return
    // 已在名单内：toast 但不关层
    if (existsMap[listId]) {
      showNewUiToast(NEW_UI_SHEET_MORE.alreadyInList)
      return
    }
    void addListMusics(listId, [song], addMusicLocationType).then(() => {
      onClose()
      showNewUiToast(NEW_UI_SHEET_MORE.listAdded(listName))
    }).catch(() => {
      showNewUiToast(NEW_UI_SHEET_MORE.listAddFailed)
    })
  }, [addMusicLocationType, existsMap, onClose, song])

  // 从宿主自建歌单移出：直接调 core/list.removeListMusics，本层不写存储；
  // 落库后 myListMusicUpdate 事件让详情层与两页就地重铺，宿主滚动位置不变
  const handleRemoveFromHost = useCallback(() => {
    if (song == null || hostListId == null || hostListId === '' || hostListName == null) return
    void removeListMusics(hostListId, [song.id]).then(() => {
      onClose()
      showNewUiToast(NEW_UI_SHEET_MORE.listRemoved(hostListName, song.name))
    }).catch(() => {
      showNewUiToast(NEW_UI_SHEET_MORE.listRemoveFailed)
    })
  }, [hostListId, hostListName, onClose, song])

  if (song == null) return null

  const playable = song.source === 'local' || assertApiSupport(song.source)
  const display = toSongDisplay(song, playable)
  const online = isOnlineMusic(song)

  /** 头部：封面 + 歌名 + 平台徽标 + 歌手 · 专辑，两个场景共用 */
  const songHead = (
    <View style={[styles.head, { borderBottomColor: theme.colors.line }]}>
      <Art
        width={MORE_SONG.artSize}
        height={MORE_SONG.artSize}
        radius={MORE_SONG.artRadius}
        seed={display.artSeed}
        imageUri={display.artUri}
        scrim
      />
      <View style={styles.headBody}>
        <Text
          style={[styles.headTitle, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {display.title}
        </Text>
        <View style={styles.headSub}>
          <SrcBadge label={display.sourceLabel} tint={display.sourceTint ?? theme.colors.text3} />
          <Text style={[styles.headArtist, { color: theme.colors.text3 }]} numberOfLines={1}>
            {display.subtitle}
          </Text>
        </View>
      </View>
    </View>
  )

  /* ---- queue 场景：正在出声那行只有「从头再放」，其余为「听这一首 / 下一曲 / 移出」 ---- */
  if (scene === 'queue' && queueActions != null) {
    return (
      <Sheet visible={visible} onClose={onClose} bottomInset={bottomInset}>
        {songHead}
        <View style={styles.list}>
          {queueActions.isCurrent ? (
            <OptionRow
              icon="play"
              name={NEW_UI_SHEET_QUEUE.again}
              onPress={queueActions.onAgain}
            />
          ) : (
            <>
              <OptionRow
                icon="play"
                name={NEW_UI_SHEET_QUEUE.play}
                onPress={queueActions.onPlay}
              />
              <OptionRow
                icon="next"
                name={NEW_UI_SHEET_QUEUE.next}
                onPress={queueActions.onNext}
              />
              {/* 移不出去的行不给按钮；warn 只把图标位取 dangerInk */}
              {queueActions.remove != null && (
                <OptionRow
                  icon="close"
                  warn
                  name={queueActions.remove.label}
                  onPress={queueActions.remove.onPress}
                />
              )}
            </>
          )}
        </View>
      </Sheet>
    )
  }

  return (
    <Sheet visible={visible} onClose={onClose} bottomInset={bottomInset}>
      {/* 头部：封面 + 歌名 + 徽标 + 歌手 · 专辑 */}
      {songHead}

      {/* 动作行：收藏 / 下一曲 /（自建详情层）从本单移出 / 逐自建歌单加入 */}
      <View style={styles.list}>
        <OptionRow
          icon={loved ? 'heartFill' : 'heart'}
          name={loved ? NEW_UI_SHEET_MORE.unfav : NEW_UI_SHEET_MORE.fav}
          onPress={handleFav}
        />
        {online && (
          <OptionRow
            icon="next"
            name={NEW_UI_SHEET_MORE.playLater}
            onPress={handlePlayLaterPress}
          />
        )}
        {/* 从宿主自建歌单移出：排在「下一曲」之后、加入名单之前 */}
        {inHostList && hostListName != null && (
          <OptionRow
            icon="close"
            warn
            name={NEW_UI_SHEET_MORE.removeFromList(hostListName)}
            onPress={handleRemoveFromHost}
          />
        )}
        {/* 加入候选只有自建歌单；没有自建时空态一句 */}
        {playlists.length ? (
          <>
            <GroupLabel label={NEW_UI_SHEET_MORE.addGroup} />
            {playlists.map(list => (
              <OptionRow
                key={list.id}
                icon="plus"
                name={NEW_UI_SHEET_MORE.addToList(list.name)}
                dimmed={existsMap[list.id] === true}
                onPress={() => handleAddToList(list.id, list.name)}
              />
            ))}
          </>
        ) : (
          <Text style={[styles.note, { color: theme.colors.text3 }]}>
            {NEW_UI_SHEET_MORE.addEmpty}
          </Text>
        )}
      </View>
    </Sheet>
  )
}

MoreSheet.displayName = 'NewUIMoreSheet'

const styles = StyleSheet.create({
  /** 头部：横排，分隔线用底边 */
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MORE_SONG.gap,
    paddingBottom: MORE_SONG.paddingB,
    marginBottom: MORE_SONG.marginB,
    borderBottomWidth: 1,
  },
  /** 头文字列：占满剩余宽度 */
  headBody: { flex: 1, minWidth: 0 },
  /** 歌名：单行省略 */
  headTitle: {
    fontSize: FONT_SIZE.title,
    fontWeight: FONT_WEIGHT.extraBold,
  },
  /** 徽标 + 歌手 · 专辑行 */
  headSub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MORE_SONG.subGap,
    marginTop: MORE_SONG.subMarginTop,
  },
  headArtist: {
    flexShrink: 1,
    fontSize: FONT_SIZE.captionLg,
  },
  /** 动作列表：纵向排列 */
  list: {
    flexDirection: 'column',
    gap: OPTION_ROW.listGap,
  },
  /** 空态说明；与 SourceSheet 的说明句同参数 */
  note: {
    fontSize: FONT_SIZE.caption,
    lineHeight: 18,
  },
})
