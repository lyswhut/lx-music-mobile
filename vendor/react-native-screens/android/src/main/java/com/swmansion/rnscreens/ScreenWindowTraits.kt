package com.swmansion.rnscreens

import android.animation.ArgbEvaluator
import android.animation.ValueAnimator
import android.annotation.TargetApi
import android.app.Activity
import android.content.pm.ActivityInfo
import android.graphics.Color
import android.os.Build
import android.view.ViewParent
import androidx.core.graphics.Insets
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.react.bridge.GuardedRunnable
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UiThreadUtil
import com.swmansion.rnscreens.Screen.WindowTraits

object ScreenWindowTraits {
    // Methods concerning statusBar management were taken from `react-native`'s status bar module:
    // https://github.com/facebook/react-native/blob/master/ReactAndroid/src/main/java/com/facebook/react/modules/statusbar/StatusBarModule.java
    private var didSetOrientation = false
    private var didSetStatusBarAppearance = false
    private var didSetNavigationBarAppearance = false
    private var defaultStatusBarColor: Int? = null

    internal fun applyDidSetOrientation() {
        didSetOrientation = true
    }

    internal fun applyDidSetStatusBarAppearance() {
        didSetStatusBarAppearance = true
    }

    internal fun applyDidSetNavigationBarAppearance() {
        didSetNavigationBarAppearance = true
    }

    internal fun setOrientation(
        screen: Screen,
        activity: Activity?,
    ) {
        if (activity == null) {
            return
        }
        val screenForOrientation = findScreenForTrait(screen, WindowTraits.ORIENTATION)
        val orientation = screenForOrientation?.screenOrientation ?: ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        activity.requestedOrientation = orientation
    }

    internal fun setColor(
        screen: Screen,
        activity: Activity?,
        context: ReactContext?,
    ) {
        if (activity == null || context == null) {
            return
        }
        if (defaultStatusBarColor == null) {
            defaultStatusBarColor = activity.window.statusBarColor
        }
        val screenForColor = findScreenForTrait(screen, WindowTraits.COLOR)
        val screenForAnimated = findScreenForTrait(screen, WindowTraits.ANIMATED)
        val color = screenForColor?.statusBarColor ?: defaultStatusBarColor
        val animated = screenForAnimated?.isStatusBarAnimated ?: false

        UiThreadUtil.runOnUiThread(
            object : GuardedRunnable(context.exceptionHandler) {
                override fun runGuarded() {
                    val window = activity.window
                    val curColor: Int = window.statusBarColor
                    val colorAnimation = ValueAnimator.ofObject(ArgbEvaluator(), curColor, color)
                    colorAnimation.addUpdateListener { animator ->
                        window.statusBarColor = animator.animatedValue as Int
                    }
                    if (animated) {
                        colorAnimation.setDuration(300).startDelay = 0
                    } else {
                        colorAnimation.setDuration(0).startDelay = 300
                    }
                    colorAnimation.start()
                }
            },
        )
    }

    internal fun setStyle(
        screen: Screen,
        activity: Activity?,
        context: ReactContext?,
    ) {
        if (activity == null || context == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return
        }
        val screenForStyle = findScreenForTrait(screen, WindowTraits.STYLE)
        val style = screenForStyle?.statusBarStyle ?: "light"

        UiThreadUtil.runOnUiThread {
            val decorView = activity.window.decorView
            val window = activity.window
            val controller = WindowInsetsControllerCompat(window, decorView)

            controller.isAppearanceLightStatusBars = style == "dark"
        }
    }

    internal fun setTranslucent(
        screen: Screen,
        activity: Activity?,
        context: ReactContext?,
    ) {
        if (activity == null || context == null) {
            return
        }
        val screenForTranslucent = findScreenForTrait(screen, WindowTraits.TRANSLUCENT)
        val translucent = screenForTranslucent?.isStatusBarTranslucent ?: false
        UiThreadUtil.runOnUiThread(
            object : GuardedRunnable(context.exceptionHandler) {
                @TargetApi(Build.VERSION_CODES.LOLLIPOP)
                override fun runGuarded() {
                    // If the status bar is translucent hook into the window insets calculations
                    // and consume all the top insets so no padding will be added under the status bar.
                    val decorView = activity.window.decorView
                    if (translucent) {
                        ViewCompat.setOnApplyWindowInsetsListener(decorView) { v, insets ->
                            val defaultInsets = ViewCompat.onApplyWindowInsets(v, insets)

                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                                val windowInsets =
                                    defaultInsets.getInsets(WindowInsetsCompat.Type.statusBars())

                                WindowInsetsCompat
                                    .Builder()
                                    .setInsets(
                                        WindowInsetsCompat.Type.statusBars(),
                                        Insets.of(
                                            windowInsets.left,
                                            0,
                                            windowInsets.right,
                                            windowInsets.bottom,
                                        ),
                                    ).build()
                            } else {
                                defaultInsets.replaceSystemWindowInsets(
                                    defaultInsets.systemWindowInsetLeft,
                                    0,
                                    defaultInsets.systemWindowInsetRight,
                                    defaultInsets.systemWindowInsetBottom,
                                )
                            }
                        }
                    } else {
                        ViewCompat.setOnApplyWindowInsetsListener(decorView, null)
                    }
                    ViewCompat.requestApplyInsets(decorView)
                }
            },
        )
    }

    internal fun setHidden(
        screen: Screen,
        activity: Activity?,
    ) {
        if (activity == null) {
            return
        }
        val screenForHidden = findScreenForTrait(screen, WindowTraits.HIDDEN)
        val hidden = screenForHidden?.isStatusBarHidden ?: false
        val window = activity.window
        val controller = WindowInsetsControllerCompat(window, window.decorView)

        UiThreadUtil.runOnUiThread {
            if (hidden) {
                controller.hide(WindowInsetsCompat.Type.statusBars())
            } else {
                controller.show(WindowInsetsCompat.Type.statusBars())
            }
        }
    }

    // Methods concerning navigationBar management were taken from `react-native-navigation`'s repo:
    // https://github.com/wix/react-native-navigation/blob/9bb70d81700692141a2c505c081c2d86c7f9c66e/lib/android/app/src/main/java/com/reactnativenavigation/utils/SystemUiUtils.kt
    internal fun setNavigationBarColor(
        screen: Screen,
        activity: Activity?,
    ) {
        if (activity == null) {
            return
        }

        val window = activity.window

        val screenForNavBarColor = findScreenForTrait(screen, WindowTraits.NAVIGATION_BAR_COLOR)
        val color = screenForNavBarColor?.navigationBarColor ?: window.navigationBarColor

        UiThreadUtil.runOnUiThread {
            WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightNavigationBars =
                isColorLight(color)
        }
        window.navigationBarColor = color
    }

    internal fun setNavigationBarTranslucent(
        screen: Screen,
        activity: Activity?,
    ) {
        if (activity == null) {
            return
        }

        val window = activity.window

        val screenForNavBarTranslucent = findScreenForTrait(screen, WindowTraits.NAVIGATION_BAR_TRANSLUCENT)
        val translucent = screenForNavBarTranslucent?.isNavigationBarTranslucent ?: false

        // Following method controls whether to display edge-to-edge content that draws behind the navigation bar
        WindowCompat.setDecorFitsSystemWindows(window, !translucent)
    }

    internal fun setNavigationBarHidden(
        screen: Screen,
        activity: Activity?,
    ) {
        if (activity == null) {
            return
        }

        val window = activity.window

        val screenForNavBarHidden = findScreenForTrait(screen, WindowTraits.NAVIGATION_BAR_HIDDEN)
        val hidden = screenForNavBarHidden?.isNavigationBarHidden ?: false

        if (hidden) {
            WindowInsetsControllerCompat(window, window.decorView).let { controller ->
                controller.hide(WindowInsetsCompat.Type.navigationBars())
                controller.systemBarsBehavior =
                    WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            WindowInsetsControllerCompat(
                window,
                window.decorView,
            ).show(WindowInsetsCompat.Type.navigationBars())
        }
    }

    internal fun trySetWindowTraits(
        screen: Screen,
        activity: Activity?,
        context: ReactContext?,
    ) {
        if (didSetOrientation) {
            setOrientation(screen, activity)
        }
        if (didSetStatusBarAppearance) {
            setColor(screen, activity, context)
            setStyle(screen, activity, context)
            setTranslucent(screen, activity, context)
            setHidden(screen, activity)
        }
        if (didSetNavigationBarAppearance) {
            setNavigationBarColor(screen, activity)
            setNavigationBarTranslucent(screen, activity)
            setNavigationBarHidden(screen, activity)
        }
    }

    private fun findScreenForTrait(
        screen: Screen,
        trait: WindowTraits,
    ): Screen? {
        val childWithTrait = childScreenWithTraitSet(screen, trait)
        if (childWithTrait != null) {
            return childWithTrait
        }
        return if (checkTraitForScreen(screen, trait)) {
            screen
        } else {
            // if there is no child with trait set and this screen has no trait set, we look for a parent
            // that has the trait set
            findParentWithTraitSet(screen, trait)
        }
    }

    private fun findParentWithTraitSet(
        screen: Screen,
        trait: WindowTraits,
    ): Screen? {
        var parent: ViewParent? = screen.container
        while (parent != null) {
            if (parent is Screen) {
                if (checkTraitForScreen(parent, trait)) {
                    return parent
                }
            }
            parent = parent.parent
        }
        return null
    }

    private fun childScreenWithTraitSet(
        screen: Screen?,
        trait: WindowTraits,
    ): Screen? {
        screen?.fragmentWrapper?.let {
            for (sc in it.childScreenContainers) {
                // we check only the top screen for the trait
                val topScreen = sc.topScreen
                val child = childScreenWithTraitSet(topScreen, trait)
                if (child != null) {
                    return child
                }
                if (topScreen != null && checkTraitForScreen(topScreen, trait)) {
                    return topScreen
                }
            }
        }
        return null
    }

    private fun checkTraitForScreen(
        screen: Screen,
        trait: WindowTraits,
    ): Boolean =
        when (trait) {
            WindowTraits.ORIENTATION -> screen.screenOrientation != null
            WindowTraits.COLOR -> screen.statusBarColor != null
            WindowTraits.STYLE -> screen.statusBarStyle != null
            WindowTraits.TRANSLUCENT -> screen.isStatusBarTranslucent != null
            WindowTraits.HIDDEN -> screen.isStatusBarHidden != null
            WindowTraits.ANIMATED -> screen.isStatusBarAnimated != null
            WindowTraits.NAVIGATION_BAR_COLOR -> screen.navigationBarColor != null
            WindowTraits.NAVIGATION_BAR_TRANSLUCENT -> screen.isNavigationBarTranslucent != null
            WindowTraits.NAVIGATION_BAR_HIDDEN -> screen.isNavigationBarHidden != null
        }

    private fun isColorLight(color: Int): Boolean {
        val darkness: Double =
            1 - (0.299 * Color.red(color) + 0.587 * Color.green(color) + 0.114 * Color.blue(color)) / 255
        return darkness < 0.5
    }
}
