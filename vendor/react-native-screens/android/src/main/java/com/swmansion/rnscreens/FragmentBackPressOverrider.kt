package com.swmansion.rnscreens

import androidx.activity.OnBackPressedCallback
import androidx.fragment.app.Fragment

class FragmentBackPressOverrider(
    private val fragment: Fragment,
    private val onBackPressedCallback: OnBackPressedCallback,
) {
    private var isCallbackAdded: Boolean = false
    var overrideBackAction: Boolean = true

    fun maybeAddBackCallback() {
        if (!isCallbackAdded && overrideBackAction) {
            fragment.activity?.onBackPressedDispatcher?.addCallback(
                fragment,
                onBackPressedCallback,
            )
            isCallbackAdded = true
        }
    }

    fun removeBackCallbackIfAdded() {
        if (isCallbackAdded) {
            onBackPressedCallback.remove()
            isCallbackAdded = false
        }
    }
}
