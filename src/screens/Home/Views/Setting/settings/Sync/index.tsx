import { memo, useState } from 'react'
import { View } from 'react-native'

import Section from '../../components/Section'
import SubTitle from '../../components/SubTitle'
import Button from '../../components/Button'
import IsEnable from './IsEnable'
import History from './History'
import { useI18n } from '@/lang'
import { toast } from '@/utils/tools'
import { discoverSyncServer } from '@/plugins/sync/discovery'
import { setSyncHost } from '@/plugins/sync/data'
import { createStyle } from '@/utils/tools'

// import SyncHost from './SyncHost'

export default memo(() => {
  const t = useI18n()
  const [host, setHost] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearchServer = async() => {
    if (isSearching) return
    setIsSearching(true)
    toast(t('setting_sync_searching'))
    try {
      const found = await discoverSyncServer()
      if (found.length) {
        const address = found.length > 1 ? `${found[0]} (${found.length})` : found[0]
        setHost(found[0])
        void setSyncHost(found[0])
        toast(t('setting_sync_search_found', { address }))
      } else {
        toast(t('setting_sync_search_not_found'))
      }
    } catch {
      toast(t('setting_sync_search_not_found'))
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <Section title={t('setting_sync')}>
      <SubTitle title={t('setting_sync')}>
        <IsEnable host={host} setHost={setHost} />
        <View style={styles.btnRow}>
          <Button disabled={isSearching} onPress={handleSearchServer}>{t('setting_sync_search_btn')}</Button>
          <History setHost={setHost} />
        </View>
      </SubTitle>
    </Section>
  )
})

const styles = createStyle({
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 15,
  },
})
