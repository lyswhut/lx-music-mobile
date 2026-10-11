package com.swmansion.rnscreens.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

class ScreenTransitionProgressEvent(
    surfaceId: Int,
    viewId: Int,
    private val progress: Float,
    private val isClosing: Boolean,
    private val isGoingForward: Boolean,
    private val coalescingKey: Short,
) : Event<ScreenTransitionProgressEvent>(surfaceId, viewId) {
    override fun getEventName(): String = EVENT_NAME

    override fun getCoalescingKey(): Short = coalescingKey

    override fun getEventData(): WritableMap? =
        Arguments.createMap().apply {
            putDouble("progress", progress.toDouble())
            putInt("closing", if (isClosing) 1 else 0)
            putInt("goingForward", if (isGoingForward) 1 else 0)
        }

    companion object {
        const val EVENT_NAME = "topTransitionProgress"
    }
}
