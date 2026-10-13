package com.swmansion.rnscreens

import android.view.View
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.LayoutShadowNode
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.RNSScreenStackManagerDelegate
import com.facebook.react.viewmanagers.RNSScreenStackManagerInterface
import com.swmansion.rnscreens.events.StackFinishTransitioningEvent

@ReactModule(name = ScreenStackViewManager.REACT_CLASS)
class ScreenStackViewManager :
    ViewGroupManager<ScreenStack>(),
    RNSScreenStackManagerInterface<ScreenStack> {
    private val delegate: ViewManagerDelegate<ScreenStack>

    init {
        delegate = RNSScreenStackManagerDelegate<ScreenStack, ScreenStackViewManager>(this)
    }

    override fun getName() = REACT_CLASS

    override fun createViewInstance(reactContext: ThemedReactContext) = ScreenStack(reactContext)

    override fun addView(
        parent: ScreenStack,
        child: View,
        index: Int,
    ) {
        require(child is Screen) { "Attempt attach child that is not of type RNScreen" }
        NativeProxy.addScreenToMap(child.id, child)
        parent.addScreen(child, index)
    }

    override fun removeViewAt(
        parent: ScreenStack,
        index: Int,
    ) {
        val screen = parent.getScreenAt(index)
        prepareOutTransition(screen)
        parent.removeScreenAt(index)
        NativeProxy.removeScreenFromMap(screen.id)
    }

    private fun prepareOutTransition(screen: Screen?) {
        screen?.startRemovalTransition()
    }

    override fun invalidate() {
        super.invalidate()
        NativeProxy.clearMapOnInvalidate()
    }

    override fun getChildCount(parent: ScreenStack) = parent.screenCount

    override fun getChildAt(
        parent: ScreenStack,
        index: Int,
    ): View = parent.getScreenAt(index)

    override fun createShadowNodeInstance(context: ReactApplicationContext): LayoutShadowNode = ScreensShadowNode(context)

    override fun needsCustomLayoutForChildren() = true

    protected override fun getDelegate(): ViewManagerDelegate<ScreenStack> = delegate

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
        mutableMapOf(
            StackFinishTransitioningEvent.EVENT_NAME to mutableMapOf("registrationName" to "onFinishTransitioning"),
        )

    companion object {
        const val REACT_CLASS = "RNSScreenStack"
    }
}
