import React, { memo, useEffect, useState } from 'react'

import themeState, { ThemeContext } from '../theme/state'


export default memo(({ children }: {
  children: React.ReactNode
}) => {
  const [theme, setTheme] = useState(themeState.theme)

  useEffect(() => {
    global.state_event.on('themeUpdated', setTheme)
    return () => {
      global.state_event.off('themeUpdated', setTheme)
    }
  }, [])

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
})
