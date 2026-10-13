package com.swmansion.rnscreens

import android.annotation.SuppressLint
import android.content.Context
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.widget.SearchView
import androidx.fragment.app.Fragment

@SuppressLint("ViewConstructor") // Only we construct this view, it is never inflated.
class CustomSearchView(
    context: Context,
    fragment: Fragment,
) : SearchView(context) {
    /*
        CustomSearchView uses some variables from SearchView. They are listed below with links to documentation
        isIconified - https://developer.android.com/reference/android/widget/SearchView#setIconified(boolean)
        maxWidth - https://developer.android.com/reference/android/widget/SearchView#setMaxWidth(int)
        setOnSearchClickListener - https://developer.android.com/reference/android/widget/SearchView#setOnSearchClickListener(android.view.View.OnClickListener)
        setOnCloseListener - https://developer.android.com/reference/android/widget/SearchView#setOnCloseListener(android.widget.SearchView.OnCloseListener)
     */
    private var onCloseListener: OnCloseListener? = null
    private var onSearchClickedListener: OnClickListener? = null

    private var onBackPressedCallback: OnBackPressedCallback =
        object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                isIconified = true
            }
        }

    private val backPressOverrider = FragmentBackPressOverrider(fragment, onBackPressedCallback)

    var overrideBackAction: Boolean
        set(value) {
            backPressOverrider.overrideBackAction = value
        }
        get() = backPressOverrider.overrideBackAction

    fun focus() {
        isIconified = false
        requestFocusFromTouch()
    }

    fun clearText() = setQuery("", false)

    fun setText(text: String) = setQuery(text, false)

    fun cancelSearch() {
        clearText()
        setIconified(true)
    }

    override fun setOnCloseListener(listener: OnCloseListener?) {
        onCloseListener = listener
    }

    override fun setOnSearchClickListener(listener: OnClickListener?) {
        onSearchClickedListener = listener
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (!isIconified) {
            backPressOverrider.maybeAddBackCallback()
        }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        backPressOverrider.removeBackCallbackIfAdded()
    }

    init {
        super.setOnSearchClickListener { v ->
            onSearchClickedListener?.onClick(v)
            backPressOverrider.maybeAddBackCallback()
        }

        super.setOnCloseListener {
            val result = onCloseListener?.onClose() ?: false
            backPressOverrider.removeBackCallbackIfAdded()
            result
        }

        maxWidth = Integer.MAX_VALUE
    }
}
