import React from 'react';
import { Freeze } from 'react-freeze';

interface FreezeWrapperProps {
  freeze: boolean;
  children: React.ReactNode;
}

// This component allows one more render before freezing the screen.
// Allows activityState to reach the native side and useIsFocused to work correctly.
function DelayedFreeze({ freeze, children }: FreezeWrapperProps) {
  // flag used for determining whether freeze should be enabled
  const [freezeState, setFreezeState] = React.useState(false);

  React.useEffect(() => {
    const id = setImmediate(() => {
      setFreezeState(freeze);
    });
    return () => {
      clearImmediate(id);
    };
  }, [freeze]);

  return <Freeze freeze={freeze ? freezeState : false}>{children}</Freeze>;
}

export default DelayedFreeze;
