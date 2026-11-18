import { memo } from 'react'
import { StyleSheet } from 'react-native'
import Svg, { Circle, Path, Polygon, Rect } from 'react-native-svg'

import { ART_INK, ART_PALETTES } from '@/newui/theme'
import { hashString } from '@/newui/utils'

/** 封面三色组（c1 渐变起 / c2 渐变止 / c3 纹理点缀），提取自 data.js 的 PALETTES */
export type ArtTriple = readonly [string, string, string]

/** 种子 → 色板：原型 palette(seed) = PALETTES[hash(seed) % 8] */
export const pickArtPalette = (seed: string): ArtTriple =>
  ART_PALETTES[hashString(seed) % ART_PALETTES.length]

/* ============ 程序化纹理（对应原型 app.js 的 svgArt，4 变体按 hash%4 取） ============ */

/** 变体 1 的波形行序号（y = 26 + i * 14） */
const WAVE_ROWS = [0, 1, 2, 3, 4]

/** 变体 2 的点阵坐标（x / y 从 10 到 90，步长 16） */
const DOT_COORDS: ReadonlyArray<readonly [number, number]> = (() => {
  const coords: Array<readonly [number, number]> = []
  for (let x = 10; x <= 90; x += 16) for (let y = 10; y <= 90; y += 16) coords.push([x, y])
  return coords
})()

interface ArtTextureProps {
  seed: string
  palette: ArtTriple
}

/**
 * 封面程序化纹理：铺在渐变底之上、照片之下的装饰层。
 * 坐标 / 透明度 / 线宽逐项对应原型 svgArt()，保证 seed 相同则图案相同。
 * 其中的白色装饰为「图像语义」固定色（ART_INK.fg，对应原型字面量 #fff），不走色板。
 */
export const ArtTexture = memo(({ seed, palette }: ArtTextureProps) => {
  const [c1, , c3] = palette
  const variant = hashString(seed) % 4
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      {variant === 0 && (
        <>
          <Circle cx={70} cy={30} r={26} fill={c3} opacity={0.9} />
          <Circle
            cx={28}
            cy={74}
            r={33}
            fill="none"
            stroke={ART_INK.fg}
            strokeOpacity={0.3}
            strokeWidth={1.4}
          />
          <Circle
            cx={28}
            cy={74}
            r={49}
            fill="none"
            stroke={ART_INK.fg}
            strokeOpacity={0.14}
            strokeWidth={1.2}
          />
        </>
      )}
      {variant === 1 &&
        WAVE_ROWS.map(i => {
          const y = 26 + i * 14
          return (
            <Path
              key={i}
              d={`M-5 ${y} Q25 ${y - 16} 50 ${y} T105 ${y}`}
              fill="none"
              stroke={i % 2 !== 0 ? c3 : ART_INK.fg}
              strokeOpacity={0.22 + i * 0.13}
              strokeWidth={1.4 + i * 0.5}
            />
          )
        })}
      {variant === 2 && (
        <>
          {DOT_COORDS.map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={1.7} fill={ART_INK.fg} fillOpacity={0.34} />
          ))}
          <Rect
            x={16}
            y={44}
            width={54}
            height={54}
            rx={12}
            fill={c3}
            opacity={0.92}
            transform="rotate(-12 43 71)"
          />
        </>
      )}
      {variant === 3 && (
        <>
          <Polygon points="0,100 46,18 100,100" fill={c3} opacity={0.78} />
          <Polygon points="0,100 30,44 64,100" fill={ART_INK.fg} opacity={0.16} />
          <Polygon points="52,100 76,58 100,100" fill={c1} opacity={0.5} />
        </>
      )}
    </Svg>
  )
})

ArtTexture.displayName = 'NewUIArtTexture'
