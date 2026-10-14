import { memo } from 'react'

// import Section from '../../components/Section'
import SubTitle from '../../components/SubTitle'
import Theme from './Theme'
import IsAutoTheme from './IsAutoTheme'
import IsHideBgDark from './IsHideBgDark'
import IsDynamicBg from './IsDynamicBg'
import IsFontShadow from './IsFontShadow'
// import { useI18n } from '@/lang/i18n'

export default memo(() => {
  return (
    <>
      <Theme />
      <SubTitle title="主题">
        <IsAutoTheme />
        <IsHideBgDark />
        <IsDynamicBg />
        <IsFontShadow />
      </SubTitle>
    </>
  )
})
