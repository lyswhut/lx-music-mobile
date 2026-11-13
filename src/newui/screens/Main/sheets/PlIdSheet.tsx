import { useCallback, useState } from 'react'
import { StyleSheet, Text } from 'react-native'

// 直连 entry 而非 '@/newui/navigation' 桶口：避免 register→screens→…→本文件的循环引用（同各页做法）
import { pushNewUiSonglistDetail } from '@/newui/navigation/entry'

import { ChipFlow, GroupLabel, OpInputRow, Sheet } from '@/newui/components'
import {
  NEW_UI_SHEET_PL_ID,
  PLATFORM_META,
  PLATFORM_SOURCE_KEYS,
  getPlatformMeta,
} from '@/newui/const'
import { NEW_UI_PLAYLIST_REC_TAG, usePlaylistCategories, usePlaylistPool } from '@/newui/hooks'
import { FONT_SIZE, OP_BOX, OPTION_ROW, useTheme } from '@/newui/theme'
import { looksLikeLink, resolvePlIdSource, showNewUiToast } from '@/newui/utils'

export interface PlIdSheetProps {
  visible: boolean
  onClose: () => void
  /** RNN 主屏 ID：打开动作 = push 新 UI 歌单详情层（9c 已交付，取数/分页/播放/收藏都现成） */
  componentId: string
  /** 底部安全区（透传给 Sheet） */
  bottomInset?: number
}

/** 样本 chips 取前几条（原型 renderPlIdSamples 取 PLAYLISTS 前 4 条，app.js L1122） */
const SAMPLE_LIMIT = 4

/**
 * 「打开歌单」浮层（原型 #plIdSheet，index.html L411-427；tryOpenByPid，app.js L1139-1162）。
 * 入口 = 歌单页页头「按链接打开」胶囊（原型 #plOpenBtn，index.html L171；接线 app.js L2591）。
 *
 * 与原型 tryOpenByPid 的语义差异（原型是 mock，真实侧不能照抄）：
 * - 原型在 mock 表里按 pid + 平台匹配（L1154-1156，匹不到就合成一张空单交详情层承担），
 *   真实侧打开在线歌单同样需要 {source, listId} 两个坐标：
 *   **链接按域名定平台**（映射与依据行号见 utils/plId.ts），判定出平台后整条输入原样交给
 *   对应 SDK 的 getListDetail 解析（五平台 SDK 都自带链接解析，不另写一份更脆的抽取正则）；
 * - **裸 ID 必须显式选平台**：新 UI 没有全局「当前平台」状态可猜（搜索页自带来源 tab），
 *   未选就点「打开」走 .op-err 如实报错，禁止默认猜平台、不造「自动识别」假能力；
 * - 样本 chips 用真实数据源 = 本页「推荐歌单」池（与 PlaylistPage 同一 usePlaylistCategories +
 *   usePlaylistPool 首位「推荐」分类（= 不传分类的整池），core/songlist.getList 内部按页缓存，同参重开秒回不重复请求）；
 *   池子为空（还在加载 / 取数失败）时整组连同 .group-label 隐藏，不留空组、不写死示例 id；
 * - 打开动作 = 关浮层 → pushNewUiSonglistDetail（**不在本层预取详情再传**，info 只带真实拿得到的
 *   坐标，name 留空走详情屏自己的头部兜底，取不到由详情屏 NEW_UI_PLD_EMPTY.error 空态承担）；
 * - 成功 toast 用原型实际渲染句 PLID.opened（app.js L1160，句内本就不报数量：此刻一首都没取回来，
 *   见 const/plIdSheet.ts 的 QA D56 注）。
 *
 * 结构说明：输入态与池子 hook 都在 `PlIdSheetBody` 子件里，Sheet 关闭后卸载子件（见 Sheet.tsx
 * mounted 逻辑），故浮层没打开时 usePlaylistCategories/usePlaylistPool 不发请求；每次重开都是全新
 * 挂载，输入自然复位（等价原型 openPlIdSheet L1130-1132 的清空），平台选择也回到未选、不残留误导。
 */
export const PlIdSheet = ({ visible, onClose, componentId, bottomInset }: PlIdSheetProps) => (
  <Sheet
    visible={visible}
    title={NEW_UI_SHEET_PL_ID.title}
    subtitle={NEW_UI_SHEET_PL_ID.sub}
    onClose={onClose}
    bottomInset={bottomInset}
  >
    <PlIdSheetBody componentId={componentId} onClose={onClose} />
  </Sheet>
)

PlIdSheet.displayName = 'NewUIPlIdSheet'

const PlIdSheetBody = ({ componentId, onClose }: Pick<PlIdSheetProps, 'componentId' | 'onClose'>) => {
  const theme = useTheme()
  const [input, setInput] = useState('')
  const [err, setErr] = useState('')
  // 裸 ID 时用户显式选定的平台（链接形态按域名判定，与此无关）
  const [picked, setPicked] = useState<LX.OnlineSource | null>(null)

  // 样本 chips：歌单页同款真实推荐池（见头部注释；随子件挂载才取数，走 core 缓存）
  const cats = usePlaylistCategories()
  const pool = usePlaylistPool(cats.source, NEW_UI_PLAYLIST_REC_TAG, cats.sortId)

  // 原型 tryOpenByPid L525-526：关浮层 → 开详情层；toast 如实（不含数量，见 const 注释）
  const openTarget = useCallback((source: LX.OnlineSource, listId: string) => {
    onClose()
    // fromTab='playlist'：此浮层的入口在歌单页（pid 钮），返回落回歌单 Tab
    pushNewUiSonglistDetail(componentId, { id: listId, source, name: '', author: '' }, 'pl', 'playlist')
    showNewUiToast(NEW_UI_SHEET_PL_ID.opened(getPlatformMeta(source).short))
  }, [componentId, onClose])

  // 校验链 = 原型 tryOpenByPid L519-524 的真实侧等价物（分支与文案见 const/plIdSheet.ts）
  const handleOpen = useCallback(() => {
    const raw = input.trim()
    if (!raw) {
      setErr(NEW_UI_SHEET_PL_ID.err.empty)
      return
    }
    const linkSource = resolvePlIdSource(raw)
    if (linkSource) {
      // 链接形态：域名即坐标，整条输入交对应 SDK 自解析
      openTarget(linkSource, raw)
      return
    }
    if (looksLikeLink(raw)) {
      setErr(NEW_UI_SHEET_PL_ID.err.unknownDomain)
      return
    }
    // 裸 ID 形态：必须显式选平台
    if (!picked) {
      setErr(NEW_UI_SHEET_PL_ID.err.needPlatform)
      return
    }
    // 形态粗检：接受数字与字母数字组合（酷狗 gcid 等为字母数字，不照抄原型 \d{5,}）
    if (!/^[\w-]{4,}$/.test(raw)) {
      setErr(NEW_UI_SHEET_PL_ID.err.badId)
      return
    }
    openTarget(picked, raw)
  }, [input, openTarget, picked])

  return (
    <>
      {/* .op-box（index.html L417-420）：打开即聚焦输入框（原型 openPlIdSheet L1136 的 focus） */}
      <OpInputRow
        value={input}
        onChangeText={text => {
          setInput(text)
          if (err.length > 0) setErr('')
        }}
        placeholder={NEW_UI_SHEET_PL_ID.placeholder}
        goLabel={NEW_UI_SHEET_PL_ID.go}
        autoFocus
        autoCapitalize="none"
        onGo={handleOpen}
        onSubmitEditing={handleOpen}
        style={styles.opRow}
      />
      {/* .op-err（index.html L421，styles.css L773） */}
      {err.length > 0 && (
        <Text style={[styles.opErr, { color: theme.colors.dangerInk }]}>{err}</Text>
      )}

      {/* 「裸 ID 先选平台」chips（原型这一组本就渲染：静态组名 index.html L423 + 胶囊容器 #plIdPlats
          L424 由 renderPlIdPlats 按 SOURCES 全称填充（app.js L1108-1116，QA D58）；
          链接能按域名认出来，一串号认不出来，真实侧需要 source 坐标且不许猜） */}
      <GroupLabel label={NEW_UI_SHEET_PL_ID.groupPlatform} />
      <ChipFlow
        items={PLATFORM_SOURCE_KEYS.map(key => ({
          key,
          // 平台胶囊用全称（原型 renderPlIdPlats app.js L1113 取 SOURCES[p].label，QA D58）
          label: PLATFORM_META[key as keyof typeof PLATFORM_META].label,
          active: key === picked,
        }))}
        onSelect={key => {
          setPicked(key as LX.OnlineSource)
          if (err.length > 0) setErr('')
        }}
      />

      {/* 「可以试试这几个」样本 chips（原型 renderPlIdSamples，app.js L1123：
          mock 前 4 条 → 真实推荐池前 4 条；池为空整组隐藏。原型是「填输入再试开」（L1124），
          真实侧条目自带 {source, id} 坐标，点 chip 直接走同一条打开路径。
          胶囊两段式（QA D87）：平台短名走常规 chip 字、ID 走原型 .chip b 的等宽 11.5/700 */}
      {pool.items.length > 0 && (
        <>
          <GroupLabel label={NEW_UI_SHEET_PL_ID.groupSamples} />
          <ChipFlow
            items={pool.items.slice(0, SAMPLE_LIMIT).map((item, i) => ({
              key: String(i),
              label: getPlatformMeta(item.source).short,
              monoLabel: item.id,
            }))}
            onSelect={key => {
              const item = pool.items[Number(key)]
              if (item) openTarget(item.source, item.id)
            }}
          />
        </>
      )}

      {/* .sc-hint（index.html L427 原句逐字，QA D57） */}
      <Text style={[styles.hint, { color: theme.colors.text3 }]}>
        {NEW_UI_SHEET_PL_ID.hint}
      </Text>
    </>
  )
}

PlIdSheetBody.displayName = 'NewUIPlIdSheetBody'

const styles = StyleSheet.create({
  /** .op-box 与副题的间距（同 NameSheet 做法，OP_BOX.marginTop 16） */
  opRow: {
    marginTop: OP_BOX.marginTop,
  },
  /** .op-err：margin-top 10 / 11.5 / 行高 1.65 / err 色（styles.css L773） */
  opErr: {
    marginTop: OP_BOX.errMarginTop,
    fontSize: FONT_SIZE.captionLg,
    lineHeight: OP_BOX.errLineHeight,
  },
  /** .sc-hint：11 / text-3 / 行高 1.6（与 NameSheet hint 同规格） */
  hint: {
    marginTop: OPTION_ROW.labelMarginBottom,
    fontSize: FONT_SIZE.caption,
    lineHeight: 18,
  },
})
