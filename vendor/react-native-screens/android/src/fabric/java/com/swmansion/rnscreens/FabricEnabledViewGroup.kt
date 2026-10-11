package com.swmansion.rnscreens

import android.view.ViewGroup
import androidx.annotation.UiThread
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.StateWrapper
import kotlin.math.abs

abstract class FabricEnabledViewGroup(
    context: ReactContext?,
) : ViewGroup(context) {
    private var mStateWrapper: StateWrapper? = null

    private var lastSetWidth = 0f
    private var lastSetHeight = 0f

    fun setStateWrapper(wrapper: StateWrapper?) {
        mStateWrapper = wrapper
    }

    protected fun updateScreenSizeFabric(
        width: Int,
        height: Int,
        headerHeight: Double,
    ) {
        updateState(width, height, headerHeight)
    }

    @UiThread
    fun updateState(
        width: Int,
        height: Int,
        headerHeight: Double,
    ) {
        val realWidth: Float = PixelUtil.toDIPFromPixel(width.toFloat())
        val realHeight: Float = PixelUtil.toDIPFromPixel(height.toFloat())

        // Check incoming state values. If they're already the correct value, return early to prevent
        // infinite UpdateState/SetState loop.
        val delta = 0.9f
        if (abs(lastSetWidth - realWidth) < delta &&
            abs(lastSetHeight - realHeight) < delta
        ) {
            return
        }

        lastSetWidth = realWidth
        lastSetHeight = realHeight
        val map: WritableMap =
            WritableNativeMap().apply {
                putDouble("frameWidth", realWidth.toDouble())
                putDouble("frameHeight", realHeight.toDouble())
                putDouble("contentOffsetX", 0.0)
                putDouble("contentOffsetY", headerHeight)
            }
        mStateWrapper?.updateState(map)
    }
}
