import { useRef, useImperativeHandle, forwardRef, useState, useMemo } from 'react'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Text from '@/components/common/Text'
import { View, TouchableOpacity } from 'react-native'
import Input, { type InputType } from '@/components/common/Input'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { type Source } from '@/store/songlist/state'
import songlistState from '@/store/songlist/state'
import { useSettingValue } from '@/store/setting/hook'

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

const SourceTabBar = ({ sources, activeSource, onSourceChange }: { sources: Source[], activeSource: Source, onSourceChange: (source: Source) => void }) => {
  const theme = useTheme()
  const sourceNameType = useSettingValue('common.sourceNameType')
  const t = useI18n()

  const sourceList = useMemo(() => {
    return sources.map(s => ({ label: t(`source_${sourceNameType}_${s}`), id: s }))
  }, [sources, sourceNameType, t])

  return (
    <View style={styles.sourceBar}>
      {sourceList.map((item, index) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.sourceButton, index < sourceList.length - 1 ? styles.sourceButtonGap : null]}
          onPress={() => onSourceChange(item.id)}
        >
          <Text
            size={13}
            style={{
              ...styles.sourceButtonText,
              borderBottomColor: activeSource === item.id ? theme['c-primary-background-active'] : 'transparent',
              fontWeight: activeSource === item.id ? 'bold' : 'normal',
            }}
            color={activeSource === item.id ? theme['c-primary-font-active'] : theme['c-font']}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}


export interface ModalProps {
  onOpenId: (id: string) => void
  onSourceChange?: (source: Source) => void
}
export interface ModalType {
  show: (source: Source) => void
}

export default forwardRef<ModalType, ModalProps>(({ onOpenId, onSourceChange }, ref) => {
  const alertRef = useRef<ConfirmAlertType>(null)
  const inputRef = useRef<IdInputType>(null)
  const [visible, setVisible] = useState(false)
  const [source, setSource] = useState<Source>('kw')
  const theme = useTheme()
  const t = useI18n()

  const handleShow = (initSource: Source) => {
    setSource(initSource)
    alertRef.current?.setVisible(true)
    requestAnimationFrame(() => {
      inputRef.current?.setText('')
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    })
  }
  useImperativeHandle(ref, () => ({
    show(initSource) {
      if (visible) handleShow(initSource)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow(initSource)
        })
      }
    },
  }))

  const handleSourceChange = (newSource: Source) => {
    setSource(newSource)
    onSourceChange?.(newSource)
  }

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
            <SourceTabBar sources={songlistState.sources} activeSource={source} onSourceChange={handleSourceChange} />
            <View style={styles.col}>
              <IdInput ref={inputRef} />
            </View>
            <View style={{ ...styles.inputTipCard, backgroundColor: 'rgba(76, 175, 80, 0.1)' }}>
              <Text size={13} color={theme['c-600']}>{t('songlist_open_input_tip')}</Text>
            </View>
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
  sourceBar: {
    height: 32,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 2,
    paddingRight: 2,
  },
  sourceButtonGap: {
    marginRight: 8,
  },
  sourceButtonText: {
    textAlign: 'center',
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 3,
    paddingBottom: 3,
    borderBottomWidth: 2,
  },
  col: {
    flexDirection: 'row',
    height: 38,
  },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 290,
    height: '100%',
  },
  inputTipCard: {
    marginTop: 15,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: 8,
  },
})