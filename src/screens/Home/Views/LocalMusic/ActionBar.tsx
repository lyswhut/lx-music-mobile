import { useRef, useCallback } from 'react'
import { View } from 'react-native'
import Text from '@/components/common/Text'
import Button from '@/components/common/Button'
import ChoosePath, { type ChoosePathType } from '@/components/common/ChoosePath'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'

type ActionBarProps = {
  onScan: (dirPath: string) => void
  isScanning: boolean
}

export default ({ onScan, isScanning }: ActionBarProps) => {
  const t = useI18n()
  const theme = useTheme()
  const choosePathRef = useRef<ChoosePathType>(null)

  const handleChoose = useCallback(() => {
    choosePathRef.current?.show({
      title: t('local_music_choose_path_title'),
      dirOnly: true,
    })
  }, [t])

  const handleConfirm = useCallback(
    (path: string) => {
      onScan(path)
    },
    [onScan],
  )

  return (
    <View style={styles.container}>
      <Text size={18} style={{ fontWeight: 'bold', ...styles.title }}>
        {t('local_music_title')}
      </Text>
      <Button
        disabled={isScanning}
        onPress={handleChoose}
        style={{
          ...styles.scanBtn,
          backgroundColor: isScanning
            ? theme['c-primary-light-200-alpha-500']
            : theme['c-primary'],
        }}
      >
        <Text color="#fff" size={14}>
          {isScanning
            ? t('local_music_scanning')
            : t('local_music_scan')}
        </Text>
      </Button>
      <ChoosePath ref={choosePathRef} onConfirm={handleConfirm} />
    </View>
  )
}

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 10,
    paddingBottom: 10,
    height: 50,
  },
  title: {
    flex: 1,
  },
  scanBtn: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 4,
  },
})
