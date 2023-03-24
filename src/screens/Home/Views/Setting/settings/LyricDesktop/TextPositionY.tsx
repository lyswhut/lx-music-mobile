import React, { memo, useMemo } from 'react'
import { View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { setDesktopLyricTextPosition } from '@/core/desktopLyric'
import { createStyle } from '@/utils/tools'
import { updateSetting } from '@/core/common'

type Y_TYPE = LX.AppSetting['desktopLyric.textPosition.y']

const Y_LIST = [
  'top',
  'center',
  'bottom',
] as const

const useActive = (id: Y_TYPE) => {
  const y = useSettingValue('desktopLyric.textPosition.y')
  const isActive = useMemo(() => y == id, [y, id])
  return isActive
}

const Item = ({ id, name, change }: {
  id: Y_TYPE
  name: string
  change: (id: Y_TYPE) => void
}) => {
  const isActive = useActive(id)
  return <CheckBox marginBottom={3} check={isActive} label={name} onChange={() => { change(id) }} need />
}

export default memo(() => {
  const t = useI18n()
  const list = useMemo(() => {
    return Y_LIST.map(id => ({ id, name: t(`setting_lyric_desktop_text_y_${id}`) }))
  }, [t])

  const setPosition = (id: Y_TYPE) => {
    void setDesktopLyricTextPosition(null, id).then(() => {
      updateSetting({ 'desktopLyric.textPosition.y': id })
    })
  }

  return (
    <SubTitle title={t('setting_lyric_desktop_text_y')}>
      <View style={styles.list}>
        {
          list.map(({ id, name }) => <Item name={name} id={id} key={id} change={setPosition} />)
        }
      </View>
    </SubTitle>
  )
})

const styles = createStyle({
  list: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})
