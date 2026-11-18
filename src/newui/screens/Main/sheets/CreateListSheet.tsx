import { useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet, Text } from 'react-native'

import { createList } from '@/core/list'
import listState from '@/store/list/state'

import { ConfirmSheet, OpInputRow, Sheet } from '@/newui/components'
import {
  NEW_UI_CREATE_LIST_NAME_MAX,
  NEW_UI_SHEET_CREATE_LIST,
} from '@/newui/const'
import { FONT_SIZE, OP_BOX, OPTION_ROW, useTheme } from '@/newui/theme'
import { showNewUiToast } from '@/newui/utils'

export interface CreateListSheetProps {
  visible: boolean
  onClose: () => void
  /** 底部安全区（透传给 Sheet） */
  bottomInset?: number
}

/**
 * 新建歌单浮层（2026-10-13 bug-fix「我的」7a：入口在我的页「我的歌单」区块右上角）。
 * 原型对应层是 #createSheet（index.html L431-445），建单只写内存里的 MY_PLAYLISTS
 * （app.js L1269 自述「原型旧版没有建单流程（MY_PLAYLISTS 是写死的 4 张）」），真实侧落 core/list；
 * 骨架整体照抄 NameSheet / PlIdSheet：通用 Sheet + OpInputRow（.op-box/.op-input/.op-go）
 * + .op-err 错误行 + .sc-hint 灰字，不另起一套输入层。
 * 校验链逐条照抄旧屏 ListNameEdit.handleRename（L95-111）：
 * trim → 空名不创建 → 超 100 字截断 → 同名先过确认浮层问一句、取消则留在浮层可改名再建
 * （旧屏同名规则本来就允许强行同名，如实保留；确认载体 2026-10-14 QA D-09 从系统
 * Alert.alert 换回原型 #confirmSheet 同族的共通件 ConfirmSheet，盖在本浮层之上）→
 * createList（@/core/list，落库 + 事件链与旧屏同一套）。
 * 建完 mylistUpdated 事件让「我的歌单」与歌单页横排即时多出这张新卡（useMyPlaylists 已订阅），
 * 点卡走既有的 pushNewUiLocalListDetail（kind='local'），空单进去由详情屏既有空态承担。
 */
export const CreateListSheet = ({ visible, onClose, bottomInset }: CreateListSheetProps) => {
  const theme = useTheme()
  const [draft, setDraft] = useState('')
  const [err, setErr] = useState('')
  // 落库是异步事件链（list_create → 持久化 → store 更新），期间锁住按钮防连点建出两份；
  // busy 只反映在下一帧渲染上，同帧双击挡不住，再加同步 ref 闸门兜底
  const [busy, setBusy] = useState(false)
  const creatingRef = useRef(false)
  // 同名确认：非 null 即待确认的名字（QA D-09：确认浮层盖在建单浮层之上，取消留在建单层改名再建）
  const [dupName, setDupName] = useState<string | null>(null)

  // 每次打开清空上一轮输入与报错（与 NameSheet 打开即回填的口径对应：建单没有「当前值」，回空串）
  useEffect(() => {
    if (visible) {
      setDraft('')
      setErr('')
      setBusy(false)
      setDupName(null)
      creatingRef.current = false
    }
  }, [visible])

  /** 真正落库那一步（同名分支确认后 / 无同名分支直达），异步闸口径与旧屏一致 */
  const doCreate = useCallback(async (name: string) => {
    if (creatingRef.current) return
    creatingRef.current = true
    setBusy(true)
    try {
      // 既有创建函数（core/list.ts L127）：生成 userlist_ 时间戳 id、追加到末尾、空曲入库
      await createList({ name })
    } finally {
      creatingRef.current = false
      setBusy(false)
    }
    setErr('')
    setDupName(null)
    onClose()
    showNewUiToast(NEW_UI_SHEET_CREATE_LIST.created(name))
  }, [onClose])

  const handleCreate = useCallback(async () => {
    if (creatingRef.current || busy) return
    // 旧屏 L96-98：trim 后空名不创建；>100 字截断（不做 maxLength 硬截输入，照旧屏提交时截断）
    let name = draft.trim()
    if (!name) {
      setErr(NEW_UI_SHEET_CREATE_LIST.errEmpty)
      return
    }
    if (name.length > NEW_UI_CREATE_LIST_NAME_MAX) name = name.slice(0, NEW_UI_CREATE_LIST_NAME_MAX)
    // 旧屏 L102-105：与既有自建歌单同名 → 问一句要不要继续（只查 userList，
    // 「我的收藏 / 我喜欢」两张系统卡不占名，与旧屏口径一致）
    if (listState.userList.some(list => list.name === name)) {
      setDupName(name)
      return
    }
    await doCreate(name)
  }, [draft, doCreate, busy])

  const submit = useCallback(() => {
    // busy 期间不重复入链（OpInputRow 自身也吃 busy disable，这里防 onSubmitEditing 旁路）
    if (busy || creatingRef.current) return
    void handleCreate()
  }, [busy, handleCreate])

  return (
    <>
      <Sheet
        visible={visible}
        title={NEW_UI_SHEET_CREATE_LIST.title}
        subtitle={NEW_UI_SHEET_CREATE_LIST.sub}
        onClose={onClose}
        bottomInset={bottomInset}
      >
        {/* 打开即聚焦输入框（NameSheet / PlIdSheet 同款；Sheet 仅在可见时挂载内容） */}
        <OpInputRow
          value={draft}
          onChangeText={text => {
            setDraft(text)
            if (err.length > 0) setErr('')
          }}
          placeholder={NEW_UI_SHEET_CREATE_LIST.placeholder}
          goLabel={NEW_UI_SHEET_CREATE_LIST.go}
          busy={busy}
          busyLabel={NEW_UI_SHEET_CREATE_LIST.busy}
          autoFocus
          autoCapitalize="none"
          onGo={submit}
          onSubmitEditing={submit}
          style={styles.opRow}
        />
        {/* .op-err（与 NameSheet / PlIdSheet 错误行同规格，styles.css L773） */}
        {err.length > 0 && (
          <Text style={[styles.opErr, { color: theme.colors.dangerInk }]}>{err}</Text>
        )}
        {/* .sc-hint（浮层底部灰字，如实说法：只在本机） */}
        <Text style={[styles.hint, { color: theme.colors.text3 }]}>
          {NEW_UI_SHEET_CREATE_LIST.hint}
        </Text>
      </Sheet>
      {/* 同名确认（原型 app.js L1243 askConfirm → #confirmSheet；QA D-09 换掉系统 Alert）。
          与建单浮层同屏叠放：本层挂载在后，Android 返回键先收本层、再收建单层（BackHandler 后订先响） */}
      <ConfirmSheet
        visible={visible && dupName != null}
        title={NEW_UI_SHEET_CREATE_LIST.dupTitle}
        body={NEW_UI_SHEET_CREATE_LIST.dupConfirm}
        okLabel={NEW_UI_SHEET_CREATE_LIST.dupOk}
        onConfirm={() => {
          if (dupName == null) return
          void doCreate(dupName)
        }}
        onClose={() => setDupName(null)}
        bottomInset={bottomInset}
      />
    </>
  )
}

CreateListSheet.displayName = 'NewUICreateListSheet'

const styles = StyleSheet.create({
  /** .op-box 与副题的间距（同 NameSheet 做法，OP_BOX.marginTop 16） */
  opRow: {
    marginTop: OP_BOX.marginTop,
  },
  /** .op-err：margin-top 10 / 11.5 / 行高 1.65（styles.css L773） */
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
