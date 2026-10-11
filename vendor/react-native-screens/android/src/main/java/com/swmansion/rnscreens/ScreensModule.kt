package com.swmansion.rnscreens

import android.util.Log
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.common.UIManagerType
import com.swmansion.rnscreens.events.ScreenTransitionProgressEvent
import java.util.concurrent.atomic.AtomicBoolean

@ReactModule(name = ScreensModule.NAME)
class ScreensModule(
    private val reactContext: ReactApplicationContext,
) : NativeScreensModuleSpec(reactContext) {
    private var topScreenId: Int = -1
    private val isActiveTransition = AtomicBoolean(false)
    private var proxy: NativeProxy? = null

    init {
        try {
            System.loadLibrary("rnscreens")
            val jsContext = reactApplicationContext.javaScriptContextHolder
            if (jsContext != null) {
                nativeInstall(jsContext.get())
            } else {
                Log.e("[RNScreens]", "Could not install JSI bindings.")
            }
        } catch (exception: UnsatisfiedLinkError) {
            Log.w("[RNScreens]", "Could not load RNScreens module.")
        }
    }

    private external fun nativeInstall(jsiPtr: Long)

    override fun initialize() {
        super.initialize()
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            val fabricUIManager =
                UIManagerHelper.getUIManager(reactContext, UIManagerType.FABRIC) as FabricUIManager
            proxy =
                NativeProxy().apply {
                    nativeAddMutationsListener(fabricUIManager)
                }
        }
    }

    override fun getName(): String = NAME

    @DoNotStrip
    private fun startTransition(reactTag: Int?): IntArray {
        UiThreadUtil.assertOnUiThread()
        if (isActiveTransition.get() || reactTag == null) {
            return intArrayOf(-1, -1)
        }
        topScreenId = -1
        val result = intArrayOf(-1, -1)
        val uiManager = UIManagerHelper.getUIManagerForReactTag(reactContext, reactTag)
        val stack = uiManager?.resolveView(reactTag)
        if (stack is ScreenStack) {
            val fragments = stack.fragments
            val screensCount = fragments.size
            if (screensCount > 1) {
                isActiveTransition.set(true)
                stack.attachBelowTop()
                topScreenId = fragments[screensCount - 1].screen.id
                result[0] = topScreenId
                result[1] = fragments[screensCount - 2].screen.id
            }
        }
        return result
    }

    @DoNotStrip
    private fun updateTransition(progress: Double) {
        UiThreadUtil.assertOnUiThread()
        if (topScreenId == -1) {
            return
        }
        val progressFloat = progress.toFloat()
        val coalescingKey = ScreenFragment.getCoalescingKey(progressFloat)
        UIManagerHelper
            .getEventDispatcherForReactTag(reactContext, topScreenId)
            ?.dispatchEvent(
                ScreenTransitionProgressEvent(
                    UIManagerHelper.getSurfaceId(reactContext),
                    topScreenId,
                    progressFloat,
                    true,
                    true,
                    coalescingKey,
                ),
            )
    }

    @DoNotStrip
    private fun finishTransition(
        reactTag: Int?,
        canceled: Boolean,
    ) {
        UiThreadUtil.assertOnUiThread()
        if (!isActiveTransition.get() || reactTag == null) {
            Log.e(
                "[RNScreens]",
                "Unable to call `finishTransition` method before transition start.",
            )
            return
        }
        val uiManager = UIManagerHelper.getUIManagerForReactTag(reactContext, reactTag)
        val stack = uiManager?.resolveView(reactTag)
        if (stack is ScreenStack) {
            if (canceled) {
                stack.detachBelowTop()
            } else {
                stack.notifyTopDetached()
            }
            isActiveTransition.set(false)
        }
        topScreenId = -1
    }

    companion object {
        const val NAME = "RNSModule"
    }
}
