# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# 抛出异常时保留代码文件名(行号不正确)
-keepattributes SourceFile,LineNumberTable

# Add any project specific keep options here:

-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }


# 排除混淆墨•状态栏歌词相关API
-keep class StatusBarLyric.API.StatusBarLyric {*;}
