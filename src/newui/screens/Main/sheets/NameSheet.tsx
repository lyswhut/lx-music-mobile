import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { BrandAvatar, ChipFlow, GroupLabel, OpFileButton, OpInputRow, Sheet } from '@/newui/components'
import {
  NEW_UI_NICK_PICKS,
  NEW_UI_SHEET_NAME,
} from '@/newui/const'
import { nickNameInitial, sanitizeNick, useAvatarPick, useNickName } from '@/newui/hooks'
import {
  AVATAR_ROW,
  FONT_SIZE,
  FONT_WEIGHT,
  LETTER_SPACING,
  OP_BOX,
  OPTION_ROW,
  useTheme,
} from '@/newui/theme'
import { showNewUiToast } from '@/newui/utils'

export interface NameSheetProps {
  visible: boolean
  onClose: () => void
  /** 底部安全区（透传给 Sheet） */
  bottomInset?: number
}

/**
 * 「修改」浮层（原型 #nameSheet，index.html L583-606；逻辑 paintAvatar / applyAvatarFile /
 * resetAvatar / openNameSheet / saveNick，app.js L1235-1353）。这一层管两件事：昵称 + 头像。
 *
 * 结构照件（parts/sheets/name-sheet.html）：标题 / 副题 → 头像一行 `.av-box`
 * （64 圆预览 + 右列两枚 `.op-file`：选一张本机图片 / 改回昵称首字）→ `.op-box` 保存行 →
 * `.op-err` → 「换个快的」chips → 底部说明。
 *
 * 头像这条链路的三个位点同源（原型 paintAvatar 一次刷三处的等价物）：浮层预览、顶栏圆、
 * 我的页头部，全都读 useNickName 的同一份模块级缓存（含 AsyncStorage 键 newui.avatarUri）；
 * 选图与改回都是**即时生效**，不跟「保存」绑（与原型 applyAvatarFile / resetAvatar 一致）。
 * 选图 / 改回的动作链（系统选择器 → 私有目录 → 删旧文件 → toast）全在 hooks/useAvatarPick，
 * 本组件只负责渲染与人话。
 *
 * 与原型的两处已知偏差（详见 const/nameSheet.ts 与 hooks/useAvatarPick.ts 头注）：
 * 1. 不压缩图片，改成「超过 2MB 直接拒收」（原型自动压到 ≤300KB）；
 * 2. 头像存本机文件路径，不存 base64 dataURL。
 */
export const NameSheet = ({ visible, onClose, bottomInset }: NameSheetProps) => {
  const theme = useTheme()
  const { nickName, initial, avatarUri, setNickName } = useNickName()
  const { picking, pickAvatar, resetAvatar } = useAvatarPick()
  const [draft, setDraft] = useState(nickName)
  const [err, setErr] = useState('')

  // 每次打开回填当前昵称、清掉上次报错（原型 openNameSheet app.js L1319-1321 打开即重置输入）
  useEffect(() => {
    if (visible) {
      setDraft(nickName)
      setErr('')
    }
  }, [visible, nickName])

  // 原型 saveNick（app.js L1335-1354）：清洗 → 空报错 → 与当前同名只关层 → 保存 + 关层 + toast
  const handleSave = useCallback((raw: string) => {
    const next = sanitizeNick(raw)
    if (!next) {
      setErr(NEW_UI_SHEET_NAME.errEmpty)
      return
    }
    if (next === nickName) {
      onClose()
      return
    }
    setNickName(next)
    setErr('')
    onClose()
    /**
     * 头像已经是图片时，改昵称不该把图换掉，所以那句「头像取首字」只在回落态里说
     * （原型 app.js L1349-1353 同一条判据：state.avatar ? 只说昵称 : 补首字）。
     */
    showNewUiToast(
      avatarUri != null
        ? NEW_UI_SHEET_NAME.saved(next)
        : NEW_UI_SHEET_NAME.savedWithInitial(next, nickNameInitial(next)),
    )
  }, [avatarUri, nickName, onClose, setNickName])

  return (
    <Sheet
      visible={visible}
      title={NEW_UI_SHEET_NAME.title}
      subtitle={NEW_UI_SHEET_NAME.sub}
      onClose={onClose}
      bottomInset={bottomInset}
    >
      {/* 头像一行（件 parts/sheets/name-sheet.html L589-594；styles.css L1089-1097）：
          左 64 圆预览走共通件 BrandAvatar（与顶栏 / 我的页同一份渐变或同一张图），
          右列两枚 .op-file 次级钮（op-box 族共通件，icon 按件用 #i-plus / #i-user）。
          `.av-acts .op-file{margin-top:0}`（L1097）在 RN 侧就是列内不给上边距、只用 gap 8 排。 */}
      <View style={styles.avBox}>
        <BrandAvatar
          size={AVATAR_ROW.previewSize}
          textSize={AVATAR_ROW.previewFontSize}
          text={initial}
          imageUri={avatarUri}
          textStyle={styles.avPreviewText}
        />
        <View style={styles.avActs}>
          <OpFileButton
            icon="plus"
            label={NEW_UI_SHEET_NAME.avatarPick}
            busy={picking}
            onPress={() => { void pickAvatar() }}
          />
          <OpFileButton
            icon="user"
            label={NEW_UI_SHEET_NAME.avatarReset}
            onPress={() => { void resetAvatar() }}
          />
        </View>
      </View>

      {/* 打开即聚焦输入框（原型 openNameSheet app.js L1323：回填 + 清报错 + focus；Sheet 仅在可见时挂载内容，autoFocus 时机等价）。
          浮层滚动容器 keyboardShouldPersistTaps='handled' 由通用 Sheet 提供，不自造避让层。 */}
      <OpInputRow
        value={draft}
        onChangeText={text => {
          setDraft(text)
          if (err.length > 0) setErr('')
        }}
        placeholder={NEW_UI_SHEET_NAME.placeholder}
        goLabel={NEW_UI_SHEET_NAME.go}
        maxLength={12}
        autoFocus
        autoCapitalize="none"
        onGo={() => { handleSave(draft) }}
        onSubmitEditing={() => { handleSave(draft) }}
        style={styles.opRow}
      />
      {/* .op-err（index.html L601；样式同 styles.css L773，与 SourceSheet 错误行同规格） */}
      {err.length > 0 && (
        <Text style={[styles.opErr, { color: theme.colors.dangerInk }]}>{err}</Text>
      )}

      {/* 「换个快的」chips（index.html L602-603；原型 app.js L1325-1329 点 chip 即 saveNick(n)） */}
      <GroupLabel label={NEW_UI_SHEET_NAME.groupPicks} />
      <ChipFlow
        items={NEW_UI_NICK_PICKS.map(n => ({ key: n, label: n }))}
        onSelect={n => {
          setDraft(n)
          handleSave(n)
        }}
      />
      {/* .sc-hint（index.html L604，原型 sheet 底部灰字；口径见文件头注释） */}
      <Text style={[styles.hint, { color: theme.colors.text3 }]}>
        {NEW_UI_SHEET_NAME.hint}
      </Text>
    </Sheet>
  )
}

NameSheet.displayName = 'NewUINameSheet'

const styles = StyleSheet.create({
  /** .av-box：row / 垂直居中 / gap 14 / margin-top 16（styles.css L1092） */
  avBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AVATAR_ROW.gap,
    marginTop: AVATAR_ROW.marginTop,
  },
  /** .av-preview 的首字字形：font-weight:900 / letter-spacing:.5（styles.css L1095，字号走 AVATAR_ROW.previewFontSize） */
  avPreviewText: {
    fontWeight: FONT_WEIGHT.black,
    letterSpacing: LETTER_SPACING.wider,
  },
  /** .av-acts：flex 1 / min-width 0 / 两枚次级钮上下叠，gap 8（L1096） */
  avActs: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    gap: AVATAR_ROW.actsGap,
  },
  /** .op-box 与头像一行的间距（原型组内容间距同 OP_BOX.marginTop 16） */
  opRow: {
    marginTop: OP_BOX.marginTop,
  },
  /** .op-err：margin-top 10 / 11.5 / 行高 1.65（styles.css L773） */
  opErr: {
    marginTop: OP_BOX.errMarginTop,
    fontSize: FONT_SIZE.captionLg,
    lineHeight: OP_BOX.errLineHeight,
  },
  /** .sc-hint：11 / text-3 / 行高 1.6（原型 sheet 底部说明，与 SourceSheet .q-note 同规格） */
  hint: {
    marginTop: OPTION_ROW.labelMarginBottom,
    fontSize: FONT_SIZE.caption,
    lineHeight: 18,
  },
})
