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
  /** 目标曲目（原型 openMore 的 s，app.js L1520）；null 时不渲染内容（退场帧走镜像值） */
  musicInfo: LX.Music.MusicInfo | null
  onClose: () => void
  /** 底部安全区（透传给 Sheet） */
  bottomInset?: number
  /**
   * 宿主单（需求 2，件 U76 + openMore L1558-1572）：只有**自建歌单详情层**（原型判
   * `plNow.kind === 'local'` 且能在 MY_PLAYLISTS 命中这张单）才传这两个字段，
   * 主屏 / 搜索 / 平台歌单 / 收藏歌单等落点不传，那一行就不出现。
   * 判定由宿主页算好再传（详情屏现成有 kind / listId / listName 三个 passProps），
   * 本面板不读任何路由状态。
   */
  hostListId?: string
  hostListName?: string
  /**
   * 场景（原型 songRow 的第 5 参 scene，app.js L435 / openMore L1628-1652）：
   * `'queue'` = 播放列表面板那一屏（件 U80）的行内「⋯」，整份菜单换成 openQueueMore L1581 那几项；
   * 其余落点不传（默认 `'default'`），仍是上面这一份通用菜单，一字未动。
   */
  scene?: 'default' | 'queue'
  /**
   * queue 场景的行集与动作（由宿主 QueueSheet 算好传入，本面板纯展示）：
   * 正在出声的那一行只有「这首从头再放」，其余行是「听这一首 / 下一曲播放 / 移出」。
   * 非 queue 场景不传即可。
   */
  queueActions?: NewUiQueueMoreActions
}

/**
 * 播放列表面板那一屏的行内「⋯」行集（原型 openQueueMore，app.js L1581-1626）。
 * 这一屏只有「看这次要播什么 / 指定下一首 / 切过去听」三件事，
 * 收藏、加入歌单那些在别的入口都有，这里不重复铺（原型原话）。
 */
export interface NewUiQueueMoreActions {
  /** 是不是正在出声的那一行 */
  isCurrent: boolean
  /** 当前行唯一一项：这首从头再放 */
  onAgain: () => void
  /** 听这一首 */
  onPlay: () => void
  /** 下一曲播放（全站只有这一条写法，与歌单详情层同一族） */
  onNext: () => void
  /**
   * 「移出」这一行的文案与动作；**缺省 = 这一行移不出去，就不给一颗死按钮**。
   * 写哪一种文案由宿主按「这一列是谁家的」决定（原型 queueOwner 标记）：
   * 本机的一张单子 → 「从「X」移出」，这一次播放临时凑出来的一列 → 「这次不播这一首」。
   */
  remove?: { label: string, onPress: () => void }
}

/**
 * 单曲操作面板（原型 #moreSheet，件 parts/sheets/more-sheet.{html,css} = U76，index.html L479-486；
 * openMore / actRow，app.js L1520-1594）。
 * 头部 .more-song（styles.css L523-527）：封面 + 歌名 + 平台徽标 + 「歌手 · 专辑」；
 * 下面 .opt-list 动作行 = 收藏切换 / 下一曲播放 / （自建歌单详情层里）从本单移出 / 逐自建歌单「加入」
 * （原型 L1541-1591 的行集，未添加原型没有的行；旧 App 还有分享 / 清缓存 / 不喜欢等菜单项，原型面板没画就不凭空加行）。
 * 动作全部只读复用既有函数（零重写）：
 * - 收藏 = addListMusics / removeListMusics 对 LIST_IDS.LOVE（core/player 的 collectMusic L638-657
 *   内部走的也是这一对，但它只吃「当前播放曲」，面板是任意曲，故直用底层同一函数）
 * - 下一曲 = OnlineList/listAction.handlePlayLater L21（addTempPlayList；**只吃 MusicInfoOnline，
 *   本地曲目整行隐藏**，原型 mock 没有本地曲概念）
 * - 加入歌单 = addListMusics（与旧 MusicAddModal.tsx L64 同款调用与 locationType 设置键）；
 *   去重语义 = 旧 MusicAddModal/ListItem.tsx L16-23：已存在则 dimmed + 点击只 toast 不入列
 * - 移出宿主单 = removeListMusics（**与旧「我的歌单」曲目屏同一条通道**：
 *   screens/Home/Views/Mylist/MusicList/listAction.ts 的 handleRemove 单项分支 L39 就是这一句，
 *   本面板传入的 selectedList 恒空，故直接调它底下那颗 store action，不另写存储）。
 *   落库后 event/listEvent 会广播 myListMusicUpdate，详情层既有订阅就地重铺（不在本层动滚动位置）
 * - 歌单行数据 = useMyPlaylists（store/list allList），排除「我喜欢」与「默认试听」两系统列表
 * - 加入候选 = **只留纯自建**（需求 1，原型 addablePlaylists L889 只取 MY_PLAYLISTS）：
 *   收藏来的那份挂在平台侧（有 source + sourceListId = hasPlatformHome），往里塞歌平台不认，
 *   因此根本不进这份名单；范围写在名单上方一句（MORE_TXT.addGroup），一份自建都没有时换成空态句
 *   （MORE_TXT.addEmpty，原型挂 .q-note 位）。「整份移出收藏」等既有能力不在这面板上，一字未动
 */
export const MoreSheet = ({ visible, musicInfo, onClose, bottomInset, hostListId, hostListName, scene = 'default', queueActions }: MoreSheetProps) => {
  const theme = useTheme()
  const assertApiSupport = useApiSupport()
  const loveSongs = useLoveSongs()
  const myLists = useMyPlaylists()
  // 与旧 MusicAddModal L64-66 同一设置键：插入位置（顶部/底部）跟随用户设置
  const addMusicLocationType = useSettingValue('list.addMusicLocationType')

  // 退场动画期间父层可能已把 musicInfo 置 null：镜像最后一帧，避免内容闪空
  const lastRef = useRef<LX.Music.MusicInfo | null>(musicInfo)
  if (musicInfo != null) lastRef.current = musicInfo
  const song = musicInfo ?? lastRef.current

  // 「我喜欢」里逐首就有 id，直接同步判定（原型 state.fav.has(s.id)，L742）
  const loved = song != null && loveSongs.some(s => s.id === song.id)

  // 缺陷修复（9e 真机核验 2026-10-11）：本面板**没有任何输入控件**（原型 #moreSheet 就没有），
  // 从搜索页等带键盘的屏打开时，键盘会盖掉面板上半。打开即主动收起。
  // **只挂 MoreSheet**：NameSheet / SourceSheet 自身有 TextInput 且靠 autoFocus 起键盘，
  // 此逻辑不得下沉到通用 Sheet，否则会把它们的 autoFocus 顶掉。
  useEffect(() => {
    if (visible) Keyboard.dismiss()
  }, [visible])

  // 可加入的歌单 = 用户自建列表（排除 love 与 default 两个系统列表；
  // 原型 MY_PLAYLISTS 就只是自建歌单，收藏已有专门第一行）。
  // 需求 1（件 U76 + addablePlaylists，app.js L889）：在此之上再排掉「有平台坐标」的那份——
  // 收藏来的平台歌单在本地也有单子（source + sourceListId 成对，口径同 hasPlatformHome /
  // 上一轮「我的」卡面分叉），但它挂在平台侧，往里塞歌平台不认，所以它不进这份候选名单。
  // 只是收窄候选集，写入路径与去重语义一字未动。
  const playlists = useMemo(
    () => myLists.filter(list =>
      list.id !== LIST_IDS.LOVE &&
      list.id !== LIST_IDS.DEFAULT &&
      !hasPlatformHome(list)),
    [myLists],
  )

  // 查重表要读的名单 = 候选名单 + 宿主单（宿主单本就是纯自建，正常已在候选里；
  // 并进来只是防御将来有「非候选却是自建单」的落点，多读一次带缓存的 getListMusics 而已）。
  // 键名沿用原称 playlistIdsKey，下面那条既有查重 effect 一字未动
  const playlistIdsKey = useMemo(() => {
    const ids = playlists.map(list => list.id)
    if (hostListId != null && hostListId !== '' && !ids.includes(hostListId)) ids.push(hostListId)
    return ids.join('|')
  }, [playlists, hostListId])

  // 去重表：逐歌单查这首歌在不在（getListMusics 内部自带缓存，旧 ListItem 同款异步判定）
  const [existsMap, setExistsMap] = useState<Readonly<Record<string, boolean>>>({})
  const songId = song?.id ?? ''

  // 宿主单的「移出」行出现条件（原型 L1559-1561：host 命中 MY_PLAYLISTS 且 host.tracks 里有这首歌）：
  // 得宿主页把这张单传进来才谈（需求 2 只落在自建歌单详情层），再加上「这首歌确实在这张单里」——
  // 这一条读的就是同一批既有查重结果，不另发查询、不另存状态
  const inHostList = hostListId != null && hostListId !== '' && existsMap[hostListId] === true
  // 缺陷修复（9e 真机核验 2026-10-11）：**必须带 visible 依赖，每次打开重查**。
  // 根因：song 走 lastRef 镜像（退场动画需要，勿去掉），关闭后 songId 不会归 ''，
  // 若只依赖 [playlistIdsKey, songId]，同一首歌「加入 → 关闭 → 再开」两依赖不变，
  // effect 不重跑，existsMap 冻结在首开结果 → 已加入的行不置灰。
  // 加入成功的 addListMusics 是 await 事件链的（core/list.ts L49），重开时重查必能读到新状态，
  // 故不另存「刚加过谁」的本地脏标记（会与真实 store 打架）。
  // 关闭期间不查询、保留旧表——退场帧行状态不闪；重开由本 effect 刷新。
  useEffect(() => {
    if (!visible) return
    // queue 场景（件 U80）没有「加入歌单」那一批行，查重表整段跳过，不发多余读库
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

  /* ---- 动作（原型每条 actRow 点后即关层 + toast，L746/756/762；查重失败不关层 L760） ---- */
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
    // handlePlayLater 只接受在线曲目；面板无多选态，selectedList 传空数组（旧列表单项同款用法）
    if (song == null || !isOnlineMusic(song)) return
    handlePlayLater(song, [], () => {})
    onClose()
    showNewUiToast(NEW_UI_SHEET_MORE.playLaterAdded(song.name))
  }, [onClose, song])

  const handleAddToList = useCallback((listId: string, listName: string) => {
    if (song == null) return
    // 已在名单内：toast 不关层（原型 L760；旧 MusicAddModal/ListItem L19-22 同语义）
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

  // 从宿主自建歌单移出（需求 2，原型 openMore L1562-1572）：走的就是旧「我的歌单」曲目屏
  // handleRemove 单项分支底下那颗 store action（core/list.removeListMusics），本层不写任何存储。
  // 落库后 event/listEvent 广播 myListMusicUpdate + 曲目计数变化，详情层与「我的」「歌单」两页
  // 的既有订阅会就地重铺（宿主页保持原滚动位置，不为 scrollTop 动数据层）
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

  /**
   * .more-song 头部（styles.css L529-533）：封面 44 / 歌名 14.5·800 / 徽标 + 歌手·专辑。
   * 两个场景共用同一块 —— 原型 openMore 那句「头部那块（封面 + 歌名 + 平台 + 歌手 · 专辑）
   * 与浮层骨架都是现成的，不另起一层」（app.js L1647-1649）。
   */
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

  /* ---- queue 场景（件 U80 · openQueueMore L1581-1626）：行集逐字按原型定稿 ----
   * 这一屏只有「看这次要播什么 / 指定下一首 / 切过去听」三件事：
   * 正在出声那行只有一项「这首从头再放」，其余三项「听这一首 / 下一曲播放 / 移出」。
   * 收藏、加入歌单那些在别的入口都有，这里不重复铺（原型原话），故整份通用菜单让位给这一小份。 */
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
              {/* 移不出去的那一行不给按钮（宁缺毋假）；.opt-row.warn 只把图标位取 dangerInk */}
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
      {/* .more-song 头部（styles.css L523-527）：封面 44 / 歌名 14.5·800 / 徽标 + 歌手·专辑 */}
      {songHead}

      {/* .opt-list（styles.css L745，件 parts/common-control/opt-list.css U19）：
          收藏 / 下一曲 /（自建详情层）从本单移出 / 分组标题 + 逐自建歌单
          （原型 actRow L1596-1601 = 图标方块 + 文字） */}
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
        {/* 从宿主自建歌单移出（原型 L1562-1572 行位就排在「下一曲播放」之后、加入名单之前；
            .opt-row.warn 只把图标位取 danger-ink，与下面「加入」那一批一眼分开） */}
        {inHostList && hostListName != null && (
          <OptionRow
            icon="close"
            warn
            name={NEW_UI_SHEET_MORE.removeFromList(hostListName)}
            onPress={handleRemoveFromHost}
          />
        )}
        {/* 加入候选只有自建歌单（原型 L1579-1592：addable.length 分支挂 .group-label，
            else 分支挂 .q-note 一句空态） */}
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
  /** .more-song：flex row gap 11 / padding-bottom 13 / margin-bottom 13 / 1px line 底边（L523） */
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MORE_SONG.gap,
    paddingBottom: MORE_SONG.paddingB,
    marginBottom: MORE_SONG.marginB,
    borderBottomWidth: 1,
  },
  /** .ms-body：flex:1 min-width:0（L525） */
  headBody: { flex: 1, minWidth: 0 },
  /** .ms-t：14.5 / 800 / 单行省略（L526） */
  headTitle: {
    fontSize: FONT_SIZE.title,
    fontWeight: FONT_WEIGHT.extraBold,
  },
  /** .ms-s：11.5 / text-3 / margin-top 3；行内 badge 与文字 gap 6（L527 + openMore 内 sub 的 flex/gap 内联样式） */
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
  /** .opt-list：column gap 7（styles.css L745，件 U19） */
  list: {
    flexDirection: 'column',
    gap: OPTION_ROW.listGap,
  },
  /** .q-note：11 / text-3 / 行高 1.6（styles.css L771，件 U21 持有该原子）；
   * more-sheet.css L21 让它在 #moreActions 里整行占满——RN 里它是 .opt-list 的直接子节点，天然满宽。
   * 与 SourceSheet 的同原子同参数（那张的 .q-note 也是 11 / lineHeight 18） */
  note: {
    fontSize: FONT_SIZE.caption,
    lineHeight: 18,
  },
})
