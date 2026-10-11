package com.swmansion.rnscreens

import android.content.Context
import android.content.ContextWrapper
import android.view.View
import android.view.ViewGroup
import android.view.ViewParent
import android.view.inputmethod.InputMethodManager
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.fragment.app.FragmentManager
import androidx.fragment.app.FragmentTransaction
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.ChoreographerCompat
import com.facebook.react.modules.core.ReactChoreographer
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.swmansion.rnscreens.Screen.ActivityState
import com.swmansion.rnscreens.events.ScreenDismissedEvent

open class ScreenContainer(
    context: Context?,
) : ViewGroup(context) {
    @JvmField
    protected val screenWrappers = ArrayList<ScreenFragmentWrapper>()

    @JvmField
    protected var fragmentManager: FragmentManager? = null
    private var isAttached = false
    private var needsUpdate = false
    private var isLayoutEnqueued = false
    private val layoutCallback: ChoreographerCompat.FrameCallback =
        object : ChoreographerCompat.FrameCallback() {
            override fun doFrame(frameTimeNanos: Long) {
                isLayoutEnqueued = false
                measure(
                    MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY),
                    MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY),
                )
                layout(left, top, right, bottom)
            }
        }
    private var parentScreenWrapper: ScreenFragmentWrapper? = null

    override fun onLayout(
        changed: Boolean,
        l: Int,
        t: Int,
        r: Int,
        b: Int,
    ) {
        var i = 0
        val size = childCount
        while (i < size) {
            getChildAt(i).layout(0, 0, width, height)
            i++
        }
    }

    override fun removeView(view: View) {
        // The below block is a workaround for an issue with keyboard handling within fragments. Despite
        // Android handles input focus on the fragments that leave the screen, the keyboard stays open
        // in a number of cases.
        // The workaround is to force-hide keyboard when the screen that has focus is dismissed (we
        // detect that in removeView as super.removeView causes the input view to un-focus while keeping
        // the keyboard open).
        if (view === focusedChild) {
            (context.getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager)
                .hideSoftInputFromWindow(windowToken, InputMethodManager.HIDE_NOT_ALWAYS)
        }
        super.removeView(view)
    }

    override fun requestLayout() {
        super.requestLayout()
        @Suppress("SENSELESS_COMPARISON") // mLayoutCallback can be null here since this method can be called in init
        if (!isLayoutEnqueued && layoutCallback != null) {
            isLayoutEnqueued = true
            // we use NATIVE_ANIMATED_MODULE choreographer queue because it allows us to catch the current
            // looper loop instead of enqueueing the update in the next loop causing a one frame delay.
            ReactChoreographer
                .getInstance()
                .postFrameCallback(
                    ReactChoreographer.CallbackType.NATIVE_ANIMATED_MODULE,
                    layoutCallback,
                )
        }
    }

    val isNested: Boolean
        get() = parentScreenWrapper != null

    fun notifyChildUpdate() {
        performUpdatesNow()
    }

    protected open fun adapt(screen: Screen): ScreenFragmentWrapper = ScreenFragment(screen)

    fun addScreen(
        screen: Screen,
        index: Int,
    ) {
        val fragment = adapt(screen)
        screen.fragmentWrapper = fragment
        screenWrappers.add(index, fragment)
        screen.container = this
        onScreenChanged()
    }

    open fun removeScreenAt(index: Int) {
        screenWrappers[index].screen.container = null
        screenWrappers.removeAt(index)
        onScreenChanged()
    }

    open fun removeAllScreens() {
        for (screenFragment in screenWrappers) {
            screenFragment.screen.container = null
        }
        screenWrappers.clear()
        onScreenChanged()
    }

    val screenCount: Int
        get() = screenWrappers.size

    fun getScreenAt(index: Int): Screen = screenWrappers[index].screen

    fun getScreenFragmentWrapperAt(index: Int): ScreenFragmentWrapper = screenWrappers[index]

    open val topScreen: Screen?
        get() = screenWrappers.firstOrNull { getActivityState(it) === ActivityState.ON_TOP }?.screen

    private fun setFragmentManager(fm: FragmentManager) {
        fragmentManager = fm
        performUpdatesNow()
    }

    private fun findFragmentManagerForReactRootView(rootView: ReactRootView): FragmentManager {
        var context = rootView.context

        // ReactRootView is expected to be initialized with the main React Activity as a context but
        // in case of Expo the activity is wrapped in ContextWrapper and we need to unwrap it
        while (context !is FragmentActivity && context is ContextWrapper) {
            context = context.baseContext
        }

        check(context is FragmentActivity) {
            "In order to use RNScreens components your app's activity need to extend ReactActivity"
        }

        // In case React Native is loaded on a Fragment (not directly in activity) we need to find
        // fragment manager whose fragment's view is ReactRootView. As of now, we detect such case by
        // checking whether any fragments are attached to activity which hosts ReactRootView.
        // See: https://github.com/software-mansion/react-native-screens/issues/1506 on why the cases
        // must be treated separately.
        return if (context.supportFragmentManager.fragments.isEmpty()) {
            // We are in standard React Native application w/o custom native navigation based on fragments.
            context.supportFragmentManager
        } else {
            // We are in some custom setup & we want to use the closest fragment manager in hierarchy.
            // `findFragment` method throws IllegalStateException when it fails to resolve appropriate
            // fragment. It might happen when e.g. React Native is loaded directly in Activity
            // but some custom fragments are still used. Such use case seems highly unlikely
            // so, as for now we fallback to activity's FragmentManager in hope for the best.
            try {
                FragmentManager.findFragment<Fragment>(rootView).childFragmentManager
            } catch (ex: IllegalStateException) {
                context.supportFragmentManager
            }
        }
    }

    private fun setupFragmentManager() {
        var parent: ViewParent = this
        // We traverse view hierarchy up until we find screen parent or a root view
        while (!(parent is ReactRootView || parent is Screen) &&
            parent.parent != null
        ) {
            parent = parent.parent
        }
        // If parent is of type Screen it means we are inside a nested fragment structure.
        // Otherwise we expect to connect directly with root view and get root fragment manager
        if (parent is Screen) {
            checkNotNull(
                parent.fragmentWrapper?.let { fragmentWrapper ->
                    parentScreenWrapper = fragmentWrapper
                    fragmentWrapper.addChildScreenContainer(this)
                    setFragmentManager(fragmentWrapper.fragment.childFragmentManager)
                },
            ) { "Parent Screen does not have its Fragment attached" }
        } else {
            // we expect top level view to be of type ReactRootView, this isn't really necessary but in
            // order to find root view we test if parent is null. This could potentially happen also when
            // the view is detached from the hierarchy and that test would not correctly indicate the root
            // view. So in order to make sure we indeed reached the root we test if it is of a correct type.
            // This allows us to provide a more descriptive error message for the aforementioned case.
            check(parent is ReactRootView) { "ScreenContainer is not attached under ReactRootView" }
            setFragmentManager(findFragmentManagerForReactRootView(parent))
        }
    }

    protected fun createTransaction(): FragmentTransaction =
        requireNotNull(fragmentManager) { "fragment manager is null when creating transaction" }
            .beginTransaction()
            .setReorderingAllowed(true)

    private fun attachScreen(
        transaction: FragmentTransaction,
        fragment: Fragment,
    ) {
        transaction.add(id, fragment)
    }

    fun attachBelowTop() {
        if (screenWrappers.size < 2) {
            throw RuntimeException("[RNScreens] Unable to run transition for less than 2 screens.")
        }
        val transaction = createTransaction()
        val top = topScreen as Screen
        // we have to reattach topScreen so it is on top of the one below
        detachScreen(transaction, top.fragment as Fragment)
        attachScreen(transaction, screenWrappers[screenWrappers.size - 2].fragment)
        attachScreen(transaction, top.fragment as Fragment)
        transaction.commitNowAllowingStateLoss()
    }

    fun detachBelowTop() {
        if (screenWrappers.size < 2) {
            throw RuntimeException("[RNScreens] Unable to run transition for less than 2 screens.")
        }
        val transaction = createTransaction()
        detachScreen(transaction, screenWrappers[screenWrappers.size - 2].fragment)
        transaction.commitNowAllowingStateLoss()
    }

    fun notifyTopDetached() {
        val top = topScreen as Screen
        if (context is ReactContext) {
            val surfaceId = UIManagerHelper.getSurfaceId(context)
            UIManagerHelper
                .getEventDispatcherForReactTag(context as ReactContext, top.id)
                ?.dispatchEvent(ScreenDismissedEvent(surfaceId, top.id))
        }
    }

    private fun detachScreen(
        transaction: FragmentTransaction,
        fragment: Fragment,
    ) {
        transaction.remove(fragment)
    }

    private fun getActivityState(screenFragmentWrapper: ScreenFragmentWrapper): ActivityState? = screenFragmentWrapper.screen.activityState

    open fun hasScreen(screenFragmentWrapper: ScreenFragmentWrapper?): Boolean = screenWrappers.contains(screenFragmentWrapper)

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        isAttached = true
        setupFragmentManager()
    }

    /** Removes fragments from fragment manager that are attached to this container  */
    private fun removeMyFragments(fragmentManager: FragmentManager) {
        val transaction = fragmentManager.beginTransaction()
        var hasFragments = false
        for (fragment in fragmentManager.fragments) {
            if (fragment is ScreenFragment && fragment.screen.container === this) {
                transaction.remove(fragment)
                hasFragments = true
            }
        }

        if (hasFragments) {
            transaction.commitNowAllowingStateLoss()
        }
    }

    override fun onDetachedFromWindow() {
        // if there are pending transactions and this view is about to get detached we need to perform
        // them here as otherwise fragment manager will crash because it won't be able to find container
        // view. We also need to make sure all the fragments attached to the given container are removed
        // from fragment manager as in some cases fragment manager may be reused and in such case it'd
        // attempt to reattach previously registered fragments that are not removed
        fragmentManager?.let {
            if (!it.isDestroyed) {
                removeMyFragments(it)
                it.executePendingTransactions()
            }
        }

        parentScreenWrapper?.removeChildScreenContainer(this)
        parentScreenWrapper = null

        super.onDetachedFromWindow()
        isAttached = false
        // When fragment container view is detached we force all its children to be removed.
        // It is because children screens are controlled by their fragments, which can often have a
        // delayed lifecycle (due to transitions). As a result due to ongoing transitions the fragment
        // may choose not to remove the view despite the parent container being completely detached
        // from the view hierarchy until the transition is over. In such a case when the container gets
        // re-attached while the transition is ongoing, the child view would still be there and we'd
        // attempt to re-attach it to with a misconfigured fragment. This would result in a crash. To
        // avoid it we clear all the children here as we attach all the child fragments when the
        // container is reattached anyways. We don't use `removeAllViews` since it does not check if the
        // children are not already detached, which may lead to calling `onDetachedFromWindow` on them
        // twice.
        // We also get the size earlier, because we will be removing child views in `for` loop.
        for (i in childCount - 1 downTo 0) {
            removeViewAt(i)
        }
    }

    override fun onMeasure(
        widthMeasureSpec: Int,
        heightMeasureSpec: Int,
    ) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec)
        for (i in 0 until childCount) {
            getChildAt(i).measure(widthMeasureSpec, heightMeasureSpec)
        }
    }

    private fun onScreenChanged() {
        // we perform update in `onBeforeLayout` of `ScreensShadowNode` by adding an UIBlock
        // which is called after updating children of the ScreenContainer.
        // We do it there because `onUpdate` logic requires all changes of children to be already
        // made in order to provide proper animation for fragment transition for ScreenStack
        // and this in turn makes nested ScreenContainers detach too early and disappear
        // before transition if also not dispatched after children updates.
        // The exception to this rule is `updateImmediately` which is triggered by actions
        // not connected to React view hierarchy changes, but rather internal events
        needsUpdate = true
        (context as ThemedReactContext).reactApplicationContext.runOnUiQueueThread {
            // We schedule the update here because LayoutAnimations of `react-native-reanimated`
            // sometimes attach/detach screens after the layout block of `ScreensShadowNode` has
            // already run, and we want to update the container then too. In the other cases,
            // this code will do nothing since it will run after the UIBlock when `mNeedUpdate`
            // will already be false.
            performUpdates()
        }
    }

    protected fun performUpdatesNow() {
        // we want to update immediately when the fragment manager is set or native back button
        // dismiss is dispatched or Screen's activityState changes since it is not connected to React
        // view hierarchy changes and will not trigger `onBeforeLayout` method of `ScreensShadowNode`
        needsUpdate = true
        performUpdates()
    }

    fun performUpdates() {
        if (!needsUpdate || !isAttached || fragmentManager == null || fragmentManager?.isDestroyed == true) {
            return
        }
        needsUpdate = false
        onUpdate()
        notifyContainerUpdate()
    }

    open fun onUpdate() {
        createTransaction().let {
            // detach screens that are no longer active
            val orphaned: MutableSet<Fragment> =
                HashSet(
                    requireNotNull(fragmentManager) {
                        "fragment manager is null when performing update in ScreenContainer"
                    }.fragments,
                )
            for (fragmentWrapper in screenWrappers) {
                if (getActivityState(fragmentWrapper) === ActivityState.INACTIVE &&
                    fragmentWrapper.fragment.isAdded
                ) {
                    detachScreen(it, fragmentWrapper.fragment)
                }
                orphaned.remove(fragmentWrapper.fragment)
            }
            if (orphaned.isNotEmpty()) {
                val orphanedAry = orphaned.toTypedArray()
                for (fragment in orphanedAry) {
                    if (fragment is ScreenFragment) {
                        if (fragment.screen.container == null) {
                            detachScreen(it, fragment)
                        }
                    }
                }
            }

            // if there is an "onTop" screen it means the transition has ended
            val transitioning = topScreen == null

            // attach newly activated screens
            var addedBefore = false
            val pendingFront: ArrayList<ScreenFragmentWrapper> = ArrayList()

            for (fragmentWrapper in screenWrappers) {
                val activityState = getActivityState(fragmentWrapper)
                if (activityState !== ActivityState.INACTIVE && !fragmentWrapper.fragment.isAdded) {
                    addedBefore = true
                    attachScreen(it, fragmentWrapper.fragment)
                } else if (activityState !== ActivityState.INACTIVE && addedBefore) {
                    // we detach the screen and then reattach it later to make it appear on front
                    detachScreen(it, fragmentWrapper.fragment)
                    pendingFront.add(fragmentWrapper)
                }
                fragmentWrapper.screen.setTransitioning(transitioning)
            }

            for (screenFragment in pendingFront) {
                attachScreen(it, screenFragment.fragment)
            }

            it.commitNowAllowingStateLoss()
        }
    }

    protected open fun notifyContainerUpdate() {
        topScreen?.fragmentWrapper?.onContainerUpdate()
    }
}
