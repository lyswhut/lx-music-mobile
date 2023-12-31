import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Text from '@/components/common/Text'
import { InteractionManager, View } from 'react-native'
import { createStyle } from '@/utils/tools'
import { useI18n } from '@/lang'
import CheckBox from '@/components/common/CheckBox'
import { getListMusics, setFetchingListStatus, updateListMusicPosition } from '@/core/list'
import { sortListMusicInfo } from './utils'

const Title = ({ title }: {
  title: string
}) => {
  return (
    <Text style={styles.title} size={16}>
      {title}
    </Text>
  )
}

export interface FormType {
  reset: () => void
  getForm: () => ([FieldName | undefined, FieldType | undefined])
}
const fieldNames = ['name', 'singer', 'album', 'time', 'source'] as const
const fieldTypes = ['up', 'down', 'random'] as const
type FieldName = typeof fieldNames[number]
type FieldType = typeof fieldTypes[number]
const CheckBoxItem = <T extends FieldName | FieldType>({ id, isActive, disabled, change }: {
  id: T
  isActive: boolean
  disabled?: boolean
  change: (id: T) => void
}) => {
  const t = useI18n()
  return (
    <CheckBox
      marginBottom={3}
      disabled={disabled}
      check={isActive}
      label={t(`list_sort_modal_by_${id}`)}
      onChange={() => { change(id) }} need />
  )
}
const Form = forwardRef<FormType, {}>((props, ref) => {
  const t = useI18n()
  const [name, setName] = useState<FieldName>()
  const [type, setType] = useState<FieldType>()
  useImperativeHandle(ref, () => ({
    reset() {
      setName(undefined)
      setType(undefined)
    },
    getForm() {
      return [name, type]
    },
  }))

  return (
    <View>
      <View style={styles.formSection}>
        <Text>{t('list_sort_modal_by_field')}</Text>
        <View style={styles.formList}>
          {fieldNames.map(n => <CheckBoxItem key={n} id={n} isActive={name == n} change={setName} disabled={type == 'random'} />)}
        </View>
      </View>
      <View style={styles.formSection}>
        <Text>{t('list_sort_modal_by_type')}</Text>
        <View style={styles.formList}>
          {fieldTypes.map(n => <CheckBoxItem key={n} id={n} isActive={type == n} change={setType} />)}
        </View>
      </View>
    </View>
  )
})

export interface ListMusicSortType {
  show: (listInfo: LX.List.MyListInfo) => void
}
const initSelectInfo = {}

// const getName = (id: string, name: string) => {
//   switch (id) {
//     case LIST_IDS.DEFAULT:
//       return global.i18n.t(name)
//     case LIST_IDS.LOVE:
//       return global.i18n.t(name)
//     default:
//       return name
//   }
// }

export default forwardRef<ListMusicSortType, {}>((props, ref) => {
  const alertRef = useRef<ConfirmAlertType>(null)
  const [title, setTitle] = useState('')
  const selectedListInfo = useRef<LX.List.MyListInfo>(initSelectInfo as LX.List.MyListInfo)
  const formTypeRef = useRef<FormType>(null)
  const [visible, setVisible] = useState(false)

  const handleShow = () => {
    alertRef.current?.setVisible(true)
  }
  useImperativeHandle(ref, () => ({
    show(listInfo) {
      setTitle(listInfo.name)
      selectedListInfo.current = listInfo
      if (visible) handleShow()
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow()
        })
      }
    },
  }))

  const handleSort = async() => {
    const [name, type] = formTypeRef.current!.getForm()
    // console.log(type, name)
    if (!type || (!name && type != 'random')) return
    const id = selectedListInfo.current.id
    let list = [...(await getListMusics(id))]
    setFetchingListStatus(id, true)
    requestAnimationFrame(() => {
      void InteractionManager.runAfterInteractions(() => {
        list = sortListMusicInfo(list, type, name!, global.i18n.locale)
        void updateListMusicPosition(id, 0, list.map(m => m.id))
        setFetchingListStatus(id, false)
      })
    })

    alertRef.current?.setVisible(false)
  }

  return (
    visible
      ? <ConfirmAlert
          ref={alertRef}
          onConfirm={handleSort}
        >
          <View style={styles.renameContent}>
            <Title title={title} />
            <Form ref={formTypeRef} />
          </View>
        </ConfirmAlert>
      : null
  )
})


const styles = createStyle({
  renameContent: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
  },
  title: {
    textAlign: 'center',
    // paddingTop: 15,
    paddingBottom: 25,
  },
  formSection: {
    marginBottom: 15,
  },
  formList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})


