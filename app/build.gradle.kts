plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "cn.toside.music.nativeapp"
    compileSdk = 36
    defaultConfig {
        // Keep the migration build separate from existing installations and their data.
        applicationId = "cn.toside.music.nativeapp"
        minSdk = 28
        targetSdk = 36
        versionCode = providers.gradleProperty("nativeVersionCode").orElse("1").get().toInt().also { require(it > 0) }
        versionName = providers.gradleProperty("nativeVersionName").orElse("0.1.0").get().also { require(it.matches(Regex("\\d+\\.\\d+\\.\\d+"))) }
        testInstrumentationRunner = "cn.toside.music.nativeapp.NativeTestRunner"
    }
    val signingVariables = listOf("NATIVE_KEYSTORE_PATH", "NATIVE_STORE_PASSWORD", "NATIVE_KEY_ALIAS", "NATIVE_KEY_PASSWORD")
    val signingValues = signingVariables.map { providers.environmentVariable(it).orNull }
    require(signingValues.all { it.isNullOrBlank() } || signingValues.none { it.isNullOrBlank() }) {
        "Provide all native release signing environment variables, or none."
    }
    val hasReleaseSigning = signingValues.none { it.isNullOrBlank() }
    require(providers.gradleProperty("nativeRequireSigning").orNull != "true" || hasReleaseSigning) {
        "Native release signing credentials are required."
    }
    if (hasReleaseSigning) signingConfigs.create("nativeRelease") {
        storeFile = file(signingValues[0]!!)
        storePassword = signingValues[1]
        keyAlias = signingValues[2]
        keyPassword = signingValues[3]
    }
    buildTypes.getByName("release") {
        if (hasReleaseSigning) signingConfig = signingConfigs.getByName("nativeRelease")
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation("net.jthink:jaudiotagger:3.0.1")
    implementation("androidx.core:core:1.18.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("wang.harlon.quickjs:wrapper-android:3.2.3")
    implementation("androidx.media3:media3-exoplayer:1.10.1")
    implementation("androidx.media3:media3-datasource-okhttp:1.10.1")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test:runner:1.5.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
}
