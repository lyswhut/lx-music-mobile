package com.swmansion.rnscreens

import com.facebook.react.fabric.FabricUIManager

class NativeProxy {
    // do nothing on Paper
    fun nativeAddMutationsListener(fabricUIManager: FabricUIManager) = Unit

    companion object {
        fun addScreenToMap(
            tag: Int,
            view: Screen,
        ) = Unit

        fun removeScreenFromMap(tag: Int) = Unit

        fun clearMapOnInvalidate() = Unit
    }
}
