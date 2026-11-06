import { requireNativeComponent, type StyleProp, type ViewStyle } from 'react-native'

interface Props {
  startColor: string
  endColor: string
  style?: StyleProp<ViewStyle>
}

const NativeLinearGradient = requireNativeComponent<Props>('LinearGradientView')

/**
 * 原生垂直线性渐变，颜色平滑过渡，无横纹
 */
export default ({ startColor, endColor, style }: Props) => (
  <NativeLinearGradient startColor={startColor} endColor={endColor} style={style} />
)
