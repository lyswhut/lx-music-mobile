import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import Text from '@/components/common/Text'
import { View, TouchableOpacity } from 'react-native'
import { createStyle, openUrl } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import Dialog, { type DialogType } from '@/components/common/Dialog'
import Button from '@/components/common/Button'
import List from './List'
import ImportBtn from './ImportBtn'

// interface UrlInputType {
//   setText: (text: string) => void
//   getText: () => string
//   focus: () => void
// }
// const UrlInput = forwardRef<UrlInputType, {}>((props, ref) => {
//   const theme = useTheme()
//   const t = useI18n()
//   const [text, setText] = useState('')
//   const inputRef = useRef<InputType>(null)
//   const [height, setHeight] = useState(100)

//   useImperativeHandle(ref, () => ({
//     getText() {
//       return text.trim()
//     },
//     setText(text) {
//       setText(text)
//     },
//     focus() {
//       inputRef.current?.focus()
//     },
//   }))

//   const handleLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
//     setHeight(nativeEvent.layout.height)
//   }, [])

//   return (
//     <View style={styles.inputContent} onLayout={handleLayout}>
//       <Input
//         ref={inputRef}
//         value={text}
//         onChangeText={setText}
//         textAlignVertical="top"
//         placeholder={t('setting_dislike_list_input_tip')}
//         size={12}
//         style={{ ...styles.input, height, backgroundColor: theme['c-primary-input-background'] }}
//       />
//     </View>
//   )
// })


// export interface UserApiEditModalProps {
//   onSave: (rules: string) => void
//   // onSourceChange: SourceSelectorProps['onSourceChange']
// }
export interface UserApiEditModalType {
  show: () => void
}

export default forwardRef<UserApiEditModalType, {}>((props, ref) => {
  const dialogRef = useRef<DialogType>(null)
  // const sourceSelectorRef = useRef<SourceSelectorType>(null)
  // const inputRef = useRef<UrlInputType>(null)
  const [visible, setVisible] = useState(false)
  const theme = useTheme()
  const t = useI18n()

  const handleShow = () => {
    dialogRef.current?.setVisible(true)
    // requestAnimationFrame(() => {
    // inputRef.current?.setText('')
    // sourceSelectorRef.current?.setSource(source)
    // setTimeout(() => {
    //   inputRef.current?.focus()
    // }, 300)
    // })
  }
  useImperativeHandle(ref, () => ({
    show() {
      if (visible) handleShow()
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow()
        })
      }
    },
  }))

  const handleCancel = () => {
    dialogRef.current?.setVisible(false)
  }

  const openFAQPage = () => {
    void openUrl('https://lyswhut.github.io/lx-music-doc/mobile/custom-source')
  }

  return (
    visible
      ? (
          <Dialog ref={dialogRef} bgHide={false}>
            <View style={styles.content}>
              {/* <UrlInput ref={inputRef} /> */}
              <Text size={16} style={styles.title}>{t('user_api_title')}</Text>
              <List />
              <View style={styles.tips}>
                <Text style={styles.tipsText} size={12}>
                  {t('user_api_readme')}
                </Text>
                <TouchableOpacity onPress={openFAQPage}>
                  <Text style={{ ...styles.tipsText, textDecorationLine: 'underline' }} size={12} color={theme['c-primary-font']}>FAQ</Text>
                </TouchableOpacity>
                <View>
                  <Text style={styles.tipsText} size={12}>{t('user_api_note')}</Text>
                </View>
              </View>
            </View>
            <View style={styles.btns}>
              <Button style={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} onPress={handleCancel}>
                <Text size={14} color={theme['c-button-font']}>{t('close')}</Text>
              </Button>
              <ImportBtn btnStyle={{ ...styles.btn, backgroundColor: theme['c-button-background'] }} />
            </View>
          </Dialog>
        ) : null
  )
})


const styles = createStyle({
  content: {
    // flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: 8,
    paddingTop: 15,
    paddingBottom: 10,
    flexDirection: 'column',
  },
  title: {
    marginBottom: 15,
    textAlign: 'center',
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  tips: {
    paddingHorizontal: 7,
    marginTop: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tipsText: {
    marginTop: 8,
    textAlignVertical: 'bottom',
    // lineHeight: 18,
    // backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 15,
    paddingLeft: 15,
    // paddingRight: 15,
  },
  btn: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 4,
    marginRight: 15,
  },
})


