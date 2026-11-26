import { useCallback, useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { setApiSource } from '@/core/apiSource'
import { updateSetting } from '@/core/common'
import { pause } from '@/core/player/player'
import { removeUserApi } from '@/core/userApi'
import { handleImportScript } from '@/screens/Home/Views/Setting/settings/Basic/UserApiEditModal/action'
import playerState from '@/store/player/state'
import { useSettingValue } from '@/store/setting/hook'
import { state as userApiState, useStatus, useUserApiList } from '@/store/userApi'
import { readFile, selectFile, unlink } from '@/utils/fs'
import { log } from '@/utils/log'
import apiSourceInfo from '@/utils/musicSdk/api-source-info'
import { httpFetch } from '@/utils/request'
import { assertApiSupport, TEMP_FILE_PATH } from '@/utils/tools'

import {
  ChipFlow,
  ConfirmSheet,
  EmptyTip,
  FoldMore,
  FoldToggle,
  GroupLabel,
  OpFileButton,
  OpInputRow,
  OptionRow,
  Sheet,
} from '@/newui/components'
import {
  NEW_UI_SHEET_SOURCE,
  NEW_UI_SOURCE_FILE_EXTS,
  NEW_UI_SOURCE_FOLD_LIMIT,
  NEW_UI_SOURCE_INIT_TIMEOUT_MS,
  NEW_UI_SOURCE_MAX,
  NEW_UI_SOURCE_STATE_RANK,
  PLAY_QUALITY_CHOICES,
  PLATFORM_META,
  PLATFORM_SOURCE_KEYS,
  QUALITY_ORDER,
  formatApiVersion,
  formatQualityList,
  type NewUiSourceStateKey,
} from '@/newui/const'
import { useApiSourceName, useApiSourceTick, useContentPlatform } from '@/newui/hooks'
import {
  FONT_SIZE,
  FONT_WEIGHT,
  OP_BOX,
  OP_FILE,
  OPTION_ROW,
  useTheme,
} from '@/newui/theme'
import { getQualityFallback, isQualitySupported, setContentPlatformSource, showNewUiToast, withTimeout } from '@/newui/utils'

export interface SourceSheetProps {
  visible: boolean
  onClose: () => void
  /** 底部安全区（透传给 Sheet） */
  bottomInset?: number
}

/** 当前生效音源覆盖的平台 → 档位表（读 global.lx.qualityList） */
const readCovered = (): Partial<Record<LX.OnlineSource, LX.Quality[]>> => {
  const list = global.lx.qualityList ?? {}
  const covered: Partial<Record<LX.OnlineSource, LX.Quality[]>> = {}
  for (const key of PLATFORM_SOURCE_KEYS) {
    const qualitys = (list as Record<string, LX.Quality[] | undefined>)[key]
    if (qualitys?.length) covered[key] = qualitys
  }
  return covered
}

/**
 * 音源设置浮层：已安装音源列表（切源 = setApiSource）/ 内容平台选择 / 音质 / 导入（URL 或本机文件）。
 * 平台覆盖与档位读 global.lx.qualityList；音质列整档表，不支持的档降显但可点说明，
 * 实际降档交给播放核心 getPlayQuality，切源不替用户改音质 / 内容平台。
 */

/** 一行已安装音源在屏上要说的三样（标签 / 档位 / 说明），派生一次即供排序与渲染共用 */
interface SourceRow {
  item: LX.UserApi.UserApiInfo
  isActive: boolean
  stateKey: NewUiSourceStateKey
  /** 导入先后（稳定排序的兜底键，同档不重排） */
  order: number
  stateLabel: string
  em: string
}

/** 四档状态标签 */
const SOURCE_STATE_LABEL: Record<NewUiSourceStateKey, string> = {
  ready: NEW_UI_SHEET_SOURCE.stateReady,
  initing: NEW_UI_SHEET_SOURCE.stateIniting,
  failed: NEW_UI_SHEET_SOURCE.stateFailed,
  uninit: NEW_UI_SHEET_SOURCE.stateIdle,
}

/** 四档状态取色 */
const SOURCE_STATE_TONE: Record<NewUiSourceStateKey, 'ok' | 'brand3' | 'dangerInk' | 'text3'> = {
  ready: 'ok',
  initing: 'brand3',
  failed: 'dangerInk',
  uninit: 'text3',
}
export const SourceSheet = ({ visible, onClose, bottomInset }: SourceSheetProps) => {
  const theme = useTheme()
  const apiSource = useSettingValue('common.apiSource')
  const playQuality = useSettingValue('player.playQuality')
  const userApiList = useUserApiList()
  // 生效中音源的加载状态（initing → true/false）
  const apiStatus = useStatus()
  const currentName = useApiSourceName()
  // 当前内容平台（本浮层是它的唯一选择入口）
  const platform = useContentPlatform()
  // 订阅 apiSourceUpdated：启动加载完成 / 用户切源 → 覆盖表与档位整层重算
  const tick = useApiSourceTick()

  const covered = useMemo(() => readCovered(), [tick]) // eslint-disable-line react-hooks/exhaustive-deps

  // 当前音源真实支持的档位 = 覆盖平台档位并集，按 QUALITY_ORDER 从低到高
  const supportedQualities = useMemo(() => {
    const set = new Set<LX.Quality>()
    for (const key of PLATFORM_SOURCE_KEYS) {
      for (const q of covered[key] ?? []) set.add(q)
    }
    return QUALITY_ORDER.filter(q => set.has(q))
  }, [covered])
  const supportedQualitySet = useMemo(() => new Set(supportedQualities), [supportedQualities])

  /**
   * 「已安装音源」行模型 + 就绪置顶：只有当前生效那份有真实状态，
   * 其余一律「未启用」；同档保持导入先后（order 兜底，不依赖 sort 稳定性）。
   */
  const scriptRows = useMemo(() => {
    const coveredCount = PLATFORM_SOURCE_KEYS.filter(k => covered[k] != null).length
    const rows: SourceRow[] = userApiList.map((item, index) => {
      const isActive = item.id === apiSource
      const stateKey: NewUiSourceStateKey = isActive
        ? (apiStatus.status ? 'ready' : apiStatus.message === 'initing' ? 'initing' : 'failed')
        : 'uninit'
      // em：生效中的读运行时覆盖表「能播 N 个平台 · 音质列表」；未生效的给脚本自带描述
      const em = isActive
        ? coveredCount > 0
          ? [
            NEW_UI_SHEET_SOURCE.platformCount(coveredCount),
            formatQualityList(supportedQualities),
          ].filter(part => part.length > 0).join(' · ')
          : ''
        : item.description
      return {
        item,
        isActive,
        stateKey,
        order: index,
        stateLabel: SOURCE_STATE_LABEL[stateKey],
        em,
      }
    })
    return rows.sort((a, b) =>
      NEW_UI_SOURCE_STATE_RANK[a.stateKey] - NEW_UI_SOURCE_STATE_RANK[b.stateKey] || a.order - b.order)
  }, [apiSource, apiStatus, covered, supportedQualities, userApiList])

  /* ---- 折叠 ---- */
  // null = 用户没动过开关，默认态按条数定（>4 折）；折叠态只是排版，不写本机存储
  const [foldOverride, setFoldOverride] = useState<boolean | null>(null)
  const foldable = scriptRows.length > NEW_UI_SOURCE_FOLD_LIMIT
  // 只剩一份时没得折
  const folded = scriptRows.length > 1 && (foldOverride ?? foldable)
  // 开关露面：越过阈值或用户亲手折过，且至少还有两份
  const showFoldToggle = scriptRows.length > 1 && (foldable || foldOverride !== null)
  // 收起态只露在用的那一份，没有就退回列表头一份
  const activeRows = scriptRows.filter(row => row.isActive)
  const visibleRows = folded ? (activeRows.length > 0 ? activeRows : scriptRows.slice(0, 1)) : scriptRows
  // 按实际显示的行算隐藏数，回落头一份时不会多报一条
  const hiddenRows = scriptRows.filter(row => !visibleRows.includes(row))
  const hiddenReadyCount = hiddenRows.filter(row => row.stateKey === 'ready').length

  /**
   * 切源反馈：新音源能力表要等脚本初始化完才写入 global.lx.qualityList，
   * 故借 apiInitPromise 等到能力落定再发一次 toast；超时只报主句，不猜「不可播」也不暂停。
   */
  const announceSwitch = useCallback(async (name: string, version: string) => {
    let msg = NEW_UI_SHEET_SOURCE.switched(name, version)
    try {
      await withTimeout(global.lx.apiInitPromise[0], NEW_UI_SOURCE_INIT_TIMEOUT_MS)
    } catch {
      // 到限没 settle：覆盖表还是上一源的，判不了新源，只报主句
      showNewUiToast(msg)
      return
    }
    const tables = readCovered()
    const playing = playerState.playMusicInfo.musicInfo
    // 播放条目可能是下载项（无 source 字段），取不到平台就不下结论
    const playingSource = playing != null && 'source' in playing ? playing.source : null
    if (Object.keys(tables).length > 0 && playingSource != null && !assertApiSupport(playingSource)) {
      void pause()
      msg += NEW_UI_SHEET_SOURCE.switchedUnplayable
    }
    showNewUiToast(msg)
  }, [])

  const handlePickScript = useCallback((item: LX.UserApi.UserApiInfo) => {
    if (item.id === apiSource) return
    setApiSource(item.id)
    void announceSwitch(item.name, item.version)
  }, [announceSwitch, apiSource])

  /* ---- 行尾移除 ---- */
  // 待移除的那一份：非 null 即拉开 ConfirmSheet
  const [removeTarget, setRemoveTarget] = useState<LX.UserApi.UserApiInfo | null>(null)

  /**
   * 真删：只调既有 removeUserApi；删的是当前生效那份时，
   * 照旧设置页的做法回落（内置表第一份 → 列表头一份 → setApiSource）。
   * 新源此刻还没初始化完，「不可播」那半句留给 announceSwitch 判。
   */
  const doRemove = useCallback(async(item: LX.UserApi.UserApiInfo) => {
    const wasActive = item.id === apiSource
    await removeUserApi([item.id])
    let msg = NEW_UI_SHEET_SOURCE.removed(item.name)
    if (wasActive) {
      // removeUserApi 已把剩余列表写回 store
      const rest = userApiState.list
      const backId = apiSourceInfo.find(api => !api.disabled)?.id ?? rest[0]?.id
      setApiSource(backId ?? '')
      const next = backId == null ? null : rest.find(api => api.id === backId)
      msg += next != null
        ? NEW_UI_SHEET_SOURCE.removedSwitched(next.name)
        : NEW_UI_SHEET_SOURCE.removedEmpty
    }
    showNewUiToast(msg)
  }, [apiSource])

  const handlePickPlatform = useCallback((key: LX.OnlineSource) => {
    // 再点当前平台不重复写，挡在 toast 之前
    if (key === platform.source) return
    const label = PLATFORM_META[key].label
    setContentPlatformSource(key)
    // 目录与音源无关：未覆盖平台照样能选，只在 toast 补一句提醒
    showNewUiToast(covered[key] != null
      ? NEW_UI_SHEET_SOURCE.platformSwitched(label)
      : NEW_UI_SHEET_SOURCE.platformSwitched(label) + NEW_UI_SHEET_SOURCE.platformSwitchedUncovered)
  }, [covered, platform.source])

  // 音质写入口收口：只写「当前音源声明有的档」；点不支持的档不写，只给说明，
  // 实际降档由播放核心 getPlayQuality 完成
  const handlePickQuality = useCallback((key: string) => {
    const q = key as LX.Quality
    if (isQualitySupported(supportedQualities, q)) {
      updateSetting({ 'player.playQuality': q })
      return
    }
    showNewUiToast(NEW_UI_SHEET_SOURCE.qualityPickUnsupported(
      currentName, q, getQualityFallback(q, supportedQualities),
    ))
  }, [currentName, supportedQualities])

  // 整档表（高→低）：不支持的档降显但可点，点击给说明，不留死按钮
  const qualityChips = useMemo(() => PLAY_QUALITY_CHOICES.map(q => {
    const ok = supportedQualitySet.has(q)
    return {
      key: q,
      label: NEW_UI_SHEET_SOURCE.qualityChip(q),
      active: ok && q === playQuality,
      disabled: !ok,
    }
  }), [playQuality, supportedQualitySet])

  // 已存的选择落在不支持档（切音源后的常见残留）：如实说明播放时降到哪
  const savedQualityDowngraded = supportedQualities.length > 0 && !supportedQualitySet.has(playQuality)

  // 出现置灰档时常驻一句解释
  const hasDimQuality = supportedQualities.length > 0 &&
    PLAY_QUALITY_CHOICES.some(q => !supportedQualitySet.has(q))

  /* ---- 导入行：URL 抓取与本机文件两条路，共用 importing 闸与收尾 handleImportScript ---- */
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importErr, setImportErr] = useState('')

  /** 两条路共用的两道闸：一次只让一份在飞 + 份数硬上限 */
  const passImportGate = useCallback((): boolean => {
    if (importing) return false
    if (userApiList.length >= NEW_UI_SOURCE_MAX) {
      setImportErr(NEW_UI_SHEET_SOURCE.importErrMax(NEW_UI_SOURCE_MAX))
      return false
    }
    setImportErr('')
    return true
  }, [importing, userApiList.length])

  /** 导入成功后顺手把列表摊开，让新来的那份可见 */
  const handleImportPress = useCallback(async () => {
    if (!passImportGate()) return
    const url = importUrl.trim()
    if (!/^https?:\/\//.test(url)) {
      setImportErr(NEW_UI_SHEET_SOURCE.importErrNotUrl)
      return
    }
    setImportErr('')
    setImporting(true)
    try {
      const script = await httpFetch(url).promise.then(resp => resp.body) as string
      // 体积上限 9MB，防抓到整页 HTML
      if (script.length > 9_000_000) {
        setImportErr(NEW_UI_SHEET_SOURCE.importErrTooLarge)
        return
      }
      // 成败 toast 由 handleImportScript 内部包办；列表经 list_changed 自动刷新
      await handleImportScript(script)
      setImportUrl('')
      setFoldOverride(false)
    } catch (err: any) {
      setImportErr(NEW_UI_SHEET_SOURCE.importErrFetch(err.message ?? String(err)))
    } finally {
      setImporting(false)
    }
  }, [importUrl, passImportGate])

  /**
   * 本机导入：只走 SAF 一条路 —— selectFile → readFile → handleImportScript，
   * 另一条内置选择器回退路在新 UI 下不接；失败只给人话，不问回退。
   */
  const handlePickLocalFile = useCallback(async () => {
    if (!passImportGate()) return
    let path: string | undefined
    try {
      const file = await selectFile({ extTypes: NEW_UI_SOURCE_FILE_EXTS, toPath: TEMP_FILE_PATH })
      path = file?.data
    } catch (err: any) {
      log.warn('select user api file failed: ' + String(err?.message ?? err))
      setImportErr(NEW_UI_SHEET_SOURCE.importErrNoPicker)
      return
    }
    // 用户没挑就算取消，不报错
    if (path == null) return
    // 类型复核：不合类型的不导入，临时副本也清掉
    if (!NEW_UI_SOURCE_FILE_EXTS.some(ext => path.toLowerCase().endsWith('.' + ext))) {
      void unlink(path)
      setImportErr(NEW_UI_SHEET_SOURCE.importErrBadFile)
      return
    }
    // 从读取这一刻起才算「有一份在飞」
    setImporting(true)
    try {
      const script = await readFile(path)
      if (script == null || script.length === 0) throw new Error('Read file failed')
      await handleImportScript(script)
      setFoldOverride(false)
    } catch (err: any) {
      log.error('read user api file failed: ' + String(err?.message ?? err))
      // 读不出内容按「不是音源」处理，不报路径
      setImportErr(NEW_UI_SHEET_SOURCE.importErrBadFile)
    } finally {
      setImporting(false)
    }
  }, [passImportGate])

  return (
    <>
      <Sheet
        visible={visible}
        title={NEW_UI_SHEET_SOURCE.title}
        subtitle={NEW_UI_SHEET_SOURCE.sub}
        onClose={onClose}
        bottomInset={bottomInset}
      >
        {/* 「已安装音源」组：右槽折叠开关，条数没过阈值又没手动折过时不露面 */}
        <GroupLabel
          label={NEW_UI_SHEET_SOURCE.groupScripts}
          trailing={
            <FoldToggle
              hidden={!showFoldToggle}
              expanded={!folded}
              label={folded
                ? NEW_UI_SHEET_SOURCE.foldExpandAll(scriptRows.length)
                : NEW_UI_SHEET_SOURCE.foldCollapse}
              onPress={() => setFoldOverride(!folded)}
            />
          }
        />
        <View style={styles.list}>
          {scriptRows.length === 0 && <EmptyTip text={NEW_UI_SHEET_SOURCE.scriptsEmptyHint} />}
          {visibleRows.map(({ item, isActive, stateKey, stateLabel, em }) => (
            <OptionRow
              key={item.id}
              name={item.name}
              version={item.version.length > 0 ? formatApiVersion(item.version) : undefined}
              sub={em}
              stateLabel={stateLabel}
              stateTone={theme.colors[SOURCE_STATE_TONE[stateKey]]}
              active={isActive}
              onPress={() => handlePickScript(item)}
              // 移除钮只在这份音源列表出现，平台 / 音质两组不传
              onRemove={() => setRemoveTarget(item)}
              removeAriaLabel={NEW_UI_SHEET_SOURCE.removeAria(item.name)}
            />
          ))}
          {/* 尾行本身可点，与标题行折叠开关同一件事 */}
          {folded && hiddenRows.length > 0 && (
            <FoldMore
              text={NEW_UI_SHEET_SOURCE.foldMore(hiddenRows.length, hiddenReadyCount)}
              onPress={() => setFoldOverride(false)}
            />
          )}
        </View>

        {/* 「音乐平台」组 = 内容平台选择器：选中项决定首页 / 歌单页跟随的平台；
            dim 只说明当前音源播不出，不妨碍选 */}
        <GroupLabel label={NEW_UI_SHEET_SOURCE.groupPlatforms} />
        <View style={styles.list}>
          {PLATFORM_SOURCE_KEYS.map(key => {
            const meta = PLATFORM_META[key]
            const ok = covered[key] != null
            const isCurrent = platform.ready && key === platform.source
            return (
              <OptionRow
                key={key}
                name={meta.label}
                sub={ok
                  ? undefined
                  : NEW_UI_SHEET_SOURCE.platformUncovered(currentName, meta.label)}
                stateLabel={isCurrent
                  ? NEW_UI_SHEET_SOURCE.platformActiveTag
                  : (ok ? undefined : NEW_UI_SHEET_SOURCE.unplayableTag)}
                stateTone={isCurrent ? theme.colors.ok : theme.colors.text3}
                active={isCurrent}
                dimmed={!ok && !isCurrent}
                onPress={() => handlePickPlatform(key)}
              />
            )
          })}
        </View>

        {/* 「音质」组：列整档表（高→低），不支持的档降显可点，标签保持纯音质标识 */}
        <GroupLabel label={NEW_UI_SHEET_SOURCE.groupQuality} />
        {supportedQualities.length > 0 ? (
          <>
            <ChipFlow items={qualityChips} onSelect={handlePickQuality} />
            {hasDimQuality && (
              <Text style={[styles.note, { color: theme.colors.text3 }]}>
                {NEW_UI_SHEET_SOURCE.qualityDimNote}
              </Text>
            )}
            {savedQualityDowngraded && (
              <Text style={[styles.note, { color: theme.colors.text3 }]}>
                {NEW_UI_SHEET_SOURCE.qualitySavedDowngradeNote(
                  playQuality, getQualityFallback(playQuality, supportedQualities),
                )}
              </Text>
            )}
            {supportedQualities.length === 1 && (
              <Text style={[styles.note, { color: theme.colors.text3 }]}>
                {NEW_UI_SHEET_SOURCE.qualitySingleNote(currentName, supportedQualities[0])}
              </Text>
            )}
          </>
        ) : (
          <Text style={[styles.note, { color: theme.colors.text3 }]}>
            {NEW_UI_SHEET_SOURCE.qualityEmptyHint}
          </Text>
        )}

        {/* 「导入音源」组：URL 输入行 → 本机文件按钮 → 错误行 → 进行中提示 → 说明 */}
        <GroupLabel label={NEW_UI_SHEET_SOURCE.groupImport} />
        <OpInputRow
          value={importUrl}
          onChangeText={text => {
            setImportUrl(text)
            if (importErr.length > 0) setImportErr('')
          }}
          placeholder={NEW_UI_SHEET_SOURCE.importPlaceholder}
          goLabel={NEW_UI_SHEET_SOURCE.importGo}
          busyLabel={NEW_UI_SHEET_SOURCE.importGoBusy}
          busy={importing}
          keyboardType="url"
          onGo={() => { void handleImportPress() }}
        />
        {/* 本机文件按钮：按下走系统选取器 */}
        <OpFileButton
          label={importing ? NEW_UI_SHEET_SOURCE.importFileBusy : NEW_UI_SHEET_SOURCE.importFile}
          busy={importing}
          onPress={() => { void handlePickLocalFile() }}
          style={styles.opFile}
        />
        {importErr.length > 0 && (
          <Text style={[styles.opErr, { color: theme.colors.dangerInk }]}>{importErr}</Text>
        )}
        {/* 进行中提示：只在导入时露面 */}
        {importing && (
          <Text style={[styles.note, { color: theme.colors.text3 }]}>
            {NEW_UI_SHEET_SOURCE.importHint}
          </Text>
        )}
        {/* 常驻说明：两条路的差别与「已就绪」的时机 */}
        <Text style={[styles.scHint, { color: theme.colors.text3 }]}>
          {NEW_UI_SHEET_SOURCE.importHintTwoPaths}
        </Text>
      </Sheet>
      {/* 移除二次确认：与音源浮层同屏叠放、挂载在后，Android 返回键先收本层 */}
      <ConfirmSheet
        visible={visible && removeTarget != null}
        title={removeTarget != null ? NEW_UI_SHEET_SOURCE.removeTitle(removeTarget.name) : undefined}
        okLabel={NEW_UI_SHEET_SOURCE.removeOk}
        body={removeTarget != null
          ? NEW_UI_SHEET_SOURCE.removeBody +
            (removeTarget.id === apiSource ? NEW_UI_SHEET_SOURCE.removeBodyActive : '')
          : NEW_UI_SHEET_SOURCE.removeBody}
        onConfirm={() => {
          if (removeTarget != null) void doRemove(removeTarget)
        }}
        onClose={() => setRemoveTarget(null)}
        bottomInset={bottomInset}
      />
    </>
  )
}

SourceSheet.displayName = 'NewUISourceSheet'

const styles = StyleSheet.create({
  /** 音源 / 平台列表容器 */
  list: {
    flexDirection: 'column',
    gap: OPTION_ROW.listGap,
  },
  /** 错误行 */
  opErr: {
    marginTop: OP_BOX.errMarginTop,
    fontSize: FONT_SIZE.captionLg,
    lineHeight: OP_BOX.errLineHeight,
    fontWeight: FONT_WEIGHT.semibold,
  },
  /** 说明句 */
  note: {
    marginTop: OP_BOX.errMarginTop,
    fontSize: FONT_SIZE.caption,
    lineHeight: 18,
  },
  /** 本机文件按钮上间距 */
  opFile: {
    marginTop: OP_FILE.marginTop,
  },
  /** 底部常驻说明 */
  scHint: {
    marginTop: OP_BOX.marginTop,
    fontSize: FONT_SIZE.caption,
    lineHeight: 19,
  },
})
