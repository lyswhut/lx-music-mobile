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
 * 新建歌单浮层，入口在我的页「我的歌单」区块右上角。
 * 骨架照抄 NameSheet（Sheet + OpInputRow + 错误行 + 灰字说明）；
 * 校验：trim → 空名不建 → 超 100 字截断 → 同名先确认再建；落库走 core/list.createList。
 */
export const CreateListSheet = ({ visible, onClose, bottomInset }: CreateListSheetProps) => {
  const theme = useTheme()
  const [draft, setDraft] = useState('')
  const [err, setErr] = useState('')
  // 落库是异步事件链，期间锁住按钮防连点；busy 同帧挡不住，再加同步 ref 闸门兜底
  const [busy, setBusy] = useState(false)
  const creatingRef = useRef(false)
  // 同名确认：非 null 即待确认的名字，确认浮层盖在建单层之上
  const [dupName, setDupName] = useState<string | null>(null)

  // 每次打开清空上一次的输入与报错
  useEffect(() => {
    if (visible) {
      setDraft('')
      setErr('')
      setBusy(false)
      setDupName(null)
      creatingRef.current = false
    }
  }, [visible])

  /** 真正落库那一步（同名确认后或无同名直达） */
  const doCreate = useCallback(async (name: string) => {
    if (creatingRef.current) return
    creatingRef.current = true
    setBusy(true)
    try {
      // core/list.createList：生成 id、追加到末尾、空曲入库
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
    // trim 后空名不创建；超 100 字在提交时截断（不做 maxLength 硬截）
    let name = draft.trim()
    if (!name) {
      setErr(NEW_UI_SHEET_CREATE_LIST.errEmpty)
      return
    }
    if (name.length > NEW_UI_CREATE_LIST_NAME_MAX) name = name.slice(0, NEW_UI_CREATE_LIST_NAME_MAX)
    // 与既有自建歌单同名 → 先问一句；只查 userList，系统卡不占名
    if (listState.userList.some(list => list.name === name)) {
      setDupName(name)
      return
    }
    await doCreate(name)
  }, [draft, doCreate, busy])

  const submit = useCallback(() => {
    // busy 期间不重复入链，防 onSubmitEditing 旁路
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
        {/* 打开即聚焦输入框 */}
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
        {/* 错误行，与 NameSheet 同规格 */}
        {err.length > 0 && (
          <Text style={[styles.opErr, { color: theme.colors.dangerInk }]}>{err}</Text>
        )}
        {/* 底部灰字：只在本机 */}
        <Text style={[styles.hint, { color: theme.colors.text3 }]}>
          {NEW_UI_SHEET_CREATE_LIST.hint}
        </Text>
      </Sheet>
      {/* 同名确认：挂载在建单层之后，Android 返回键先收本层 */}
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
  /** 输入行上间距 */
  opRow: {
    marginTop: OP_BOX.marginTop,
  },
  /** 错误行 */
  opErr: {
    marginTop: OP_BOX.errMarginTop,
    fontSize: FONT_SIZE.captionLg,
    lineHeight: OP_BOX.errLineHeight,
  },
  /** 底部说明 */
  hint: {
    marginTop: OPTION_ROW.labelMarginBottom,
    fontSize: FONT_SIZE.caption,
    lineHeight: 18,
  },
})
