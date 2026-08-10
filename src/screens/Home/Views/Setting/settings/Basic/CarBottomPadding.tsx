import { memo, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

const LIST = [
  { val: 0, label: '0px' },
  { val: 20, label: '20px' },
  { val: 40, label: '40px' },
  { val: 60, label: '60px' },
  { val: 80, label: '80px' },
  { val: 100, label: '100px' },
] as const

type VAL_TYPE = typeof LIST[number]['val']

const Item = ({ val, label }: {
  val: VAL_TYPE
  label: string
}) => {
  const currentVal = useSettingValue('common.carBottomPadding') ?? 0
  const isActive = currentVal === val
  return (
    <CheckBox
      marginRight={12}
      check={isActive}
      label={label}
      onChange={() => { updateSetting({ 'common.carBottomPadding': val }) }}
      need
    />
  )
}

export default memo(() => {
  const t = useI18n()

  const list = useMemo(() => {
    return LIST.map(item => ({
      val: item.val,
      label: item.val === 0 ? t('setting_basic_car_bottom_padding_auto') : item.label,
    }))
  }, [t])

  return (
    <SubTitle title={t('setting_basic_car_bottom_padding')} helpDesc={t('setting_basic_car_bottom_padding_tip')}>
      <View style={styles.list}>
        {
          list.map(({ val, label }) => <Item key={val} val={val} label={label} />)
        }
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
})
