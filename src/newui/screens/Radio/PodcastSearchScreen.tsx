import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  BackHandler,
  Easing,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import type { ScrollView, TextInput } from 'react-native'
import { Navigation } from 'react-native-navigation'

import type { PodShowRow } from '@/newui/podcast/types'
import { usePodcastSearch } from '@/newui/podcast/hooks'

import { ChipFlow } from '@/newui/components/ChipFlow'
import { Icon } from '@/newui/components/Icon'
import { MinibarHost } from '@/newui/components/Minibar'
import { PagingStatus } from '@/newui/components/PagingStatus'
import { PodcastRow } from '@/newui/components/PodcastRow'
import { SearchTop } from '@/newui/components/SearchTop'

import { newUiPodArtSeed } from '@/newui/const/radio'
import {
  NEW_UI_POD_SEARCH_CANCEL,
  NEW_UI_POD_SEARCH_CLEAR_HISTORY_LABEL,
  NEW_UI_POD_SEARCH_CLEAR_INPUT_LABEL,
  NEW_UI_POD_SEARCH_CLEAR_LABEL,
  NEW_UI_POD_SEARCH_EMPTY_SUB,
  NEW_UI_POD_SEARCH_HISTORY_LABEL,
  NEW_UI_POD_SEARCH_LOADING,
  NEW_UI_POD_SEARCH_PLACEHOLDER,
  NEW_UI_POD_SEARCH_RETRY,
  newUiPodSearchEmptyTitle,
  newUiPodSearchHint,
} from '@/newui/const/radioSearch'
import { useNewUiSystemBar, useSafeArea, useWideLayout } from '@/newui/hooks'
// 直连 entry 而非 '@/newui/navigation' 桶口：避免 navigation/index → register → screens → 本文件的循环引用
import { pushNewUiPodcastDetail } from '@/newui/navigation/entry'
import { CONTROL, FONT_SIZE, FONT_WEIGHT, MOTION, SEARCH, useTheme } from '@/newui/theme'

/** 状态档整块换面的轻淡入缓动：与全站 `--ease` 同一条（MOTION.easing） */
const CONTENT_FADE_EASE = Easing.bezier(
  MOTION.easing[0],
  MOTION.easing[1],
  MOTION.easing[2],
  MOTION.easing[3],
)

export interface PodcastSearchScreenProps {
  componentId: string
}

/**
 * 搜节目层（原型 `#podcastSearchLayer`，U83，`new_design/parts/radio/search.html`；
 * 行为 `app.js` renderPodSearch L2100-2135 / submitPodSearch L2137-2152）。
 *
 * **写法与搜歌那一屏同口径**（判例 `screens/Search/SearchScreen.tsx`）：
 * `.sc-top` 头部固定（输入框常驻）＋ `.sc-body` 自己滚，**不是**电台首页那种三段钉住。
 * 件里归本件的样式为 0 条（`.sc-*` / `.hot-words` / `.empty-tip` / `.pod-list` 全是跨件原子），
 * 因此这里不造新样式，只把 U64/U65 那两屏的档位与结构照搬。
 *
 * 四态（原型逐条）：
 * - 无输入（idle）：只给本机「搜过的词」胶囊 + 清空（app.js L2105-2118）。**热搜不做**，
 *   那句能力说明本轮已撤，词表为空时屏上什么都不放。
 * - 提交后在途：文案仍是原型那句「正在搜索…」（app.js L2122），**壳从 `.empty-tip` 换成 `.pl-status` 状态行**
 *   （2026-10 口味统一：全 App 的「在途」都用 `RunningDots` 三点接力跳动 + 文案，别一个在动一个是死字；
 *   紧随其后的失败态本来就是这一行，两态现在是同一族）。
 * - 接口失败：状态行「这一词没有载入 · 点击重试」——**失败不假装成空结果**。
 * - 零命中：`.sc-empty` 两句；有命中：`.pod-list`（行复用 U81 的 `PodcastRow`，
 *   命中行无名次）+ 尾注 `.sc-hint`「N 个节目」。
 *
 * 发请求的时机与搜歌一致：**回车 / 点词才发**，输入过程不逐字发（app.js L3467 同口径）。
 * 词中途被换掉时那一次的结果不再盖上来——这条判据在数据层 hook 里（请求代次 + `reset`），
 * 屏只负责在清空输入时调 `reset()`。历史词的读写与条数上限（8）全在数据层，屏内不碰存储。
 *
 * 纯 UI 层：取数走 `@/newui/podcast/hooks` 的 `usePodcastSearch`，本屏不写 AsyncStorage、不接播放器。
 */
export const PodcastSearchScreen = ({ componentId }: PodcastSearchScreenProps) => {
  const theme = useTheme()
  const { top, bottom } = useSafeArea()
  // 档位只吃 `layerPaddingX` 这一位：本屏没有钉住段 `.pl-head`（头部是跨件原子 `.sc-top`，
  // 件内已接 `wide?.statusReserve`，见 SearchTop.tsx:64），所以 `wide` 不在这里读
  const { layerPaddingX } = useWideLayout()
  useNewUiSystemBar(componentId)

  const {
    keyword,
    results,
    loading,
    failed,
    search,
    reset,
    retry,
    history,
    clearHistory,
  } = usePodcastSearch()

  // 输入框里的实时文本归本屏自己管（keyword 是上一次**提交**的词）
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<TextInput>(null)
  const bodyRef = useRef<ScrollView>(null)

  /** 提交（回车 / 点词）：空词忽略（原型 submitPodSearch L2138）；记历史由数据层顺手做 */
  const submit = useCallback((raw: string) => {
    const word = raw.trim()
    if (!word) return
    setText(word)
    search(word)
  }, [search])

  // 提交换词后把结果轴归零（原型 `$('#podSearchBody').scrollTop = 0`，app.js L2144）
  useEffect(() => {
    bodyRef.current?.scrollTo({ y: 0, animated: false })
  }, [keyword])

  /**
   * 退层只有这一条出口（取消钮 / 硬件返回键同落点）。**先收键盘再 pop**：
   * 带着键盘退层，转场会拖着输入法一路缩下去，而且回来时那颗 autoFocus 过的输入框
   * 还攥着焦点——键盘会自己再弹一次。
   */
  const goBack = useCallback(() => {
    Keyboard.dismiss()
    void Navigation.pop(componentId)
  }, [componentId])

  // 硬件返回键（判例 RadioHomeScreen.tsx:107-115：本屏存续期始终注册，消费后走 goBack）。
  // 本屏多一道闸：键盘开着时第一下只收键盘，不要连键盘带这一层一起收走。
  // （部分输入法把返回键自己吃掉、事件到不了这里；漏过来的由这道闸兜住，两种设备都只退一层。）
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (Keyboard.isVisible()) {
        Keyboard.dismiss()
        return true
      }
      goBack()
      return true
    })
    return () => { subscription.remove() }
  }, [goBack])

  /**
   * 离屏 / 回屏都收键盘：
   * - 回屏那一下兜住「输入框还留着焦点 → 键盘自己弹回来」（自动聚焦只在挂载时发生一次，
   *   这里不再补 focus，回来就是干净的 idle / 结果态）；
   * - 第一次 `componentDidAppear` 是进层本身，那次要留给 SearchTop 的 autoFocus，跳过。
   */
  const appearedRef = useRef(false)
  useEffect(() => {
    const subscription = Navigation.events().registerComponentListener({
      componentDidAppear: () => {
        if (!appearedRef.current) {
          appearedRef.current = true
          return
        }
        Keyboard.dismiss()
      },
      componentDidDisappear: () => { Keyboard.dismiss() },
    }, componentId)
    return () => { subscription.remove() }
  }, [componentId])

  // 卸载兜底：层被路由侧整棵拆掉时 componentDidDisappear 不一定还送达，键盘不能留在屏上
  useEffect(() => () => { Keyboard.dismiss() }, [])

  /** 清空输入：回到 idle，并作废在途的那一次（hook.reset 里抬代次） */
  const handleClearText = useCallback(() => {
    reset()
    setText('')
    inputRef.current?.focus()
  }, [reset])

  // 逐字退格到空即回 idle（原型本地过滤无此问题，提交式搜索必须给空串分支）
  const handleChangeText = useCallback((value: string) => {
    if (value.length === 0) {
      reset()
    }
    setText(value)
  }, [reset])

  /**
   * 命中行点进去（原型 `podRow` 的 `r.onclick = () => openPodcast(s)`，app.js L1915）。
   * passProps 只带可序列化的那五项（契约 7.3 ④），与电台首页进详情传的是同一份形状；
   * `feedUrl` 是 RSS 入口，本轮不上屏也不往外传。
   */
  const openPodcast = useCallback((row: PodShowRow) => {
    // 进详情前先收键盘：转场不拖输入法，回来时也不会「一睁眼就弹键盘」（回屏那道闸见上）
    Keyboard.dismiss()
    pushNewUiPodcastDetail(componentId, {
      id: row.id,
      name: row.name,
      by: row.by,
      tags: row.tags.slice(),
      artworkUrl: row.artworkUrl,
    })
  }, [componentId])

  const hasQuery = keyword.length > 0

  /**
   * 结果轴（`.sc-body`）的左右内衬接档位。口径记清三件事：
   * - 原型 `.wide` 那一族对搜索层**只**写了 `.sc-top{padding-top:36px}`（styles.css:1341-1342，
   *   那一处的回正已在 SearchTop 件内落地），`.sc-body` **没有**写左右覆盖；本屏按单列行屏同一条
   *   620 居中轴（`max(16px, calc((100% - 620px)/2))`，styles.css:1335-1340 那六处同式）把结果列
   *   也铺到同一根轴上，与搜歌屏（`SearchScreen.tsx:309` 的 `boxStyle`）同档同列；
   * - 竖屏基线 `.sc-body{padding:0 16px 40px}`（styles.css:972）一个字没改：compact 档 `layerPaddingX`
   *   是 undefined → 回 `SEARCH.bodyPaddingX`，逐值零变化；
   * - 竖向两位（0 / 40）不吃档位。
   */
  const bodyContentStyle = useMemo(() => ({
    paddingHorizontal: layerPaddingX ?? SEARCH.bodyPaddingX,
    paddingBottom: SEARCH.bodyPaddingBottom + bottom,
  }), [bottom, layerPaddingX])

  /**
   * 五个状态档（无输入 / 在途 / 失败 / 零命中 / 命中）就是几块整面互斥的面板，原生这里是硬切。
   * 加一层 120ms 轻淡入，**按档位而不是按数据触发**：同一档里结果刷新（重试回来、历史词增删）
   * 不重放；淡的是轴自己的透明度，不额外套壳，滚动位置与内衬测量一位不变。
   */
  const stateKey = !hasQuery
    ? 'idle'
    : loading
      ? 'loading'
      : failed
        ? 'failed'
        : results.length === 0
          ? 'empty'
          : 'results'
  // 初值 0：进层那一帧就从透明淡出来，与右推转场同起，不会先亮一帧再淡
  const contentFade = useRef(new Animated.Value(0)).current
  useEffect(() => {
    contentFade.setValue(0)
    Animated.timing(contentFade, {
      toValue: 1,
      duration: MOTION.contentFade,
      easing: CONTENT_FADE_EASE,
      useNativeDriver: true,
    }).start()
  }, [contentFade, stateKey])

  return (
    <View
      nativeID="newui.podSearch.content"
      style={[styles.root, { backgroundColor: theme.colors.bg }]}
    >
      {/* .sc-top（复用 U62 的件，第二处实例）：占位与右上那颗按 Apple 用词 */}
      <SearchTop
        ref={inputRef}
        value={text}
        focused={focused}
        topInset={top}
        placeholder={NEW_UI_POD_SEARCH_PLACEHOLDER}
        cancelLabel={NEW_UI_POD_SEARCH_CANCEL}
        clearLabel={NEW_UI_POD_SEARCH_CLEAR_INPUT_LABEL}
        onChangeText={handleChangeText}
        onFocus={() => { setFocused(true) }}
        onBlur={() => { setFocused(false) }}
        onSubmit={() => { submit(text) }}
        onClear={handleClearText}
        onCancel={goBack}
      />

      {/* .sc-body：本屏唯一的滚动轴（头部不在里面）；命中固定 ≤20 条，不虚拟化。
          状态档切换只挂透明度（`Animated.ScrollView`）：轴、内衬与命中行的测量一位不变 */}
      <Animated.ScrollView
        ref={bodyRef}
        style={[styles.body, { opacity: contentFade }]}
        contentContainerStyle={[styles.bodyContent, bodyContentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!hasQuery ? (
          // idle：本机搜过的词 + 清空；没有词就整块不给（原型也不给别的解释）
          history.length > 0 && (
            <>
              <View style={styles.label}>
                <Text style={[styles.labelText, { color: theme.colors.text2 }]}>
                  {NEW_UI_POD_SEARCH_HISTORY_LABEL}
                </Text>
                <Pressable
                  hitSlop={CONTROL.moreHitSlop}
                  onPress={clearHistory}
                  style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={NEW_UI_POD_SEARCH_CLEAR_HISTORY_LABEL}
                >
                  <Icon name="close" size={SEARCH.clearWordIcon} color={theme.colors.text3} />
                  <Text style={[styles.clearText, { color: theme.colors.text3 }]}>
                    {NEW_UI_POD_SEARCH_CLEAR_LABEL}
                  </Text>
                </Pressable>
              </View>
              <ChipFlow
                items={history.map(word => ({ key: word, label: word }))}
                onSelect={submit}
              />
            </>
          )
        ) : loading ? (
          /*
           * 在途与下面那条失败现在是同一族状态行（`.pl-status`）：文案前挂三点接力跳动的
           * `RunningDots`，失败那条是本行可点重试 —— 别一个在动、一个是死字。
           * 文案仍是原型 `renderPodSearch` L2122 那句「正在搜索…」，一个字没改。
           */
          <PagingStatus disabled loading text={NEW_UI_POD_SEARCH_LOADING} />
        ) : failed ? (
          // 接口失败：状态行就是重试入口，不拿空结果冒充
          <PagingStatus text={NEW_UI_POD_SEARCH_RETRY} onPress={retry} />
        ) : results.length === 0 ? (
          // .sc-empty：与搜歌同一族
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: theme.colors.text2 }]}>
              {newUiPodSearchEmptyTitle(keyword)}
            </Text>
            <Text style={[styles.emptySub, { color: theme.colors.text3 }]}>
              {NEW_UI_POD_SEARCH_EMPTY_SUB}
            </Text>
          </View>
        ) : (
          <>
            {/* .pod-list：命中行没有名次（原型 podRow(s, 0)，不传 rank 时那一整个槽位不画）；
                行尾只挂一枚分类词由 PodcastRow 内部取 tags[0]（podRow L1905-1912），这里给全量 */}
            <View style={styles.list}>
              {results.map(row => (
                <PodcastRow
                  key={row.id}
                  artSeed={newUiPodArtSeed(row.id)}
                  artUri={row.artworkUrl}
                  name={row.name}
                  by={row.by}
                  tags={row.tags}
                  onPress={() => { openPodcast(row) }}
                />
              ))}
            </View>
            {/* .sc-hint：命中后底部只留这一个数 */}
            <Text style={[styles.hint, { color: theme.colors.text3 }]}>
              {newUiPodSearchHint(results.length)}
            </Text>
          </>
        )}
      </Animated.ScrollView>
      {/* 常驻迷你播放条：本层默认磁吸圆点（原型 miniPageSnapped：不在首页就是圆点）。
          挂在滚动轴之后、屏幕根层最后——圆点浮在内容之上，弹层与提示胶囊仍压在它上面 */}
      <MinibarHost componentId={componentId} bottomInset={bottom} defaultSnapped />
    </View>
  )
}

PodcastSearchScreen.displayName = 'NewUIPodcastSearchScreen'

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  /** .sc-body{flex:1;overflow-y:auto;padding:0 16px 40px} */
  body: {
    flex: 1,
    minHeight: 0,
  },
  /** 结果列基线内衬（`.sc-body{padding:0 16px 40px}` 的左右那一位）：宽屏档由上面的 bodyContentStyle
   *  覆盖成 620 居中轴的内衬，compact 两处同值（`layerPaddingX` undefined → 仍回 `SEARCH.bodyPaddingX`） */
  bodyContent: {
    paddingHorizontal: SEARCH.bodyPaddingX,
  },
  /** .sc-label margin:18px 0 10px / 12.5 / 600，b 走 text-2 700 */
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SEARCH.labelMarginTop,
    marginBottom: SEARCH.labelMarginBottom,
  },
  labelText: {
    fontSize: FONT_SIZE.smallLg,
    fontWeight: FONT_WEIGHT.bold,
  },
  /** .sc-clear：11.5 / text-3 / gap 1（图标 13） */
  clear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  clearText: {
    fontSize: FONT_SIZE.captionLg,
  },
  pressed: {
    opacity: 0.6,
  },
  /** 原型 renderPodSearch 里 `list.style.marginTop = '4px'`（命中列表贴输入框下 4） */
  list: {
    marginTop: 4,
  },
  /** .sc-empty：padding 46px 0 / 居中 */
  empty: {
    paddingVertical: SEARCH.emptyPaddingY,
    alignItems: 'center',
  },
  /** .sc-empty b：14 / 750 / text-2 / mb 4 */
  emptyTitle: {
    fontSize: FONT_SIZE.rank,
    fontWeight: FONT_WEIGHT.extraBold,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: FONT_SIZE.smallLg,
    lineHeight: SEARCH.emptyLineHeight,
    textAlign: 'center',
  },
  /** .sc-hint：11 / mt 16 / 行高 1.7 ≈ 19 */
  hint: {
    marginTop: SEARCH.hintMarginTop,
    fontSize: FONT_SIZE.caption,
    lineHeight: 19,
  },
})
