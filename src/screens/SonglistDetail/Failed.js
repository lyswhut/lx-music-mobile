import React, { memo } from 'react'
import { View, Text, StyleSheet, ImageBackground } from 'react-native'
import { useGetter, useDispatch } from '@/store'
import { useTranslation } from '@/plugins/i18n'
import Button from '@/components/common/Button'
import { pop } from '@/navigation'

const Header = memo(() => {
  const { t } = useTranslation()
  const theme = useGetter('common', 'theme')
  const componentIds = useGetter('common', 'componentIds')
  const back = () => {
    pop(componentIds.songlistDetail)
  }

  return (
    <View style={{ ...styles.container }}>
      <Text style={{ ...styles.text, color: theme.normal20 }}>{t('load_failed')}</Text>
      <Button onPress={back} style={{ ...styles.controlBtn, backgroundColor: theme.secondary40 }}>
        <Text style={{ ...styles.controlBtnText, color: theme.secondary }}>{t('back')}</Text>
      </Button>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    marginBottom: '20%',
  },
  controlBtn: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 25,
    paddingRight: 25,
    borderRadius: 4,
  },
  controlBtnText: {
    fontSize: 14,
    textAlign: 'center',
  },
})

export default Header
