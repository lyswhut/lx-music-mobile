import React, { useRef, forwardRef } from 'react'
// import { View } from 'react-native'

import Panel, { type PanelType } from './Panel'
import Button, { type BtnType } from '@/components/common/Button'


export interface DorpDownPanelProps {
  onHide?: () => void
  children: React.ReactNode | React.ReactNode[]
  PanelContent: React.ReactNode | React.ReactNode[]
}
export interface DorpDownPanelType {
  hide: () => void
}

export default forwardRef<DorpDownPanelType, DorpDownPanelProps>(({
  children,
  PanelContent,
  onHide,
}) => {
  const buttonRef = useRef<BtnType>(null)
  const panelRef = useRef<PanelType>(null)

  const showMenu = () => {
    buttonRef.current?.measure((fx, fy, width, height, px, py) => {
      // console.log(fx, fy, width, height, px, py)
      panelRef.current?.show({ x: Math.ceil(px), y: Math.ceil(py), w: Math.ceil(width), h: Math.ceil(height) })
    })
  }

  return (
    <Button ref={buttonRef} onPress={showMenu}>
      {children}
      <Panel ref={panelRef} onHide={onHide}>
        {PanelContent}
      </Panel>
    </Button>
  )
})
