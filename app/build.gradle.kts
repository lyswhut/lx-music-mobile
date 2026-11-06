import com.android.build.api.variant.impl.VariantOutputImpl
import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val localProperties = Properties().apply {
    val propertiesFile = rootProject.file("local.properties")
    if (propertiesFile.isFile) propertiesFile.reader(Charsets.UTF_8).use { load(it) }
}
val releaseSigningValues = listOf("NATIVE_STORE_PASSWORD", "NATIVE_KEY_ALIAS", "NATIVE_KEY_PASSWORD")
    .associateWith { localProperties.getProperty(it) }
val releaseKeystore = rootProject.file(
    localProperties.getProperty("NATIVE_KEYSTORE_PATH")?.takeIf { it.isNotBlank() } ?: "NewKeyStrore.jks"
)
val validateNativeReleaseSigning = tasks.register("validateNativeReleaseSigning") {
    group = "verification"
    description = "Checks local.properties and the keystore before building a release."
    val missingProperties = releaseSigningValues.filterValues { it.isNullOrBlank() }.keys.toList()
    val keystore = releaseKeystore
    doLast {
        if (missingProperties.isNotEmpty() || !keystore.isFile) {
            throw GradleException(buildString {
                appendLine("Release 签名配置不完整，无法构建。请检查仓库根目录的 local.properties：")
                if (missingProperties.isNotEmpty()) {
                    appendLine("缺少或为空的配置项：${missingProperties.joinToString()}")
                }
                if (!keystore.isFile) {
                    appendLine("签名文件不存在：$keystore")
                    appendLine("请放入 NewKeyStrore.jks，或设置 NATIVE_KEYSTORE_PATH（相对仓库根目录或绝对路径）。")
                }
                append("配置示例见 RELEASING.md；local.properties 和密钥文件已被 Git 忽略。")
            })
        }
    }
}

android {
    namespace = "cn.toside.music.nativeapp"
    compileSdk = 36
    defaultConfig {
        // Keep the migration build separate from existing installations and their data.
        applicationId = "cn.toside.music.nativeapp"
        minSdk = 28
        targetSdk = 36
        versionCode = providers.gradleProperty("nativeVersionCode").get().toInt().also { require(it > 0) }
        versionName = providers.gradleProperty("nativeVersionName").get().also { require(it.matches(Regex("\\d+\\.\\d+\\.\\d+"))) }
        testInstrumentationRunner = "cn.toside.music.nativeapp.NativeTestRunner"
    }
    signingConfigs.create("nativeRelease") {
        storeFile = releaseKeystore
        storePassword = releaseSigningValues["NATIVE_STORE_PASSWORD"]
        keyAlias = releaseSigningValues["NATIVE_KEY_ALIAS"]
        keyPassword = releaseSigningValues["NATIVE_KEY_PASSWORD"]
    }
    buildTypes.getByName("release") {
        signingConfig = signingConfigs.getByName("nativeRelease")
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

androidComponents {
    onVariants(selector().withBuildType("release")) { variant ->
        variant.outputs.forEach { output ->
            // AGP 8.13 exposes APK filenames on its output implementation.
            (output as VariantOutputImpl).outputFileName.set(
                output.versionName.map { "lx-music-native-v$it.apk" }
            )
        }
    }
}

tasks.matching { it.name == "preReleaseBuild" || it.name == "validateSigningRelease" }.configureEach {
    dependsOn(validateNativeReleaseSigning)
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
