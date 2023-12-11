// 修补依赖源码以使vite构建的依赖恢复正常工作

const fs = require('node:fs')
const path = require('node:path')

const rootPath = path.join(__dirname, './')

const patchs = [
  [
    path.join(rootPath, './node_modules/react-native-navigation/lib/android/app/build.gradle'),
    `
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_1_8
    }`,
    '',
  ],
  [
    path.join(rootPath, './node_modules/react-native-navigation/lib/android/app/src/main/java/com/reactnativenavigation/viewcontrollers/stack/topbar/button/ButtonPresenter.kt'),
    `override fun onInitializeAccessibilityNodeInfo(
                        host: View?,
                        info: AccessibilityNodeInfoCompat?
                    ) {
                        super.onInitializeAccessibilityNodeInfo(host, info)

                        // Expose the testID prop as the resource-id name of the view. Black-box E2E/UI testing
                        // frameworks, which interact with the UI through the accessibility framework, do not have
                        // access to view tags. This allows developers/testers to avoid polluting the
                        // content-description with test identifiers.
                        val testId = host?.tag as String?
                        if(testId != null){
                            info!!.viewIdResourceName = testId
                        }
                    }`,
    `override fun onInitializeAccessibilityNodeInfo(
                      host: View,
                      info: AccessibilityNodeInfoCompat
                    ) {
                        super.onInitializeAccessibilityNodeInfo(host, info)

                        // Expose the testID prop as the resource-id name of the view. Black-box E2E/UI testing
                        // frameworks, which interact with the UI through the accessibility framework, do not have
                        // access to view tags. This allows developers/testers to avoid polluting the
                        // content-description with test identifiers.
                        val testId = host.tag as String?
                        if(testId != null){
                            info.viewIdResourceName = testId
                        }
                    }`,
  ],
]

;(async() => {
  for (const [filePath, fromStr, toStr] of patchs) {
    console.log(`Patching ${filePath.replace(rootPath, '')}`)
    try {
      const file = (await fs.promises.readFile(filePath)).toString()
      await fs.promises.writeFile(filePath, file.replace(fromStr, toStr))
    } catch (err) {
      console.error(`Patch ${filePath.replace(rootPath, '')} failed: ${err.message}`)
    }
  }
  console.log('\nDependencies patch finished.\n')
})()

