package com.swmansion.rnscreens

import android.view.ViewGroup
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.StateWrapper

abstract class FabricEnabledViewGroup(
    context: ReactContext?,
) : ViewGroup(context) {
    fun setStateWrapper(wrapper: StateWrapper?) = Unit

    protected fun updateScreenSizeFabric(
        width: Int,
        height: Int,
        headerHeight: Double,
    ) {
        // do nothing
    }
}
