import * as React from 'react';
import ReanimatedHeaderHeightContext from './ReanimatedHeaderHeightContext';
export default function useReanimatedHeaderHeight() {
  const height = React.useContext(ReanimatedHeaderHeightContext);
  if (height === undefined) {
    throw new Error("Couldn't find the header height using Reanimated. Are you inside a screen in a navigator with a header and your NavigationContainer is wrapped in ReanimatedScreenProvider?");
  }
  return height;
}
//# sourceMappingURL=useReanimatedHeaderHeight.js.map