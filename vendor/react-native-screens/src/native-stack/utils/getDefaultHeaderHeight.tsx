import { Platform } from 'react-native';
import { StackPresentationTypes } from 'react-native-screens';
type Layout = { width: number; height: number };

const formSheetModalHeight = 56;

export default function getDefaultHeaderHeight(
  layout: Layout,
  statusBarHeight: number,
  stackPresentation: StackPresentationTypes,
  isLargeHeader = false,
): number {
  // default header heights
  let headerHeight = Platform.OS === 'android' ? 56 : 64;

  if (Platform.OS === 'ios') {
    const isLandscape = layout.width > layout.height;
    const isFormSheetModal =
      stackPresentation === 'modal' || stackPresentation === 'formSheet';
    if (isFormSheetModal && !isLandscape) {
      // `modal` and `formSheet` presentations do not take whole screen, so should not take the inset.
      statusBarHeight = 0;
    }

    if (Platform.isPad || Platform.isTV) {
      headerHeight = isFormSheetModal ? formSheetModalHeight : 50;
    } else {
      if (isLandscape) {
        headerHeight = 32;
      } else {
        if (isFormSheetModal) {
          headerHeight = formSheetModalHeight;
        } else {
          headerHeight = isLargeHeader ? 96 : 44;
        }
      }
    }
  }

  return headerHeight + statusBarHeight;
}
