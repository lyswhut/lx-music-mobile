import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { BRAND_AVATAR, FONT_SIZE, FONT_WEIGHT, LETTER_SPACING, MINE, useTheme } from '@/newui/theme'

import { BrandAvatar } from '../BrandAvatar'
import { PillButton } from '../PillButton'

export interface MineHeaderProps {
  /** 昵称首字（有头像图时只当兜底） */
  initial: string
  /** 头像图的本机文件路径；不传 = 走首字 */
  avatarImageUri?: string | null
  /** 昵称 */
  name: string
  /** 副行 */
  sub: string
  /** 「修改」胶囊文案；不传则不渲染按钮 */
  editLabel?: string
  onEditPress?: () => void
}

/**
 * 我的页头部：渐变首字头像（有图则显示图片）+ 昵称 / 副行 + 「修改」胶囊。
 * 头像与顶栏统一走 BrandAvatar，尺寸差异由 BRAND_AVATAR.mine preset 给出。
 * 纯展示组件；昵称 / 头像数据与动作由容器接线。
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
        // edit 档：图标 14、左内衬 11、按压 .96 均由该档给出
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
  /** 头像 + 文字 + 按钮横排 */
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MINE.headGap,
    marginTop: MINE.headMarginTop,
  },
  /** 文字列，占满剩余宽度 */
  body: {
    flex: 1,
    minWidth: 0,
  },
  /** 昵称 */
  name: {
    fontSize: FONT_SIZE.mineName,
    fontWeight: FONT_WEIGHT.black,
    letterSpacing: LETTER_SPACING.normal,
  },
  /** 副行，等宽数字 */
  sub: {
    marginTop: MINE.headSubMarginTop,
    fontSize: FONT_SIZE.captionLg,
    fontVariant: ['tabular-nums'],
  },
})
