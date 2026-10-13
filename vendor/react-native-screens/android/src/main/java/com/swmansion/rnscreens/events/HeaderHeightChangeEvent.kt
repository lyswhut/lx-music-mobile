package com.swmansion.rnscreens.events

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

class HeaderHeightChangeEvent(
    surfaceId: Int,
    viewId: Int,
    private val headerHeight: Double,
) : Event<HeaderHeightChangeEvent>(surfaceId, viewId) {
    override fun getEventName() = EVENT_NAME

    // As the same header height could appear twice, use header height as a coalescing key.
    override fun getCoalescingKey(): Short = headerHeight.toInt().toShort()

    override fun getEventData(): WritableMap? =
        Arguments.createMap().apply {
            putDouble("headerHeight", headerHeight)
        }

    companion object {
        const val EVENT_NAME = "topHeaderHeightChange"
    }
}
