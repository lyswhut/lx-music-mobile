import { useCallback } from 'react'
import { StyleSheet, View } from 'react-native'

import { GroupLabel } from '@/newui/components/GroupLabel'
import { OptionRow } from '@/newui/components/OptionRow'
import { Sheet } from '@/newui/components/Sheet'
import { NEW_UI_POD_REGION_GROUPS } from '@/newui/const/radio'
import { NEW_UI_POD_REGION_SHEET } from '@/newui/const/radioHome'
import { OPTION_ROW } from '@/newui/theme'

export interface PodRegionSheetProps {
  /** 显隐（Sheet 自己管退场动画与卸载） */
  visible: boolean
  /** 当前区码（抽屉里的那颗实心圆跟随它；与 `POD_REGION_DEFAULT` 同源） */
  country: string
  /** 选中一项（**只报选择**：收层、换区、轴归零都由容器做——见 RadioHomeScreen.handlePickRegion） */
  onPick: (country: string) => void
  /** 关闭（点遮罩 / Android 返回键；Sheet 的两条出口都走它） */
  onClose: () => void
  /** 底部安全区（透传 Sheet） */
  bottomInset?: number
}

/**
 * 收听地区抽屉（原型 `#podRegionSheet`，U85 `parts/sheets/region-sheet.html`，
 * 装配逻辑 app.js `openPodRegionSheet` L1860 / `podRegionRow` L1872）：
 * chrome 复用共通件 `Sheet`（handle + `.sheet-title`），**只传 title、不传 subtitle**——
 * 件头逐字「原先那句『选一个地区，名单跟着换。』本轮撤掉，槽位宁可空着」，
 * 所以这一只不继承 `.sheet-sub` 那一行，屏上只剩标题「收听地区」。
 * 主体 = 5 组 42 区（`const/radio.ts` 的 `NEW_UI_POD_REGION_GROUPS`，逐字照搬 data.js L320-374）：
 * 分组小标题 `.group-label`（共通件 `GroupLabel`，U18）+ 选项行族 `.opt-list/.opt-row/.radio`
 * （共通件 `OptionRow` 的 radio 档，U19），**选中态就是行首那颗实心圆**（`active`）。
 * 42 行走 `Sheet` 默认主体（`ScrollView`），不接 `list` 虚拟化——定长列表，契约 7.5 拍板。
 * 挂载形态：所在屏幕根 View 内的 absolute-fill 覆盖层（`Sheet.tsx` 头注口径，不走 RNN Modal / 新路由），
 * 由 RadioHomeScreen 的屏内层状态持有 visible。
 */
export const PodRegionSheet = ({
  visible,
  country,
  onPick,
  onClose,
  bottomInset,
}: PodRegionSheetProps) => {
  const handlePick = useCallback(
    (key: string) => {
      // 原型 podRegionRow L1872-1874：先收层，再判「点的就是当前区」——同区不再重取
      onClose()
      if (key !== country) onPick(key)
    },
    [country, onClose, onPick],
  )

  return (
    <Sheet
      visible={visible}
      title={NEW_UI_POD_REGION_SHEET.title}
      onClose={onClose}
      bottomInset={bottomInset}
    >
      {NEW_UI_POD_REGION_GROUPS.map(group => (
        <View key={group.label}>
          <GroupLabel label={group.label} />
          {/* .opt-list{gap:7} */}
          <View style={styles.list}>
            {group.items.map(item => (
              <OptionRow
                key={item.key}
                name={item.label}
                active={item.key === country}
                onPress={() => { handlePick(item.key) }}
              />
            ))}
          </View>
        </View>
      ))}
    </Sheet>
  )
}

PodRegionSheet.displayName = 'NewUIPodRegionSheet'

const styles = StyleSheet.create({
  /** .opt-list{gap:7px} */
  list: {
    gap: OPTION_ROW.listGap,
  },
})
