import { ComponentBuilderContext, RNOHPackage } from '@rnoh/react-native-openharmony';
import { RNCSlider } from '@react-native-oh-tpl/slider';

@Builder
function sliderBuilder(ctx: ComponentBuilderContext) {
  RNCSlider({ ctx: ctx.rnComponentContext, tag: ctx.tag });
}

export class HarmonySliderPackage extends RNOHPackage {
  createWrappedCustomRNComponentBuilderByComponentNameMap(): Map<string, WrappedBuilder<[ComponentBuilderContext]>> {
    return new Map<string, WrappedBuilder<[ComponentBuilderContext]>>().set('RNCSlider', wrapBuilder(sliderBuilder));
  }
}
