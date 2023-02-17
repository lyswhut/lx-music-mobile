import { buildActiveThemeColors } from '@/theme/themes'
import state from './state'


export default {
  setTheme(theme: LX.Theme) {
    state.theme = buildActiveThemeColors(theme)
    // ThemeContext.displayName
    global.state_event.themeUpdated(state.theme)
  },
  setShouldUseDarkColors(shouldUseDarkColors: boolean) {
    if (state.shouldUseDarkColors == shouldUseDarkColors) return
    state.shouldUseDarkColors = shouldUseDarkColors
  },
}

