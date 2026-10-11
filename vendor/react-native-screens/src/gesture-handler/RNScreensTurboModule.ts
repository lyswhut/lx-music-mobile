type RNScreensTurboModuleType = {
  startTransition: (stackTag: number) => {
    topScreenTag: number;
    belowTopScreenTag: number;
    canStartTransition: boolean;
  };
  updateTransition: (stackTag: number, progress: number) => void;
  finishTransition: (stackTag: number, isCanceled: boolean) => void;
  disableSwipeBackForTopScreen: (stackTag: number) => void;
};

export const RNScreensTurboModule: RNScreensTurboModuleType = (global as any)
  .RNScreensTurboModule;
