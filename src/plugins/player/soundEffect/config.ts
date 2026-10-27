import presets from '@/config/soundEffectPresets.json'

export const frequencies = presets.frequencies
export const equalizerPresets = presets.equalizer
export const convolutionPresets = presets.convolution
export type BandKey = Extract<keyof LX.AppSetting, `player.soundEffect.biquadFilter.hz${number}`>

export interface SoundEffectConfig {
  equalizer: boolean
  gains: number[]
  source: string
  dry: number
  wet: number
}

const finite = (value: unknown, fallback: number, min: number, max: number) => {
  return typeof value == 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
}

export const bandKey = (frequency: number) => ('player.soundEffect.biquadFilter.hz' + frequency) as BandKey

export const normalizeSoundEffect = (setting: Partial<LX.AppSetting>): SoundEffectConfig => ({
  equalizer: setting['player.soundEffect.equalizer.enable'] === true,
  gains: frequencies.map(f => finite(setting[bandKey(f)], 0, -15, 15)),
  source: convolutionPresets.some(p => p.source === setting['player.soundEffect.convolution.fileName']) ? setting['player.soundEffect.convolution.fileName']! : '',
  dry: finite(setting['player.soundEffect.convolution.mainGain'], 10, 0, 50) / 10,
  wet: finite(setting['player.soundEffect.convolution.sendGain'], 10, 0, 50) / 10,
})

export const equalizerSetting = (gains: number[]): Partial<LX.AppSetting> => Object.fromEntries([
  ['player.soundEffect.equalizer.enable', true],
  ...frequencies.map((f, i) => [bandKey(f), finite(gains[i], 0, -15, 15)]),
])

export const convolutionSetting = (source: string, dry: number, wet: number): Partial<LX.AppSetting> => ({
  'player.soundEffect.convolution.fileName': source,
  'player.soundEffect.convolution.mainGain': Math.round(dry * 100) / 10,
  'player.soundEffect.convolution.sendGain': Math.round(wet * 100) / 10,
})

export interface UserSoundEffectPreset {
  id: string
  name: string
  type: 'equalizer' | 'convolution'
  config: SoundEffectConfig
}

export const parseUserPresets = (text: string): UserSoundEffectPreset[] => {
  try {
    const parsed: unknown = JSON.parse(text)
    if (!Array.isArray(parsed)) return []
    const ids = new Set<string>()
    const counts = { equalizer: 0, convolution: 0 }
    return parsed.filter((item): item is UserSoundEffectPreset => {
      if (!item || typeof item != 'object' || typeof item.id != 'string' || ids.has(item.id as string) ||
        typeof item.name != 'string' || !item.name.trim() || item.name.length > 32 ||
        (item.type != 'equalizer' && item.type != 'convolution') || !item.config ||
        !Array.isArray(item.config.gains) || item.config.gains.length !== frequencies.length ||
        item.config.gains.some((gain: unknown) => typeof gain != 'number' || !Number.isFinite(gain) || Math.abs(gain) > 15) ||
        typeof item.config.equalizer != 'boolean' ||
        typeof item.config.dry != 'number' || !Number.isFinite(item.config.dry) || item.config.dry < 0 || item.config.dry > 5 ||
        typeof item.config.wet != 'number' || !Number.isFinite(item.config.wet) || item.config.wet < 0 || item.config.wet > 5 ||
        typeof item.config.source != 'string' ||
        (item.config.source && !convolutionPresets.some(p => p.source === item.config.source))) return false
      const type = item.type as UserSoundEffectPreset['type']
      if (counts[type] >= 31) return false
      counts[type]++
      ids.add(item.id as string)
      return true
    })
  } catch { return [] }
}
