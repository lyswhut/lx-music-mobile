import React, { memo, useEffect, useState } from 'react'

import themeState, { ThemeContext } from '../theme/state'


export default memo(({ children }: {
  children: React.ReactNode
}) => {
  const [theme, setTheme] = useState(themeState.theme)

  useEffect(() => {
    const handleUpdateTheme = (theme: LX.ActiveTheme) => {
      requestAnimationFrame(() => {
        setTheme(theme)
      })
    }
    global.state_event.on('themeUpdated', handleUpdateTheme)
    return () => {
      global.state_event.off('themeUpdated', handleUpdateTheme)
    }
  }, [])

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
})
