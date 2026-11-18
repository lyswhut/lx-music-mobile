import { memo, useEffect, useMemo, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'

import { ART_INK, MOTION, PLAYER, RADIUS, SHADOW } from '@/newui/theme'
import { withAlpha } from '@/newui/utils'

import { Art } from '../Art'

export interface DiscArtProps {
  /** 正在出声才转；暂停停在当前角度继续（原型 .spin-paused 是冻结在同一角度） */
  playing: boolean
  /** 封面种子（同歌曲行口径：'album:' + 专辑名） */
  artSeed: string
  /** 封面图地址；无图时 Art 画程序化底 */
  artUri?: string
}

/**
 * 播放页唱片（对应原型 .disc，styles.css L524-532）：
 * 206px 全圆封面 + 8px 内圈刻纹 + 中心孔 + 外圈高光，播放时 22s 匀速自转。
 * 近似点：原型是 CSS infinite animation；RN 无 reanimated 依赖，这里用链式
 * Animated.timing（JS 驱动）模拟——暂停记住角度、恢复接着转，一圈接一圈无缝续播。
 */
export const DiscArt = memo(({ playing, artSeed, artUri }: DiscArtProps) => {
  const spin = useRef(new Animated.Value(0)).current
  const playingRef = useRef(playing)
  const animRef = useRef<Animated.CompositeAnimation | null>(null)
  // 动画值的本地数值镜像：useNativeDriver:false 下 addListener（公开 API）每帧回调，
  // 用它替代 Animated.Value 未暴露类型的内部方法 __getValue
  const spinValueRef = useRef(0)

  useEffect(() => {
    const id = spin.addListener(state => {
      spinValueRef.current = state.value
    })
    return () => {
      spin.removeListener(id)
    }
  }, [spin])

  const rotate = useMemo(
    () => spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }),
    [spin],
  )

  useEffect(() => {
    playingRef.current = playing
    if (!playing) {
      animRef.current?.stop()
      return undefined
    }
    const run = () => {
      if (!playingRef.current) return
      const from = spinValueRef.current
      // 从中断的角度接着转，剩余行程按同角速度折算时长
      const anim = Animated.timing(spin, {
        toValue: 1,
        duration: Math.max(50, MOTION.discSpin * (1 - from)),
        easing: Easing.linear,
        useNativeDriver: false, // rotate 走 JS 驱动：spinValueRef 镜像依赖 JS 侧逐帧回调
      })
      animRef.current = anim
      anim.start(({ finished }) => {
        if (finished && playingRef.current) {
          spin.setValue(0)
          run()
        }
      })
    }
    run()
    return () => {
      animRef.current?.stop()
    }
  }, [playing, spin])

  const size = PLAYER.discSize
  const hole = Math.round(size * PLAYER.discHoleRatio)

  return (
    <View style={[styles.shell, { width: size, height: size }, SHADOW.card]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
        <Art width={size} height={size} radius={RADIUS.full} seed={artSeed} imageUri={artUri} />
        {/* .disc::after 中心孔（inset 38% → 直径 24%，居中） */}
        <View
          style={[
            styles.hole,
            {
              left: (size - hole) / 2,
              top: (size - hole) / 2,
              width: hole,
              height: hole,
              backgroundColor: withAlpha(ART_INK.veil, PLAYER.discHoleAlpha),
              borderColor: withAlpha(ART_INK.fg, PLAYER.discHoleRingAlpha),
            },
          ]}
        />
      </Animated.View>
      {/* 内圈刻纹（inset 0 0 0 8px rgba(0,0,0,.35)）与外圈 1px 高光：压在盘面上，不占布局 */}
      <View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            borderWidth: PLAYER.discInnerRing,
            borderColor: withAlpha(ART_INK.veil, PLAYER.discInnerRingAlpha),
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[styles.ring, { borderWidth: 1, borderColor: withAlpha(ART_INK.fg, PLAYER.discRingAlpha) }]}
      />
    </View>
  )
})

DiscArt.displayName = 'NewUIDiscArt'

const DISC_RADIUS = PLAYER.discSize / 2

const styles = StyleSheet.create({
  shell: {
    borderRadius: DISC_RADIUS,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hole: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  ring: {
    // absoluteFillObject 自带 position:'absolute'，不再单独重复声明
    ...StyleSheet.absoluteFillObject,
    borderRadius: DISC_RADIUS,
  },
})
