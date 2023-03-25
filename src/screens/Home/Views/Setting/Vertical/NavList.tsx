import React, { forwardRef, useImperativeHandle, useState } from 'react'
import type { SettingScreenIds } from '../Main'

import NavList from '../NavList'

export interface NavListTypeProps {
  onChangeId: (id: SettingScreenIds) => void
}
export interface NavListTypeType {
  show: () => void
}


export default forwardRef<NavListTypeType, NavListTypeProps>(({ onChangeId }, ref) => {
  const [visible, setVisible] = useState(false)

  useImperativeHandle(ref, () => {
    let isInited = false
    return {
      show() {
        if (isInited) return
        requestAnimationFrame(() => {
          setVisible(true)
        })
        isInited = true
      },
    }
  })

  return (
    visible
      ? <NavList onChangeId={onChangeId} />
      : null
  )
})
