import defaultSetting from '@/config/defaultSetting'


interface InitState {
  setting: LX.AppSetting
}

const state: InitState = {
  setting: { ...defaultSetting },
}


export default state
