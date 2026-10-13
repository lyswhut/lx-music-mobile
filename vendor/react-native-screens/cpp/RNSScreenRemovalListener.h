#pragma once

#include <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#include <react/renderer/mounting/MountingOverrideDelegate.h>
#include <react/renderer/mounting/ShadowView.h>

using namespace facebook::react;

struct RNSScreenRemovalListener : public MountingOverrideDelegate {
  std::function<void(int)> listenerFunction_;
  RNSScreenRemovalListener(std::function<void(int)> &&listenerFunction_)
      : listenerFunction_(std::move(listenerFunction_)) {}

  bool shouldOverridePullTransaction() const override;
  std::optional<MountingTransaction> pullTransaction(
      SurfaceId surfaceId,
      MountingTransaction::Number number,
      const TransactionTelemetry &telemetry,
      ShadowViewMutationList mutations) const override;
};
