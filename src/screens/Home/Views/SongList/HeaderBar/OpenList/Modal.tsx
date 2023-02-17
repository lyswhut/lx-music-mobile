import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Text from '@/components/common/Text'
import { View } from 'react-native'
import Input, { type InputType } from '@/components/common/Input'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
// import SourceSelector, { type SourceSelectorProps, type SourceSelectorType } from '../SourceSelector'
import { type Source } from '@/store/songlist/state'

interface IdInputType {
  setText: (text: string) => void
  getText: () => string
  focus: () => void
}
const IdInput = forwardRef<IdInputType, {}>((props, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const [text, setText] = useState('')
  const inputRef = useRef<InputType>(null)

  useImperativeHandle(ref, () => ({
    getText() {
      return text.trim()
    },
    setText(text) {
      setText(text)
    },
    focus() {
      inputRef.current?.focus()
    },
  }))

  return (
    <Input
      ref={inputRef}
      placeholder={t('songlist_open_input_placeholder')}
      value={text}
      onChangeText={setText}
      style={{ ...styles.input, backgroundColor: theme['c-primary-input-background'] }}
    />
  )
})


export interface ModalProps {
  onOpenId: (id: string) => void
  // onSourceChange: SourceSelectorProps['onSourceChange']
}
export interface ModalType {
  show: (source: Source) => void
}

export default forwardRef<ModalType, ModalProps>(({ onOpenId }, ref) => {
  const alertRef = useRef<ConfirmAlertType>(null)
  // const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const inputRef = useRef<IdInputType>(null)
  const [visible, setVisible] = useState(false)
  const theme = useTheme()
  const t = useI18n()

  const handleShow = (source: Source) => {
    alertRef.current?.setVisible(true)
    requestAnimationFrame(() => {
      inputRef.current?.setText('')
      // sourceSelectorRef.current?.setSource(source)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    })
  }
  useImperativeHandle(ref, () => ({
    show(source) {
      if (visible) handleShow(source)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow(source)
        })
      }
    },
  }))

  const handleConfirm = () => {
    let id = inputRef.current?.getText() ?? ''
    if (!id.length) return
    if (id.length > 500) id = id.substring(0, 500)
    alertRef.current?.setVisible(false)
    onOpenId(id)
  }

  return (
    visible
      ? <ConfirmAlert
          ref={alertRef}
          onConfirm={handleConfirm}
        >
          <View style={styles.content}>
            <View style={styles.col}>
              {/* <SourceSelector style={{ ...styles.selector, backgroundColor: theme['c-primary-input-background'] }} ref={sourceSelectorRef} onSourceChange={onSourceChange} /> */}
              <IdInput ref={inputRef} />
            </View>
            <Text style={styles.inputTipText} size={13} color={theme['c-600']}>{t('songlist_open_input_tip')}</Text>
          </View>
        </ConfirmAlert>
      : null
  )
})


const styles = createStyle({
  content: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
  },
  col: {
    flexDirection: 'row',
    height: 38,
  },
  // selector: {
  //   borderTopLeftRadius: 4,
  //   borderBottomLeftRadius: 4,
  // },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 290,
    // borderRadius: 4,
    // borderTopRightRadius: 4,
    // borderBottomRightRadius: 4,
    // paddingTop: 2,
    // paddingBottom: 2,
    height: '100%',
  },
  inputTipText: {
    marginTop: 15,
    // lineHeight: 18,
  },
})


