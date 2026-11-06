import { useRef } from 'react'
import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import ListImportExport, { type ListImportExportType } from './MyList/ListImportExport'
import { useActiveListId, useMyList } from '@/store/list/hook'
import listState from '@/store/list/state'

export default () => {
  const t = useI18n()
  const theme = useTheme()
  const importExportRef = useRef<ListImportExportType>(null)
  const activeListId = useActiveListId()
  const allList = useMyList()

  const handlePress = () => {
    const listInfo = allList.find(l => l.id === activeListId)
    if (!listInfo) return
    const index = allList.findIndex(l => l.id === activeListId)
    importExportRef.current?.selectFile(listInfo, index)
  }

  return (
    <>
      <Button
        style={{ ...styles.button, backgroundColor: theme['c-primary-background-active'] }}
        onPress={handlePress}
        disabled={listState.fetchingListStatus[activeListId]}
      >
        <Text size={13} color={theme['c-primary-font-active']}>{t('list_select_local_file')}</Text>
      </Button>
      <ListImportExport ref={importExportRef} />
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
