import { useRef } from 'react'
import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import ListNameEdit, { type ListNameEditType } from './MyList/ListNameEdit'
import listState from '@/store/list/state'

export default () => {
  const t = useI18n()
  const theme = useTheme()
  const listNameEditRef = useRef<ListNameEditType>(null)

  return (
    <>
      <Button
        style={{ ...styles.button, backgroundColor: theme['c-primary-background-active'] }}
        onPress={() => listNameEditRef.current?.showCreate(listState.userList.length)}
      >
        <Text size={13} color={theme['c-primary-font-active']}>{t('list_create')}</Text>
      </Button>
      <ListNameEdit ref={listNameEditRef} />
    </>
  )
}

const styles = createStyle({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
    paddingRight: 12,
    marginRight: 8,
    borderRadius: 14,
    height: 28,
  },
})
