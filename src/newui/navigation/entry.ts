import { Dimensions, Platform } from 'react-native'
import { Navigation } from 'react-native-navigation'

import type { ListInfoItem } from '@/store/songlist/state'
import type { NewUiSonglistDetailKind } from '@/newui/const/songlistDetail'
import type { NewUiTabKey } from '@/newui/const/tabs'
import {
  PALETTES,
  PL_LAYER,
  PLAYER,
  SEARCH,
  getCachedNewUiScheme,
  newUiStatusBarStyle,
  readPersistedNewUiScheme,
} from '@/newui/theme'

import {
  NEW_UI_MAIN_SCREEN,
  NEW_UI_OFFLINE_SCREEN,
  NEW_UI_PLAYER_SCREEN,
  NEW_UI_SEARCH_SCREEN,
  NEW_UI_SONGLIST_DETAIL_SCREEN,
  NEW_UI_WELCOME_SCREEN,
} from './screenNames'
import { newUiScreenOptions } from './options'

/**
 * 新 UI 入口：根页面与各层 push。
 * 启用方式：把 src/app.ts 的 `pushHomeScreen()` 换成 `setNewUiRoot()`，回滚换回即可。
 */
export const setNewUiRoot = async () => {
  const scheme = await readPersistedNewUiScheme()
  return Navigation.setRoot({
    root: {
      stack: {
        children: [
          {
            component: {
              name: NEW_UI_MAIN_SCREEN,
              options: newUiScreenOptions(scheme),
            },
          },
        ],
      },
    },
  })
}

/**
 * 冷启动欢迎屏：纯白 overlay 盖住首帧，组件内部淡出后自行 dismiss。
 * 不挂 RNN 转场（showOverlay 不支持 animations），用组件内的 JS 动画控制节奏；
 * 调用方失败即忽略，绝不阻塞首页启动。
 */
export const showNewUiWelcome = async() => {
  // 与首页同一判据取主题：浅色白底深字、深色黑底白字，状态栏图标同步反相
  const scheme = getCachedNewUiScheme()
  const bg = PALETTES[scheme].bg
  return Navigation.showOverlay({
    component: {
      name: NEW_UI_WELCOME_SCREEN,
      options: {
        topBar: { visible: false, height: 0 },
        statusBar: {
          drawBehind: true,
          visible: true,
          style: newUiStatusBarStyle(scheme),
          backgroundColor: bg,
        },
        navigationBar: { backgroundColor: bg },
        layout: { componentBackgroundColor: bg },
        overlay: { interceptTouchOutside: true },
      },
    },
  })
}

/** 从旧界面跳到新界面（并存调试用，不动根页面） */
export const pushNewUiMain = (componentId: string) => {
  return Navigation.push(componentId, {
    component: {
      name: NEW_UI_MAIN_SCREEN,
      options: newUiScreenOptions(getCachedNewUiScheme()),
    },
  })
}

/**
 * push 防重入：RNN 的 push 转场期间再点一次会叠出同一目标。
 * 锁按「目标」分桶（`screen` + 关键 id），同一目标 400ms 内的第二下丢弃，不同目标照常放行；
 * push 失败当场解锁。带标识的路由（歌单详情 / 节目 / 单集）必须把标识拼进桶键。
 */
const PUSH_LOCK_MS = 400
const pushLockAt = new Map<string, number>()

/** 桶键拼装：`screen` 或 `screen#标识`。标识一律由调用方给可序列化的短串（id / source:id） */
const pushLockKey = (name: string, id?: string): string =>
  id == null || id.length === 0 ? name : `${name}#${id}`

const guardedPush = async(
  name: string,
  start: () => Promise<string>,
  lockId?: string,
): Promise<string | undefined> => {
  const key = pushLockKey(name, lockId)
  const now = Date.now()
  const last = pushLockAt.get(key)
  if (last != null && now - last < PUSH_LOCK_MS) return undefined
  pushLockAt.set(key, now)
  const pushed = start()
  pushed.catch(() => {
    if (pushLockAt.get(key) === now) pushLockAt.delete(key)
  })
  return pushed
}

/**
 * 打开新 UI 播放页：整层自下而上平移入场（nativeID 见 screens/Player 根 View），
 * 底色取运行中的主题快照。
 */
export const pushNewUiPlayer = (componentId: string) => {
  return guardedPush(NEW_UI_PLAYER_SCREEN, async() => {
    const { height } = Dimensions.get('window')
    return Navigation.push(componentId, {
      component: {
        name: NEW_UI_PLAYER_SCREEN,
        options: {
          ...newUiScreenOptions(getCachedNewUiScheme()),
          animations: {
            // Android 上 elementTransitions 单独给会被忽略，这里显式写成整层纯平移（去掉 alpha）；
            // waitForRender 等新屏首帧画完再起动画，避免重内容挂载与转场抢帧。
            push: Platform.OS === 'android'
              ? {
                  waitForRender: true,
                  content: {
                    enter: {
                      translationY: {
                        from: height,
                        duration: PLAYER.enterDuration,
                        // 缓动与观感一致；不写这条时 RNN 会落成线性
                        interpolation: { type: 'decelerate' },
                      },
                    },
                  },
                }
              : {
                  waitForRender: true,
                  elementTransitions: [
                    {
                      id: 'newui.player.content',
                      translationY: {
                        from: height,
                        duration: PLAYER.enterDuration,
                      },
                    },
                  ],
                },
            pop: Platform.OS === 'android'
              ? {
                  content: {
                    exit: {
                      translationY: {
                        to: height,
                        duration: PLAYER.enterDuration,
                        interpolation: { type: 'decelerate' },
                      },
                    },
                  },
                }
              : {
                  elementTransitions: [
                    {
                      id: 'newui.player.content',
                      translationY: {
                        to: height,
                        duration: PLAYER.enterDuration,
                      },
                    },
                  ],
                },
          },
        },
      },
    })
  })
}

/**
 * 打开新 UI 搜索层：横向平移整层（nativeID 见 screens/Search 根 View），
 * 底色同播放页，取运行中的主题快照。
 */
export const pushNewUiSearch = (componentId: string) => {
  return guardedPush(NEW_UI_SEARCH_SCREEN, async() => {
    const { width, height } = Dimensions.get('window')
    return Navigation.push(componentId, {
      component: {
        name: NEW_UI_SEARCH_SCREEN,
        options: {
          ...newUiScreenOptions(getCachedNewUiScheme()),
          animations: {
            // Android 同播放页：elementTransitions 单独给会被忽略，这里落成纯平移并去掉 alpha
            push: Platform.OS === 'android'
              ? {
                  waitForRender: true,
                  content: {
                    enter: {
                      translationY: {
                        from: height,
                        duration: SEARCH.enterDuration,
                        interpolation: { type: 'decelerate' },
                      },
                    },
                  },
                }
              : {
                  waitForRender: true,
                  elementTransitions: [
                    {
                      id: 'newui.search.content',
                      translationX: {
                        from: width,
                        duration: SEARCH.enterDuration,
                      },
                    },
                  ],
                },
            pop: Platform.OS === 'android'
              ? {
                  content: {
                    exit: {
                      translationY: {
                        to: height,
                        duration: SEARCH.enterDuration,
                        interpolation: { type: 'decelerate' },
                      },
                    },
                  },
                }
              : {
                  elementTransitions: [
                    {
                      id: 'newui.search.content',
                      translationX: {
                        to: width,
                        duration: SEARCH.enterDuration,
                      },
                    },
                  ],
                },
          },
        },
      },
    })
  })
}

/**
 * 右推层共用体：整层横向平移入场，`contentId` 是目标屏根 View 的 nativeID。
 * 转场只在这里持有，屏内一律调 helper；`lockId` 拼进防重入桶键，用于区分同一屏的不同对象。
 * passProps 必须全部可序列化（RNN 走原生桥）。
 */
const pushPlLayer = (
  componentId: string,
  name: string,
  contentId: string,
  passProps?: Record<string, unknown>,
  lockId?: string,
) => {
  return guardedPush(name, async() => {
    const { width, height } = Dimensions.get('window')
    return Navigation.push(componentId, {
      component: {
        name,
        ...(passProps != null ? { passProps } : {}),
        options: {
          ...newUiScreenOptions(getCachedNewUiScheme()),
          animations: {
            // Android 上 elementTransitions 单独给会被忽略，这里显式写成整层纯平移（去掉 alpha）；
            // waitForRender 等首帧画完再起动画，避免挂载与转场抢帧。
            push: Platform.OS === 'android'
              ? {
                  waitForRender: true,
                  content: {
                    enter: {
                      translationY: {
                        from: height,
                        duration: PL_LAYER.enterDuration,
                        interpolation: { type: 'decelerate' },
                      },
                    },
                  },
                }
              : {
                  waitForRender: true,
                  elementTransitions: [
                    {
                      id: contentId,
                      translationX: {
                        from: width,
                        duration: PL_LAYER.enterDuration,
                      },
                    },
                  ],
                },
            pop: Platform.OS === 'android'
              ? {
                  content: {
                    exit: {
                      translationY: {
                        to: height,
                        duration: PL_LAYER.enterDuration,
                        interpolation: { type: 'decelerate' },
                      },
                    },
                  },
                }
              : {
                  elementTransitions: [
                    {
                      id: contentId,
                      translationX: {
                        to: width,
                        duration: PL_LAYER.enterDuration,
                      },
                    },
                  ],
                },
          },
        },
      },
    })
  }, lockId)
}

/**
 * 打开歌单详情层（平台歌单 / 榜单形态）。
 * info 为既有 ListInfoItem，取数复用 @/core/songlist；kind 决定面包屑与页脚文案；
 * fromTab 是来源主屏 Tab，详情页返回时落回它，非 Tab 页入口不传。
 */
export const pushNewUiSonglistDetail = (
  componentId: string,
  info: ListInfoItem,
  kind: NewUiSonglistDetailKind = 'pl',
  fromTab?: NewUiTabKey,
) => {
  return pushPlLayer(componentId, NEW_UI_SONGLIST_DETAIL_SCREEN, 'newui.songlistDetail.content',
    fromTab != null ? { info, kind, fromTab } : { info, kind },
    // 平台单的桶键带平台 + id：与本地单（local:<id>）互不占位
    `pl:${info.source}:${info.id}`)
}

/**
 * 打开歌单详情层的本地歌单形态：同一屏、同一布局，取数改按本地 listId 读 @/core/list。
 * passProps 只带 id 与名字；kind 缺省 'local'，内置「我喜欢」传 'fav' 换三处文案。
 */
export const pushNewUiLocalListDetail = (
  componentId: string,
  list: { id: string; name: string },
  fromTab?: NewUiTabKey,
  kind: NewUiSonglistDetailKind = 'local',
) => {
  return pushPlLayer(componentId, NEW_UI_SONGLIST_DETAIL_SCREEN, 'newui.songlistDetail.content',
    fromTab != null
      ? { kind, listId: list.id, listName: list.name, fromTab }
      : { kind, listId: list.id, listName: list.name },
    // 本地单的桶键：同一个清单 id 连点才吞，不同清单各自放行
    `local:${list.id}`)
}

/** 打开「已缓存」层；不带 passProps，候选池与扫描结果由屏内经 useOfflineCache 自取。 */
export const pushNewUiOffline = (componentId: string) => {
  return pushPlLayer(componentId, NEW_UI_OFFLINE_SCREEN, 'newui.offline.content')
}
