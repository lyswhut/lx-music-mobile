import { memo, useCallback, useMemo, useRef } from 'react'

import { View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { createStyle } from '@/utils/tools'
import { setApiSource } from '@/core/apiSource'
import { useI18n } from '@/lang'
import apiSourceInfo from '@/utils/musicSdk/api-source-info'
import { useSettingValue } from '@/store/setting/hook'
import { useStatus, useUserApiList } from '@/store/userApi'
import Button from '../../components/Button'
import UserApiEditModal, { type UserApiEditModalType } from './UserApiEditModal'
// import { importUserApi, removeUserApi } from '@/core/userApi'

const apiSourceList = apiSourceInfo.map(api => ({
  id: api.id,
  name: api.name,
  disabled: api.disabled,
}))

const useActive = (id: string) => {
  const activeLangId = useSettingValue('common.apiSource')
  const isActive = useMemo(() => activeLangId == id, [activeLangId, id])
  return isActive
}

const Item = ({ id, name, change }: {
  id: string
  name: string
  change: (id: string) => void
}) => {
  const isActive = useActive(id)
  // const [toggleCheckBox, setToggleCheckBox] = useState(false)
  return <CheckBox marginBottom={5} check={isActive} label={name} onChange={() => { change(id) }} need />
}

export default memo(() => {
  const t = useI18n()
  const list = useMemo(() => apiSourceList.map(s => ({
    // @ts-expect-error
    name: t(`setting_basic_source_${s.id}`) || s.name,
    id: s.id,
  })), [t])
  const setApiSourceId = useCallback((id: string) => {
    setApiSource(id)
  }, [])
  const userApiListRaw = useUserApiList()
  const apiStatus = useStatus()
  const apiSourceSetting = useSettingValue('common.apiSource')
  const userApiList = useMemo(() => {
    const getApiStatus = () => {
      let status
      if (apiStatus.status) status = t('setting_basic_source_status_success')
      else if (apiStatus.message == 'initing') status = t('setting_basic_source_status_initing')
      else status = t('setting_basic_source_status_failed')

      return status
    }
    return userApiListRaw.map(api => {
      return {
        id: api.id,
        name: `${api.name}${api.id == apiSourceSetting ? `[${getApiStatus()}]` : ''}`,
        // status: apiStatus.status,
        // message: apiStatus.message,
        // disabled: false,
      }
    })
  }, [userApiListRaw, apiStatus, apiSourceSetting, t])

  const modalRef = useRef<UserApiEditModalType>(null)
  const handleShow = () => {
    modalRef.current?.show()
  }

  return (
    <SubTitle title={t('setting_basic_source')}>
      <View style={styles.list}>
        {
          list.map(({ id, name }) => <Item name={name} id={id} key={id} change={setApiSourceId} />)
        }
        {
          userApiList.map(({ id, name }) => <Item name={name} id={id} key={id} change={setApiSourceId} />)
        }
      </View>
      <View style={styles.btn}>
        <Button onPress={handleShow}>{t('setting_basic_source_user_api_btn')}</Button>
      </View>
      <UserApiEditModal ref={modalRef} />
    </SubTitle>
  )
})

const styles = createStyle({
  list: {
    flexGrow: 0,
    flexShrink: 1,
    // flexDirection: 'row',
    // flexWrap: 'wrap',
  },
  btn: {
    marginTop: 10,
    flexDirection: 'row',
  },
})
