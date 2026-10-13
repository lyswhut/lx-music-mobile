#include "RNSScreenRemovalListener.h"
#include <react/renderer/mounting/ShadowViewMutation.h>
using namespace facebook::react;

std::optional<MountingTransaction> RNSScreenRemovalListener::pullTransaction(
    SurfaceId surfaceId,
    MountingTransaction::Number transactionNumber,
    const TransactionTelemetry &telemetry,
    ShadowViewMutationList mutations) const {
  for (const ShadowViewMutation &mutation : mutations) {
    if (mutation.type == ShadowViewMutation::Type::Remove &&
        mutation.oldChildShadowView.componentName != nullptr &&
        strcmp(mutation.parentShadowView.componentName, "RNSScreenStack") ==
            0) {
      listenerFunction_(mutation.oldChildShadowView.tag);
    }
  }

  return MountingTransaction{
      surfaceId, transactionNumber, std::move(mutations), telemetry};
}

bool RNSScreenRemovalListener::shouldOverridePullTransaction() const {
  return true;
}
