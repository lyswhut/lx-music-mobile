package com.swmansion.rnscreens

import android.annotation.SuppressLint
import android.content.Context
import androidx.appcompat.widget.Toolbar

// This class is used to store config closer to search bar
@SuppressLint("ViewConstructor") // Only we construct this view, it is never inflated.
open class CustomToolbar(
    context: Context,
    val config: ScreenStackHeaderConfig,
) : Toolbar(context)
