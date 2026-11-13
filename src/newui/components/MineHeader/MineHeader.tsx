import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { BRAND_AVATAR, FONT_SIZE, FONT_WEIGHT, LETTER_SPACING, MINE, useTheme } from '@/newui/theme'

import { BrandAvatar } from '../BrandAvatar'
import { PillButton } from '../PillButton'

export interface MineHeaderProps {
  /** 昵称首字（.mh-art b，头像内容；有头像图时只当兜底） */
  initial: string
  /** 头像图的本机文件路径（原型 state.avatar → paintAvatar(#mineArt)）；不传 = 走首字 */
  avatarImageUri?: string | null
  /** 昵称（.mh-name） */
  name: string
  /** 副行（.mh-sub） */
  sub: string
  /** 「修改」胶囊文案（.mh-edit；原型 2026-10-24 从「改昵称」改成「修改」）；不传则不渲染按钮 */
  editLabel?: string
  onEditPress?: () => void
}

/**
 * 我的页头部（对应原型 .mine-head，styles.css L354-366）：
 * 58px 渐变首字头像（有图则是那张图）+ 昵称 / 副行 + 「修改」胶囊。
 * 头像 2026-10-12 走查现象 1：与顶栏头像统一走共通件 BrandAvatar（同一渐变 / 字色 / 描边），
 * 尺寸差异由 BRAND_AVATAR.mine preset 给出。
 * 2026-10-24 头像可上传：这颗圆与顶栏圆、浮层预览读同一份 state.avatar（useNickName.avatarUri），
 * 有图即 `<Image>` 铺满（原型 .mh-art img），没图才回落首字。
 * 纯展示组件；昵称 / 头像数据与「修改」动作由容器接线。
 */
export const MineHeader = memo(({
  initial,
  avatarImageUri,
  name,
  sub,
  editLabel,
  onEditPress,
}: MineHeaderProps) => {
  const theme = useTheme()
  return (
    <View style={styles.root}>
      <BrandAvatar
        size={BRAND_AVATAR.mine.size}
        textSize={BRAND_AVATAR.mine.textSize}
        text={initial}
        imageUri={avatarImageUri}
      />
      <View style={styles.body}>
        <Text numberOfLines={1} style={[styles.name, { color: theme.colors.text }]}>
          {name}
        </Text>
        <Text numberOfLines={1} style={[styles.sub, { color: theme.colors.text3 }]}>
          {sub}
        </Text>
      </View>
      {editLabel != null && (
        // 这一位是原型的 .mh-edit（不是 .pl-open-btn）：图标 14、左内衬 11、按压 .96 都归 edit 档（QA D85）
        <PillButton
          variant="edit"
          icon="edit"
          label={editLabel}
          iconSize={MINE.headEditIcon}
          onPress={onEditPress}
        />
      )}
    </View>
  )
})

MineHeader.displayName = 'NewUIMineHeader'

const styles = StyleSheet.create({
  /** .mine-head：row / align center / gap 13 / margin-top 8 */
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MINE.headGap,
    marginTop: MINE.headMarginTop,
  },
  /** .mh-body：flex 1 / min-width 0 */
  body: {
    flex: 1,
    minWidth: 0,
  },
  /** .mh-name：20px / 900 / letter-spacing .3 */
  name: {
    fontSize: FONT_SIZE.mineName,
    fontWeight: FONT_WEIGHT.black,
    letterSpacing: LETTER_SPACING.normal,
  },
  /** .mh-sub：11.5px / text-3 / margin-top 3 / 等宽数字 */
  sub: {
    marginTop: MINE.headSubMarginTop,
    fontSize: FONT_SIZE.captionLg,
    fontVariant: ['tabular-nums'],
  },
})
