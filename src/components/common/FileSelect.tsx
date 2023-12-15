import ChoosePath, { type ReadOptions, type ChoosePathType } from '@/components/common/ChoosePath'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

export interface FileSelectType {
  show: (options: ReadOptions, onSelect: typeof noop) => void
}
const noop = (path: string) => {}
export default forwardRef<FileSelectType, {}>((props, ref) => {
  const [visible, setVisible] = useState(false)
  const choosePathRef = useRef<ChoosePathType>(null)
  const onSelectRef = useRef<typeof noop>(noop)
  // console.log('render import export')

  useImperativeHandle(ref, () => ({
    show(options, onSelect) {
      onSelectRef.current = onSelect ?? noop
      if (visible) {
        choosePathRef.current?.show(options)
      } else {
        setVisible(true)
        requestAnimationFrame(() => {
          choosePathRef.current?.show(options)
        })
      }
    },
  }))

  return (
    visible
      ? <ChoosePath ref={choosePathRef} onConfirm={onSelectRef.current} />
      : null
  )
})
