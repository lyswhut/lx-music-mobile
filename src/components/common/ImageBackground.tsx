// https://github.com/facebook/react-native/blob/main/packages/react-native/Libraries/Image/ImageBackground.js
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import React, { forwardRef } from 'react'
import {
  View,
  StyleSheet,
  Image,
} from 'react-native'
import type { ImageBackgroundProps as _ImageBackgroundProps } from 'react-native'


/**
 * Very simple drop-in replacement for <Image> which supports nesting views.
 *
 * ```ReactNativeWebPlayer
 * import React, { Component } from 'react';
 * import { AppRegistry, View, ImageBackground, Text } from 'react-native';
 *
 * class DisplayAnImageBackground extends Component {
 *   render() {
 *     return (
 *       <ImageBackground
 *         style={{width: 50, height: 50}}
 *         source={{uri: 'https://reactnative.dev/img/opengraph.png'}}
 *       >
 *         <Text>React</Text>
 *       </ImageBackground>
 *     );
 *   }
 * }
 *
 * // App registration and rendering
 * AppRegistry.registerComponent('DisplayAnImageBackground', () => DisplayAnImageBackground);
 * ```
 */

export type ImageBackgroundType = View

export interface ImageBackgroundProps extends Omit<_ImageBackgroundProps, 'source'> {
  source?: _ImageBackgroundProps['source'] | null
}

export default forwardRef<View, ImageBackgroundProps>(({
  children,
  style,
  imageStyle,
  imageRef,
  importantForAccessibility,
  source,
  ...props
}, ref) => {
  const flattenedStyle = StyleSheet.flatten(style)
  return (
    <View
      accessibilityIgnoresInvertColors={true}
      importantForAccessibility={importantForAccessibility}
      ref={ref}
      style={style}>
      {
        source == null ? null : (
          <Image
            {...props}
            source={source}
            importantForAccessibility={importantForAccessibility}
            style={[
              StyleSheet.absoluteFill,
              {
                // Temporary Workaround:
                // Current (imperfect yet) implementation of <Image> overwrites width and height styles
                // (which is not quite correct), and these styles conflict with explicitly set styles
                // of <ImageBackground> and with our internal layout model here.
                // So, we have to proxy/reapply these styles explicitly for actual <Image> component.
                // This workaround should be removed after implementing proper support of
                // intrinsic content size of the <Image>.
                width: flattenedStyle?.width,
                height: flattenedStyle?.height,
              },
              imageStyle,
            ]}
            ref={imageRef}
          />
        )
      }
      {children}
    </View>
  )
})
