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
 * 「修改」浮层：昵称 + 头像两件事。头像预览 / 顶栏圆 / 我的页头部读同一份 useNickName 缓存，
 * 选图与改回即时生效、不跟「保存」绑；选图链路在 hooks/useAvatarPick，本组件只负责渲染。
 * 两处取舍：超过 2MB 直接拒收（不压缩）；头像存本机路径而非 base64。
 */
export const NameSheet = ({ visible, onClose, bottomInset }: NameSheetProps) => {
  const theme = useTheme()
  const { nickName, initial, avatarUri, setNickName } = useNickName()
  const { picking, pickAvatar, resetAvatar } = useAvatarPick()
  const [draft, setDraft] = useState(nickName)
  const [err, setErr] = useState('')

  // 每次打开回填当前昵称、清掉上次报错
  useEffect(() => {
    if (visible) {
      setDraft(nickName)
      setErr('')
    }
  }, [visible, nickName])

  // 保存：清洗 → 空报错 → 与当前同名只关层 → 保存 + 关层 + toast
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
    /** 头像已是图片时改昵称不换图，故「头像取首字」只在回落态里说 */
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
      {/* 头像行：左 64 圆预览（BrandAvatar），右列两枚次级钮，列内只用 gap 排 */}
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

      {/* 打开即聚焦输入框（Sheet 仅可见时挂载内容，autoFocus 时机等价）；键盘避让由通用 Sheet 提供 */}
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
      {/* 错误行，与 SourceSheet 同规格 */}
      {err.length > 0 && (
        <Text style={[styles.opErr, { color: theme.colors.dangerInk }]}>{err}</Text>
      )}

      {/* 「换个快的」chips：点 chip 即保存 */}
      <GroupLabel label={NEW_UI_SHEET_NAME.groupPicks} />
      <ChipFlow
        items={NEW_UI_NICK_PICKS.map(n => ({ key: n, label: n }))}
        onSelect={n => {
          setDraft(n)
          handleSave(n)
        }}
      />
      {/* 底部说明灰字 */}
      <Text style={[styles.hint, { color: theme.colors.text3 }]}>
        {NEW_UI_SHEET_NAME.hint}
      </Text>
    </Sheet>
  )
}

NameSheet.displayName = 'NewUINameSheet'

const styles = StyleSheet.create({
  /** 头像行 */
  avBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AVATAR_ROW.gap,
    marginTop: AVATAR_ROW.marginTop,
  },
  /** 首字字形 */
  avPreviewText: {
    fontWeight: FONT_WEIGHT.black,
    letterSpacing: LETTER_SPACING.wider,
  },
  /** 右侧按钮列 */
  avActs: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    gap: AVATAR_ROW.actsGap,
  },
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
