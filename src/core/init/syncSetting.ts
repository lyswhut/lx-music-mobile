import musicSdk from '@/utils/musicSdk'
import commonActions from '@/store/common/action'
import settingState from '@/store/setting/state'

const handleUpdateSourceNmaes = () => {
  const prefix = settingState.setting['common.sourceNameType'] == 'real' ? 'source_' : 'source_alias_'
  const sourceNames: Record<LX.OnlineSource | 'all', string> = {
    kw: 'kw',
    tx: 'tx',
    kg: 'kg',
    mg: 'mg',
    wy: 'wy',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    all: global.i18n.t(prefix + 'all' as any),
  }
  for (const { id } of musicSdk.sources) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    sourceNames[id as LX.OnlineSource] = global.i18n.t(prefix + id as any)
  }
  commonActions.setSourceNames(sourceNames)
}

export default () => {
  const handleConfigUpdated = (keys: Array<keyof LX.AppSetting>) => {
    if (keys.includes('common.sourceNameType')) handleUpdateSourceNmaes()
  }
  global.state_event.on('configUpdated', handleConfigUpdated)
}
