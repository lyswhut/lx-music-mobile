import React, { PropsWithChildren } from 'react';
import { GestureProviderProps } from '../types';

// context to be used when the user wants full screen swipe (see `gesture-handler` folder in repo)
export const GHContext = React.createContext(
  (props: PropsWithChildren<GestureProviderProps>) => <>{props.children}</>,
);
