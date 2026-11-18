import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { BUTTON, FONT_SIZE, LETTER_SPACING, SPACING, useTheme } from '@/newui/theme'

import { IconButton } from '../IconButton'
import type { IconName } from '../Icon'

/**
 * 右上那一颗（原型 #plFavBtn）的三种形态（app.js L902-922 三分支）：
 * - fav：心钮（.pl-fav-btn.on 实心心形 + 主色）——pl / mine / rank 形态的收藏 / 取消收藏；
 * - delete：删除本歌单（本地单可删时的那位，trash 字形 + err 色，按下过二次确认）；
 * - none：同尺寸空槽（原型 visibility:hidden 留位）——系统列表 / 不可删的本地单，不放死按钮。
 * 第四支 `icon`（2026-10-17 电台首页 U81 追加，**纯新增分支**）：右上「通用图标钮」，
 * 字形 / 说明 / 动作全由容器传——原型 `#podSearchBtn` 就是这一位的第四种实例。
 * 既有三形态的判定顺序与渲染路径未动，SonglistDetail 调用方零影响。
 */
export type PlTopRight =
  | {
      kind: 'fav'
      /** 已收藏（.pl-fav-btn.on：心形翻实心亮主色） */
      collected: boolean
      onPress: () => void
      /** 无障碍文案（容器按归属 owner 与收藏态给 PLD_LABELS 四句之一） */
      label: string
    }
  | { kind: 'delete'; onPress: () => void; label: string }
  /**
   * icon：右上通用图标钮（原型 `#radioLayer` 顶排那颗 `#podSearchBtn`，index.html L391
   * 「右上那颗是搜节目的入口」）。`.pl-top` 这一位本来就是「同尺寸一颗 icon-btn」，
   * 字形与说明都由容器给（电台是 search，别的层将来也是这一支）。
   * 与 fav / delete 的区别只有字形不固定、没有选中态；底档同 .pl-top 那一侧（strong）。
   */
  | { kind: 'icon', name: IconName, label: string, onPress: () => void }
  | { kind: 'none' }

export interface PlTopProps {
  /** 面包屑文字（容器传 const newUiPlCrumb(owner, source)：按归属取，2026-10-24 起不按入口 kind） */
  crumbText: string
  /** 返回钮无障碍文案 */
  backLabel: string
  onBack: () => void
  /** 右上那一格的形态与接线（见 PlTopRight） */
  right: PlTopRight
}

/**
 * 歌单详情层顶排（对应原型 `.pl-top` / `.pl-crumb` / `.pl-fav-btn`，index.html L377-L381 /
 * styles.css L465-469，parts/songlist-detail/pl-top.{html,css}，U67）：返回钮 + 面包屑 + 右上钮，
 * 三列配重 34 / 1fr / 34（RN 以「两端钮 + 中部 flex:1 居中」表达）。返回钮 chevron 转 180°、
 * 图标底取 strong 加强档；右上三形态见 PlTopRight。
 * 面包屑元素在原型叫 `.player-crumb`（样式定义在 _base.css，与播放页顶排共用一份）——
 * 本件只承接详情层这一侧，播放页那侧归 PlayerTop，两边不搅在一起。
 * 结构自 screens/SonglistDetail/SonglistDetailScreen 内联抽出（2026-10-15 拆件转正轮）：
 * 样式逐值照搬原内联定义，渲染零变化。
 * 纯展示组件：文案 / 形态与回调由容器传入，不读任何状态。
 */
export const PlTop = memo(({ crumbText, backLabel, onBack, right }: PlTopProps) => {
  const theme = useTheme()
  return (
    <View style={styles.top}>
      <IconButton
        name="chevron"
        strong
        onPress={onBack}
        iconStyle={styles.backIcon}
        accessibilityLabel={backLabel}
      />
      <Text style={[styles.crumb, { color: theme.colors.text2 }]} numberOfLines={1}>
        {crumbText}
      </Text>
      {right.kind === 'delete'
        ? (
          <IconButton
            name="trash"
            strong
            danger
            onPress={right.onPress}
            accessibilityLabel={right.label}
          />
        )
        : right.kind === 'fav'
          ? (
            <IconButton
              name={right.collected ? 'heartFill' : 'heart'}
              strong
              active={right.collected}
              onPress={right.onPress}
              accessibilityLabel={right.label}
            />
          )
          : right.kind === 'icon'
            ? (
              /* 第四支（U81 电台首页 #podSearchBtn）：与返回钮同重的 strong 底，字形与说明由容器给 */
              <IconButton
                name={right.name}
                strong
                onPress={right.onPress}
                accessibilityLabel={right.label}
              />
            )
            : <View style={styles.spacer} />}
    </View>
  )
})

PlTop.displayName = 'NewUIPlTop'

const styles = StyleSheet.create({
  /** .pl-top grid 34/1fr/34 → row + 中部 flex:1 居中 */
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.s,
  },
  /** .pl-top .icon-btn:first-child .ic{transform:rotate(180deg)} */
  backIcon: {
    transform: [{ rotate: '180deg' }],
  },
  /**
   * 右上不留钮时的同尺寸空槽（原型 #plFavBtn visibility:hidden 占位）
   *（= IconButton 缺省边长，维持 .pl-top 34/1fr/34 配重、面包屑仍居中）
   */
  spacer: {
    width: BUTTON.iconSize,
    height: BUTTON.iconSize,
  },
  /** .player-crumb 12px / text-2 / letter-spacing .4（详情顶排同款） */
  crumb: {
    flex: 1,
    minWidth: 0,
    textAlign: 'center',
    fontSize: FONT_SIZE.small,
    letterSpacing: LETTER_SPACING.wide,
  },
})
