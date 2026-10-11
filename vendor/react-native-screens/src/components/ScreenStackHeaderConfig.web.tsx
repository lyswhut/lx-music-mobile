import { Image, ImageProps, View, ViewProps } from 'react-native';
import React from 'react';
import {
  HeaderSubviewTypes,
  ScreenStackHeaderConfigProps,
  SearchBarProps,
} from 'react-native-screens';

export const ScreenStackHeaderBackButtonImage = (
  props: ImageProps,
): JSX.Element => (
  <View>
    <Image resizeMode="center" fadeDuration={0} {...props} />
  </View>
);

export const ScreenStackHeaderRightView = (
  props: React.PropsWithChildren<ViewProps>,
): JSX.Element => <View {...props} />;

export const ScreenStackHeaderLeftView = (
  props: React.PropsWithChildren<ViewProps>,
): JSX.Element => <View {...props} />;

export const ScreenStackHeaderCenterView = (
  props: React.PropsWithChildren<ViewProps>,
): JSX.Element => <View {...props} />;

export const ScreenStackHeaderSearchBarView = (
  props: React.PropsWithChildren<Omit<SearchBarProps, 'ref'>>,
): JSX.Element => <View {...props} />;

export const ScreenStackHeaderConfig = (
  props: React.PropsWithChildren<ScreenStackHeaderConfigProps>,
): JSX.Element => <View {...props} />;

export const ScreenStackHeaderSubview: React.ComponentType<
  React.PropsWithChildren<ViewProps & { type?: HeaderSubviewTypes }>
> = View;
