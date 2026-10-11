package com.swmansion.rnscreens

import android.util.Log
import com.facebook.react.bridge.JSApplicationIllegalArgumentException
import com.facebook.react.common.MapBuilder
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.RNSSearchBarManagerDelegate
import com.facebook.react.viewmanagers.RNSSearchBarManagerInterface
import com.swmansion.rnscreens.events.SearchBarBlurEvent
import com.swmansion.rnscreens.events.SearchBarChangeTextEvent
import com.swmansion.rnscreens.events.SearchBarCloseEvent
import com.swmansion.rnscreens.events.SearchBarFocusEvent
import com.swmansion.rnscreens.events.SearchBarOpenEvent
import com.swmansion.rnscreens.events.SearchBarSearchButtonPressEvent

@ReactModule(name = SearchBarManager.REACT_CLASS)
class SearchBarManager :
    ViewGroupManager<SearchBarView>(),
    RNSSearchBarManagerInterface<SearchBarView> {
    private val delegate: ViewManagerDelegate<SearchBarView>

    init {
        delegate = RNSSearchBarManagerDelegate<SearchBarView, SearchBarManager>(this)
    }

    protected override fun getDelegate(): ViewManagerDelegate<SearchBarView> = delegate

    override fun getName(): String = REACT_CLASS

    override fun createViewInstance(context: ThemedReactContext): SearchBarView = SearchBarView(context)

    override fun onAfterUpdateTransaction(view: SearchBarView) {
        super.onAfterUpdateTransaction(view)
        view.onUpdate()
    }

    @ReactProp(name = "autoCapitalize")
    override fun setAutoCapitalize(
        view: SearchBarView,
        autoCapitalize: String?,
    ) {
        view.autoCapitalize =
            when (autoCapitalize) {
                null, "none" -> SearchBarView.SearchBarAutoCapitalize.NONE
                "words" -> SearchBarView.SearchBarAutoCapitalize.WORDS
                "sentences" -> SearchBarView.SearchBarAutoCapitalize.SENTENCES
                "characters" -> SearchBarView.SearchBarAutoCapitalize.CHARACTERS
                else -> throw JSApplicationIllegalArgumentException(
                    "Forbidden auto capitalize value passed",
                )
            }
    }

    @ReactProp(name = "autoFocus")
    fun setAutoFocus(
        view: SearchBarView,
        autoFocus: Boolean?,
    ) {
        view.autoFocus = autoFocus ?: false
    }

    @ReactProp(name = "barTintColor", customType = "Color")
    override fun setBarTintColor(
        view: SearchBarView,
        color: Int?,
    ) {
        view.tintColor = color
    }

    @ReactProp(name = "disableBackButtonOverride")
    override fun setDisableBackButtonOverride(
        view: SearchBarView,
        disableBackButtonOverride: Boolean,
    ) {
        view.shouldOverrideBackButton = disableBackButtonOverride != true
    }

    @ReactProp(name = "inputType")
    override fun setInputType(
        view: SearchBarView,
        inputType: String?,
    ) {
        view.inputType =
            when (inputType) {
                null, "text" -> SearchBarView.SearchBarInputTypes.TEXT
                "phone" -> SearchBarView.SearchBarInputTypes.PHONE
                "number" -> SearchBarView.SearchBarInputTypes.NUMBER
                "email" -> SearchBarView.SearchBarInputTypes.EMAIL
                else -> throw JSApplicationIllegalArgumentException(
                    "Forbidden input type value",
                )
            }
    }

    @ReactProp(name = "placeholder")
    override fun setPlaceholder(
        view: SearchBarView,
        placeholder: String?,
    ) {
        if (placeholder != null) {
            view.placeholder = placeholder
        }
    }

    @ReactProp(name = "textColor", customType = "Color")
    override fun setTextColor(
        view: SearchBarView,
        color: Int?,
    ) {
        view.textColor = color
    }

    @ReactProp(name = "headerIconColor", customType = "Color")
    override fun setHeaderIconColor(
        view: SearchBarView,
        color: Int?,
    ) {
        view.headerIconColor = color
    }

    @ReactProp(name = "hintTextColor", customType = "Color")
    override fun setHintTextColor(
        view: SearchBarView,
        color: Int?,
    ) {
        view.hintTextColor = color
    }

    @ReactProp(name = "shouldShowHintSearchIcon")
    override fun setShouldShowHintSearchIcon(
        view: SearchBarView,
        shouldShowHintSearchIcon: Boolean,
    ) {
        view.shouldShowHintSearchIcon = shouldShowHintSearchIcon ?: true
    }

    override fun getExportedCustomDirectEventTypeConstants(): Map<String, Any>? =
        MapBuilder.of(
            SearchBarBlurEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onSearchBlur"),
            SearchBarChangeTextEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onChangeText"),
            SearchBarCloseEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onClose"),
            SearchBarFocusEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onSearchFocus"),
            SearchBarOpenEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onOpen"),
            SearchBarSearchButtonPressEvent.EVENT_NAME,
            MapBuilder.of("registrationName", "onSearchButtonPress"),
        )

    companion object {
        const val REACT_CLASS = "RNSSearchBar"
    }

    private fun logNotAvailable(propName: String) {
        Log.w("[RNScreens]", "$propName prop is not available on Android")
    }

    // NativeCommands

    override fun blur(view: SearchBarView?) {
        view?.handleBlurJsRequest()
    }

    override fun focus(view: SearchBarView?) {
        view?.handleFocusJsRequest()
    }

    override fun clearText(view: SearchBarView?) {
        view?.handleClearTextJsRequest()
    }

    override fun toggleCancelButton(
        view: SearchBarView?,
        flag: Boolean,
    ) {
        view?.handleToggleCancelButtonJsRequest(flag)
    }

    override fun setText(
        view: SearchBarView?,
        text: String?,
    ) {
        view?.handleSetTextJsRequest(text)
    }

    override fun cancelSearch(view: SearchBarView?) {
        view?.handleFocusJsRequest()
    }

    // iOS only

    override fun setPlacement(
        view: SearchBarView,
        placeholder: String?,
    ) {
        logNotAvailable("setPlacement")
    }

    override fun setHideWhenScrolling(
        view: SearchBarView?,
        value: Boolean,
    ) {
        logNotAvailable("hideWhenScrolling")
    }

    override fun setObscureBackground(
        view: SearchBarView?,
        value: Boolean,
    ) {
        logNotAvailable("hideNavigationBar")
    }

    override fun setHideNavigationBar(
        view: SearchBarView?,
        value: Boolean,
    ) {
        logNotAvailable("hideNavigationBar")
    }

    override fun setCancelButtonText(
        view: SearchBarView?,
        value: String?,
    ) {
        logNotAvailable("cancelButtonText")
    }

    override fun setTintColor(
        view: SearchBarView?,
        value: Int?,
    ) {
        logNotAvailable("tintColor")
    }
}
