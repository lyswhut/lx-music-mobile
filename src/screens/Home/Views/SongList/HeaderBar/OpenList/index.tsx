import { useRef, forwardRef, useImperativeHandle } from 'react'
import Button from '@/components/common/Button'
import Modal, { type ModalType } from './Modal'
import { type Source } from '@/store/songlist/state'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'

export interface OpenListType {
  setInfo: (source: Source) => void
}

export default forwardRef<OpenListType, {}>((props, ref) => {
  const t = useI18n()
  const theme = useTheme()
  const modalRef = useRef<ModalType>(null)
  const songlistInfoRef = useRef<{ source: Source }>({ source: 'kw' })

  useImperativeHandle(ref, () => ({
    setInfo(source) {
      songlistInfoRef.current.source = source
    },
  }))

  const handleOpenSonglist = (id: string) => {
    navigations.pushSonglistDetailScreen(commonState.componentIds.home!, {
      play_count: undefined,
      id,
      author: '',
      name: '',
      img: undefined,
      desc: undefined,
      source: songlistInfoRef.current.source,
    })
  }

  const handleModalSourceChange = (source: Source) => {
    songlistInfoRef.current.source = source
  }

  return (
    <>
      <Button style={{ ...styles.button, backgroundColor: theme['c-primary-background-active'] }} onPress={() => modalRef.current?.show(songlistInfoRef.current.source)}>
        <Text size={13} color={theme['c-primary-font-active']}>{t('songlist_open_list')}</Text>
      </Button>
      <Modal ref={modalRef} onOpenId={handleOpenSonglist} onSourceChange={handleModalSourceChange} />
    </>
  )
})

const styles = createStyle({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 14,
    height: 28,
  },
})