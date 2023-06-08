import { useDimensions } from '@/utils/hooks'
import React from 'react'
import Vertical from './Vertical'
import Horizontal from './Horizontal'
// import { AppColors } from '@/theme'

export default () => {
  const { window } = useDimensions()

  return window.height > window.width
    ? <Vertical />
    : <Horizontal />
}
