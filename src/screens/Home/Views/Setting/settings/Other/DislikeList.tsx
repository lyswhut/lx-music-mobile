import { memo, useRef } from 'react'
import { StyleSheet, View } from 'react-native'

// import { gzip, ungzip } from 'pako'

import SubTitle from '../../components/SubTitle'
import Button from '../../components/Button'
import { toast } from '@/utils/tools'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { state, useRuleNum } from '@/store/dislikeList'
import DislikeEditModal, { type DislikeEditModalType } from './DislikeEditModal'
import { overwirteDislikeInfo } from '@/core/dislikeList'

export default memo(() => {
  const t = useI18n()
  const modalRef = useRef<DislikeEditModalType>(null)
  const ruleNum = useRuleNum()

  const handleShow = () => {
    modalRef.current?.show(state.dislikeInfo.rules)
  }

  const handleSave = async(rules: string) => {
    if (state.dislikeInfo.rules.trim() == rules.trim()) return
    await overwirteDislikeInfo(rules)
    toast(t('setting__other_dislike_list_saved_tip'))
  }

  return (
    <SubTitle title={t('setting__other_dislike_list')}>
      <View style={styles.ruleNum}>
        <Text>{t('setting__other_dislike_list_label', { num: ruleNum })}</Text>
      </View>
      <View style={styles.btn}>
        <Button onPress={handleShow}>{t('setting_other_dislike_list_show_btn')}</Button>
      </View>
      <DislikeEditModal ref={modalRef} onSave={handleSave} />
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  ruleNum: {
    marginBottom: 5,
  },
  btn: {
    flexDirection: 'row',
  },
})
