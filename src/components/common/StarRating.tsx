import { memo, useCallback, useMemo } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'

export default memo(({ star, size = 14, editable = false, onChange }: {
  star: number
  size?: number
  editable?: boolean
  onChange?: (star: number) => void
}) => {
  const theme = useTheme()

  const handleClick = useCallback((index: number) => {
    if (!editable || !onChange) return
    // 再次点击同一颗星 → 取消评级（回到 0）
    const newStar = star === index + 1 ? 0 : index + 1
    onChange(newStar)
  }, [editable, onChange, star])

  const filledColor = theme['c-primary']
  const emptyColor = theme['c-font-label']

  const stars = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const filled = i < star
      return (
        <TouchableOpacity
          key={i}
          activeOpacity={editable ? 0.6 : 1}
          onPress={() => handleClick(i)}
          disabled={!editable}
          style={styles.starBtn}
        >
          <Text
            size={size}
            color={filled ? filledColor : emptyColor}
          >
            {filled ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      )
    })
  }, [star, size, filledColor, emptyColor, editable, handleClick])

  return (
    <View style={styles.container}>
      {stars}
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starBtn: {
    padding: 4,
  },
})
