import { memo } from 'react'
import Section from '../../components/Section'
import { useI18n } from '@/lang'
import ReportContent from './ReportContent'

export default memo(() => {
  const t = useI18n()

  return (
    <Section title={t('setting_listening_report')}>
      <ReportContent />
    </Section>
  )
})
