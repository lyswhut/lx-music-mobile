/**
 * RNOH 宿主 Ability —— 继承 RNAbility，由 RNOH 托管 RN 运行时的生命周期。
 */
import { RNAbility } from '@rnoh/react-native-openharmony';

export default class EntryAbility extends RNAbility {
  protected override getPagePath() {
    return 'pages/Index';
  }

  protected override getRNOHWorkerScriptUrl() {
    return 'entry/ets/workers/RNOHWorker.ets';
  }
}
