package cn.toside.music.nativeapp

import android.content.Context
import android.view.MotionEvent
import android.widget.LinearLayout
import kotlin.math.abs

/** Horizontal page gestures leave vertical lists, system edges and player seeking alone. */
internal class HomeNavigationLayout(context: Context) : LinearLayout(context) {
    var eligible: (Float) -> Boolean = { false }
    var navigate: (Int) -> Unit = {}
    private var startX = 0f
    private var startY = 0f
    private var tracking = false
    private var dragging = false
    private val distance get() = 48 * resources.displayMetrics.density
    override fun onInterceptTouchEvent(event: MotionEvent): Boolean {
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                startX = event.x; startY = event.y; dragging = false
                tracking = eligible(startY) && startX > distance / 2 && startX < width - distance / 2
            }
            MotionEvent.ACTION_POINTER_DOWN, MotionEvent.ACTION_CANCEL -> { tracking = false; dragging = false }
            MotionEvent.ACTION_MOVE -> if (tracking) {
                val dx = abs(event.x - startX); val dy = abs(event.y - startY)
                if (dy > distance && dy > dx) tracking = false
                if (dx > distance && dx > dy * 2) { dragging = true; return true }
            }
        }
        return dragging || super.onInterceptTouchEvent(event)
    }
    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (tracking && event.actionMasked == MotionEvent.ACTION_MOVE) {
            val dx = abs(event.x - startX); val dy = abs(event.y - startY)
            if (dy > distance && dy > dx) tracking = false
            else if (dx > distance && dx > dy * 2) dragging = true
        }
        val accepted = tracking || dragging
        if (!accepted) return super.onTouchEvent(event)
        if (event.actionMasked == MotionEvent.ACTION_UP) {
            val dx = event.x - startX
            if (dragging && abs(dx) > distance) navigate(if (dx < 0) 1 else -1)
            else performClick()
            tracking = false; dragging = false
        } else if (event.actionMasked == MotionEvent.ACTION_CANCEL) { tracking = false; dragging = false }
        return true
    }
    override fun performClick(): Boolean = super.performClick()
}
