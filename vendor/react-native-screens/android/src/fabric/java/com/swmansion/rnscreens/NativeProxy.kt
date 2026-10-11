package com.swmansion.rnscreens

import android.util.Log
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.fabric.FabricUIManager
import java.lang.ref.WeakReference
import java.util.concurrent.ConcurrentHashMap

class NativeProxy {
    @DoNotStrip
    @Suppress("unused")
    private val mHybridData: HybridData

    init {
        mHybridData = initHybrid()
    }

    private external fun initHybrid(): HybridData

    external fun nativeAddMutationsListener(fabricUIManager: FabricUIManager)

    companion object {
        // we use ConcurrentHashMap here since it will be read on the JS thread,
        // and written to on the UI thread.
        private val viewsMap = ConcurrentHashMap<Int, WeakReference<Screen>>()

        fun addScreenToMap(
            tag: Int,
            view: Screen,
        ) {
            viewsMap[tag] = WeakReference(view)
        }

        fun removeScreenFromMap(tag: Int) {
            viewsMap.remove(tag)
        }

        fun clearMapOnInvalidate() {
            viewsMap.clear()
        }
    }

    @DoNotStrip
    public fun notifyScreenRemoved(screenTag: Int) {
        val screen = viewsMap[screenTag]?.get()
        if (screen is Screen) {
            screen.startRemovalTransition()
        } else {
            Log.w("[RNScreens]", "Did not find view with tag $screenTag.")
        }
    }
}
