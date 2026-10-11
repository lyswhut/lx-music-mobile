package com.swmansion.rnscreens.utils

import android.app.Activity
import android.util.Log
import android.view.View
import androidx.appcompat.widget.Toolbar
import androidx.coordinatorlayout.widget.CoordinatorLayout
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.PixelUtil
import com.google.android.material.appbar.AppBarLayout
import com.swmansion.rnscreens.ScreenStackHeaderConfig
import java.lang.ref.WeakReference

/**
 * This class provides methods to create dummy layout (that mimics Screen setup), and to compute
 * expected header height. It is meant to be accessed from C++ layer via JNI.
 * See https://github.com/software-mansion/react-native-screens/pull/2169
 * for more detailed description of the issue this code solves.
 */
internal class ScreenDummyLayoutHelper(
    reactContext: ReactApplicationContext,
) : LifecycleEventListener {
    // The state required to compute header dimensions. We want this on instance rather than on class
    // for context access & being tied to instance lifetime.
    private lateinit var coordinatorLayout: CoordinatorLayout
    private lateinit var appBarLayout: AppBarLayout
    private lateinit var dummyContentView: View
    private lateinit var toolbar: Toolbar
    private var defaultFontSize: Float = 0f
    private var defaultContentInsetStartWithNavigation: Int = 0

    // LRU with size 1
    private var cache: CacheEntry = CacheEntry.EMPTY

    // We do not want to be responsible for the context lifecycle. If it's null, we're fine.
    // This same context is being passed down to our view components so it is destroyed
    // only if our views also are.
    private var reactContextRef: WeakReference<ReactApplicationContext> =
        WeakReference(reactContext)

    init {
        // We load the library so that we are able to communicate with our C++ code (descriptor & shadow nodes).
        // Basically we leak this object to C++, as its lifecycle should span throughout whole application
        // lifecycle anyway.
        try {
            System.loadLibrary(LIBRARY_NAME)
        } catch (e: UnsatisfiedLinkError) {
            Log.w(TAG, "Failed to load $LIBRARY_NAME")
        }

        weakInstance = WeakReference(this)

        if (!(reactContext.hasCurrentActivity() && maybeInitDummyLayoutWithHeader(reactContext))) {
            reactContext.addLifecycleEventListener(this)
        }
    }

    /**
     * Initializes dummy view hierarchy with CoordinatorLayout, AppBarLayout and dummy View.
     * We utilize this to compute header height (app bar layout height) from C++ layer when its needed.
     *
     * @return boolean whether the layout was initialised or not
     */
    private fun maybeInitDummyLayoutWithHeader(reactContext: ReactApplicationContext): Boolean {
        if (isLayoutInitialized) {
            return true
        }

        if (!reactContext.hasCurrentActivity()) {
            return false
        }

        // We need to use activity here, as react context does not have theme attributes required by
        // AppBarLayout attached leading to crash.
        val contextWithTheme =
            requireNotNull(reactContext.currentActivity) { "[RNScreens] Attempt to use context detached from activity" }

        coordinatorLayout = CoordinatorLayout(contextWithTheme)

        appBarLayout =
            AppBarLayout(contextWithTheme).apply {
                layoutParams =
                    CoordinatorLayout.LayoutParams(
                        CoordinatorLayout.LayoutParams.MATCH_PARENT,
                        CoordinatorLayout.LayoutParams.WRAP_CONTENT,
                    )
            }

        toolbar =
            Toolbar(contextWithTheme).apply {
                title = DEFAULT_HEADER_TITLE
                layoutParams =
                    AppBarLayout
                        .LayoutParams(
                            AppBarLayout.LayoutParams.MATCH_PARENT,
                            AppBarLayout.LayoutParams.WRAP_CONTENT,
                        ).apply { scrollFlags = 0 }
            }

        // We know the title text view will be there, cause we've just set title.
        defaultFontSize = ScreenStackHeaderConfig.findTitleTextViewInToolbar(toolbar)!!.textSize
        defaultContentInsetStartWithNavigation = toolbar.contentInsetStartWithNavigation

        appBarLayout.addView(toolbar)

        dummyContentView =
            View(contextWithTheme).apply {
                layoutParams =
                    CoordinatorLayout.LayoutParams(
                        CoordinatorLayout.LayoutParams.MATCH_PARENT,
                        CoordinatorLayout.LayoutParams.MATCH_PARENT,
                    )
            }

        coordinatorLayout.apply {
            addView(appBarLayout)
            addView(dummyContentView)
        }

        isLayoutInitialized = true
        return true
    }

    /**
     * Triggers layout pass on dummy view hierarchy, taking into consideration selected
     * ScreenStackHeaderConfig props that might have impact on final header height.
     *
     * @param fontSize font size value as passed from JS
     * @return header height in dp as consumed by Yoga
     */
    private fun computeDummyLayout(
        fontSize: Int,
        isTitleEmpty: Boolean,
    ): Float {
        if (!isLayoutInitialized) {
            val reactContext =
                requireReactContext { "[RNScreens] Context was null-ed before dummy layout was initialized" }
            if (!maybeInitDummyLayoutWithHeader(reactContext)) {
                // This theoretically might happen at Fabric + "bridgefull" combination, due to race condition where `reactContext.currentActivity`
                // is still null at this execution point. We don't wanna crash in such case, thus returning zeroed height.
                Log.e(
                    TAG,
                    "[RNScreens] Failed to late-init layout while computing header height. This is a race-condition-bug in react-native-screens, please file an issue at https://github.com/software-mansion/react-native-screens/issues"
                )
                return 0.0f
            }
        }

        if (cache.hasKey(CacheKey(fontSize, isTitleEmpty))) {
            return cache.headerHeight
        }

        val topLevelDecorView = requireActivity().window.decorView

        // These dimensions are not accurate, as they do include status bar & navigation bar, however
        // it is ok for our purposes.
        val decorViewWidth = topLevelDecorView.width
        val decorViewHeight = topLevelDecorView.height

        val widthMeasureSpec =
            View.MeasureSpec.makeMeasureSpec(decorViewWidth, View.MeasureSpec.EXACTLY)
        val heightMeasureSpec =
            View.MeasureSpec.makeMeasureSpec(decorViewHeight, View.MeasureSpec.EXACTLY)

        if (isTitleEmpty) {
            toolbar.title = ""
            toolbar.contentInsetStartWithNavigation = 0
        } else {
            toolbar.title = DEFAULT_HEADER_TITLE
            toolbar.contentInsetStartWithNavigation = defaultContentInsetStartWithNavigation
        }

        val textView = ScreenStackHeaderConfig.findTitleTextViewInToolbar(toolbar)
        textView?.textSize =
            if (fontSize != FONT_SIZE_UNSET) fontSize.toFloat() else defaultFontSize

        coordinatorLayout.measure(widthMeasureSpec, heightMeasureSpec)

        // It seems that measure pass would be enough, however I'm not certain whether there are no
        // scenarios when layout violates measured dimensions.
        coordinatorLayout.layout(0, 0, decorViewWidth, decorViewHeight)

        val headerHeight = PixelUtil.toDIPFromPixel(appBarLayout.height.toFloat())
        cache = CacheEntry(CacheKey(fontSize, isTitleEmpty), headerHeight)
        return headerHeight
    }

    private fun requireReactContext(lazyMessage: (() -> Any)? = null): ReactApplicationContext =
        requireNotNull(
            reactContextRef.get(),
            lazyMessage ?: { "[RNScreens] Attempt to require missing react context" })

    private fun requireActivity(): Activity =
        requireNotNull(requireReactContext().currentActivity) {
            "[RNScreens] Attempt to use context detached from activity"
        }

    companion object {
        const val TAG = "ScreenDummyLayoutHelper"

        const val LIBRARY_NAME = "react_codegen_rnscreens"

        const val FONT_SIZE_UNSET = -1

        private const val DEFAULT_HEADER_TITLE: String = "FontSize123!#$"

        // We access this field from C++ layer, through `getInstance` method.
        // We don't care what instance we get access to as long as it has initialized
        // dummy view hierarchy.
        private var weakInstance = WeakReference<ScreenDummyLayoutHelper>(null)

        @JvmStatic
        fun getInstance(): ScreenDummyLayoutHelper? = weakInstance.get()
    }

    private var isLayoutInitialized = false

    override fun onHostResume() {
        // This is the earliest we have guarantee that the context has a reference to an activity.
        val reactContext = requireReactContext { "[RNScreens] ReactContext missing in onHostResume! This should not happen." }
        check(maybeInitDummyLayoutWithHeader(reactContext)) { "[RNScreens] Failed to initialise dummy layout in onHostResume. This is not expected."}
        reactContext.removeLifecycleEventListener(this)
    }

    override fun onHostPause() = Unit

    override fun onHostDestroy() = Unit
}

private data class CacheKey(
    val fontSize: Int,
    val isTitleEmpty: Boolean,
)

private class CacheEntry(
    val cacheKey: CacheKey,
    val headerHeight: Float,
) {
    fun hasKey(key: CacheKey) = cacheKey.fontSize != Int.MIN_VALUE && cacheKey == key

    companion object {
        val EMPTY = CacheEntry(CacheKey(Int.MIN_VALUE, false), 0f)
    }
}
