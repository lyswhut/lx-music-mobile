import { useMemo, useRef } from 'react'

import DorpDownMenu, { type DorpDownMenuProps as _DorpDownMenuProps } from '@/components/common/DorpDownMenu'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import ScriptImportExport, { type ScriptImportExportType } from './ScriptImportExport'
import ScriptImportOnline, { type ScriptImportOnlineType } from './ScriptImportOnline'
import { state } from '@/store/userApi'
import { tipDialog } from '@/utils/tools'

import { useTheme } from '@/store/theme/hook'

interface BtnProps {
  btnStyle?: _DorpDownMenuProps<any[]>['btnStyle']
}


export default ({ btnStyle }: BtnProps) => {
  const t = useI18n()
  const theme = useTheme()
  const scriptImportExportRef = useRef<ScriptImportExportType>(null)
  const scriptImportOnlineRef = useRef<ScriptImportOnlineType>(null)

  const importTypes = useMemo(() => {
    return [
      { action: 'local', label: t('user_api_btn_import_local') },
      { action: 'online', label: t('user_api_btn_import_online') },
    ] as const
  }, [t])

  type DorpDownMenuProps = _DorpDownMenuProps<typeof importTypes>

  const handleAction: DorpDownMenuProps['onPress'] = ({ action }) => {
    if (state.list.length > 20) {
      void tipDialog({
        message: t('user_api_max_tip'),
        btnText: t('ok'),
      })
      return
    }

    if (action == 'local') {
      scriptImportExportRef.current?.import()
    } else {
      scriptImportOnlineRef.current?.show()
    }
  }


  return (
    <DorpDownMenu
      btnStyle={btnStyle}
      menus={importTypes}
      center
      onPress={handleAction}
    >
      <Text size={14} color={theme['c-button-font']}>{t('user_api_btn_import')}</Text>
      <ScriptImportExport ref={scriptImportExportRef} />
      <ScriptImportOnline ref={scriptImportOnlineRef} />
    </DorpDownMenu>
  )
}
