package com.swmansion.rnscreens

import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = ModalScreenViewManager.REACT_CLASS)
class ModalScreenViewManager : ScreenViewManager() {
    override fun getName() = REACT_CLASS

    companion object {
        const val REACT_CLASS = "RNSModalScreen"
    }
}
