import { useRef } from 'react'

import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import { View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { useI18n } from '@/lang'
import ScriptImportExport, { type ScriptImportExportType } from './ScriptImportExport'
import ScriptImportOnline, { type ScriptImportOnlineType } from './ScriptImportOnline'
import { state } from '@/store/userApi'
import { tipDialog, createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'

interface BtnProps {
  btnStyle?: StyleProp<ViewStyle>
}

// 底部「批量导入 / 在线导入」两个独立按钮（替代原先的导入下拉菜单）
export default ({ btnStyle }: BtnProps) => {
  const t = useI18n()
  const theme = useTheme()
  const scriptImportExportRef = useRef<ScriptImportExportType>(null)
  const scriptImportOnlineRef = useRef<ScriptImportOnlineType>(null)

  const checkMax = () => {
    if (state.list.length > 20) {
      void tipDialog({
        message: t('user_api_max_tip'),
        btnText: t('ok'),
      })
      return false
    }
    return true
  }

  const handleImportLocal = () => {
    if (!checkMax()) return
    scriptImportExportRef.current?.import()
  }

  const handleImportOnline = () => {
    if (!checkMax()) return
    scriptImportOnlineRef.current?.show()
  }


  return (
    <View style={styles.container}>
      <Button style={btnStyle} onPress={handleImportLocal}>
        <Text size={14} color={theme['c-button-font']}>{t('user_api_btn_import_local')}</Text>
      </Button>
      <Button style={btnStyle} onPress={handleImportOnline}>
        <Text size={14} color={theme['c-button-font']}>{t('user_api_btn_import_online')}</Text>
      </Button>
      <ScriptImportExport ref={scriptImportExportRef} />
      <ScriptImportOnline ref={scriptImportOnlineRef} />
    </View>
  )
}


const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
})
