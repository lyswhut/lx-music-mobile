import * as React from 'react';
import ReanimatedTransitionProgressContext from './ReanimatedTransitionProgressContext';

export default function useReanimatedTransitionProgress() {
  const progress = React.useContext(ReanimatedTransitionProgressContext);

  if (progress === undefined) {
    throw new Error(
      "Couldn't find values for reanimated transition progress. Are you inside a screen in Native Stack?",
    );
  }

  return progress;
}
