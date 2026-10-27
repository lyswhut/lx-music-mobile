import { useRef, useState } from 'react'
import { Alert, ScrollView, View } from 'react-native'
import Button from '@/components/common/Button'
import CheckBox from '@/components/common/CheckBox'
import Input from '@/components/common/Input'
import Popup, { type PopupType } from '@/components/common/Popup'
import Slider from '@/components/common/Slider'
import Text from '@/components/common/Text'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'
import { useSetting } from '@/store/setting/hook'
import settingState from '@/store/setting/state'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { applySoundEffect, isSoundEffectSupported, useSoundEffectStatus } from '@/plugins/player/soundEffect'
import {
  bandKey, convolutionPresets, convolutionSetting, equalizerPresets, equalizerSetting,
  frequencies, normalizeSoundEffect, parseUserPresets, type UserSoundEffectPreset,
} from '@/plugins/player/soundEffect/config'

const Choice = ({ children, selected = false, disabled = false, onPress, onLongPress }: {
  children: React.ReactNode
  selected?: boolean
  disabled?: boolean
  onPress: () => void
  onLongPress?: () => void
}) => {
  const theme = useTheme()
  return (
    <Button accessibilityRole="button" accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress} onLongPress={onLongPress}
      style={{ ...styles.choice, backgroundColor: selected ? theme['c-primary-alpha-200'] : theme['c-button-background'], borderColor: selected ? theme['c-primary'] : theme['c-primary-alpha-200'] }}>
      <Text size={13} color={selected ? theme['c-primary-font'] : theme['c-button-font']}>{children}</Text>
    </Button>
  )
}

const ValueSlider = ({ label, value, min, max, unit, disabled = false, onChange }: {
  label: string
  value: number
  min: number
  max: number
  unit: string
  disabled?: boolean
  onChange: (value: number) => void
}) => (
  <View style={{ ...styles.sliderRow, opacity: disabled ? 0.4 : 1 }}>
    <Text size={13} style={styles.sliderLabel}>{label}</Text>
    <Slider accessibilityLabel={label} disabled={disabled} minimumValue={min} maximumValue={max} value={value} step={1}
      onValueChange={next => { if (Math.round(next) != value) onChange(Math.round(next)) }} />
    <Text size={12} style={styles.sliderValue}>{value}{unit}</Text>
  </View>
)

const PresetEditor = ({ type }: { type: UserSoundEffectPreset['type'] }) => {
  const t = useI18n()
  const theme = useTheme()
  const setting = useSetting()
  const [name, setName] = useState('')
  const presets = parseUserPresets(setting['player.soundEffect.presets'])
  const list = presets.filter(item => item.type == type)
  const save = () => {
    const all = parseUserPresets(settingState.setting['player.soundEffect.presets'])
    const label = name.trim()
    if (!label || all.filter(p => p.type == type).length >= 31) return
    const config = normalizeSoundEffect(settingState.setting)
    if (type == 'convolution' && !config.source) return
    const preset = { id: Date.now().toString(36) + Math.random().toString(36).slice(2), name: label, type, config }
    updateSetting({ 'player.soundEffect.presets': JSON.stringify([...all, preset]) })
    setName('')
  }
  const remove = (id: string) => {
    Alert.alert(t('sound_effect_remove_preset'), '', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('sound_effect_remove_preset'),
        style: 'destructive',
        onPress: () => {
          const all = parseUserPresets(settingState.setting['player.soundEffect.presets'])
          updateSetting({ 'player.soundEffect.presets': JSON.stringify(all.filter(p => p.id != id)) })
        },
      },
    ])
  }
  return (
    <View>
      <View style={styles.choices}>
        {list.map(preset => (
          <Choice key={preset.id} onLongPress={() => { remove(preset.id) }} onPress={() => {
            updateSetting(type == 'equalizer' ? equalizerSetting(preset.config.gains) : convolutionSetting(preset.config.source, preset.config.dry, preset.config.wet))
          }}>{preset.name}</Choice>
        ))}
      </View>
      {list.length > 0 && <Text size={12} color={theme['c-font-label']}>{t('sound_effect_preset_delete_hint')}</Text>}
      <View style={styles.saveRow}>
        <Input accessibilityLabel={t('sound_effect_preset_name')} placeholder={t('sound_effect_preset_name')} maxLength={32} value={name} onChangeText={setName} />
        <Choice disabled={!name.trim() || list.length >= 31 || (type == 'convolution' && !setting['player.soundEffect.convolution.fileName'])} onPress={save}>{t('sound_effect_save_preset')}</Choice>
      </View>
    </View>
  )
}

const SoundEffectPanel = () => {
  const t = useI18n()
  const theme = useTheme()
  const setting = useSetting()
  const config = normalizeSoundEffect(setting)
  const status = useSoundEffectStatus()
  const translate = (key: string) => t(key as Parameters<typeof t>[0])
  return (
    <View onStartShouldSetResponder={() => true}>
      <Text size={12} color={theme['c-font-label']} style={styles.hint}>{t('sound_effect_pcm_hint')}</Text>
      {status != 'ready' && (
        <View style={styles.status}>
          <Text size={13}>{t(status == 'loading' ? 'sound_effect_loading' : 'sound_effect_failed')}</Text>
          {status == 'error' && <Choice onPress={() => { void applySoundEffect() }}>{t('sound_effect_retry')}</Choice>}
        </View>
      )}
      <View style={styles.section}>
        <View style={styles.header}>
          <CheckBox check={config.equalizer} label={t('sound_effect_equalizer')} onChange={enable => { updateSetting({ 'player.soundEffect.equalizer.enable': enable }) }} />
          <Choice onPress={() => { updateSetting(equalizerSetting(frequencies.map(() => 0))) }}>{t('sound_effect_flat')}</Choice>
        </View>
        {frequencies.map((frequency, i) => (
          <ValueSlider key={frequency} label={frequency < 1000 ? frequency + ' Hz' : frequency / 1000 + ' kHz'} value={config.gains[i]} min={-15} max={15} unit=" dB" disabled={!config.equalizer}
            onChange={value => { updateSetting({ [bandKey(frequency)]: value }) }} />
        ))}
        <View style={styles.choices}>
          {equalizerPresets.map(preset => {
            const gains = frequencies.map(f => Number(preset[('hz' + f) as keyof typeof preset]))
            return <Choice key={preset.name} selected={config.equalizer && gains.every((gain, i) => gain == config.gains[i])}
              onPress={() => { updateSetting(equalizerSetting(gains)) }}>{translate('sound_effect_eq_' + preset.name)}</Choice>
          })}
        </View>
        <PresetEditor type="equalizer" />
      </View>
      <View style={styles.section}>
        <Text size={16} style={styles.title}>{t('sound_effect_convolution')}</Text>
        <View style={styles.choices}>
          <Choice selected={!config.source} onPress={() => { updateSetting({ 'player.soundEffect.convolution.fileName': '' }) }}>{t('sound_effect_off')}</Choice>
          {convolutionPresets.map(preset => (
            <Choice key={preset.name} selected={config.source == preset.source}
              onPress={() => { updateSetting(convolutionSetting(preset.source, preset.mainGain, preset.sendGain)) }}>{translate('sound_effect_ir_' + preset.name)}</Choice>
          ))}
        </View>
        <ValueSlider label={t('sound_effect_dry')} value={Math.round(config.dry * 100)} min={0} max={500} unit="%" disabled={!config.source}
          onChange={value => { updateSetting({ 'player.soundEffect.convolution.mainGain': value / 10 }) }} />
        <ValueSlider label={t('sound_effect_wet')} value={Math.round(config.wet * 100)} min={0} max={500} unit="%" disabled={!config.source}
          onChange={value => { updateSetting({ 'player.soundEffect.convolution.sendGain': value / 10 }) }} />
        <PresetEditor type="convolution" />
      </View>
    </View>
  )
}

export default () => {
  const t = useI18n()
  const ref = useRef<PopupType>(null)
  const [mounted, setMounted] = useState(false)
  if (!isSoundEffectSupported) return null
  const show = () => {
    setMounted(true)
    requestAnimationFrame(() => { ref.current?.setVisible(true) })
  }
  return (
    <View style={styles.entry}>
      <Choice onPress={show}>{t('sound_effect_title')}</Choice>
      {mounted && <Popup ref={ref} title={t('sound_effect_title')}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <SoundEffectPanel />
        </ScrollView>
      </Popup>}
    </View>
  )
}

const styles = createStyle({
  entry: { paddingHorizontal: 15, paddingVertical: 5, alignItems: 'flex-start' },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  section: { paddingVertical: 12 },
  title: { marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', paddingTop: 8 },
  choice: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', minHeight: 40 },
  sliderLabel: { width: 70 },
  sliderValue: { width: 56, textAlign: 'right' },
  saveRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  hint: { paddingVertical: 6, lineHeight: 18 },
  status: { gap: 6, paddingVertical: 6, alignItems: 'flex-start' },
})
