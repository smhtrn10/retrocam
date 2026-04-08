5m 44s
Run ./gradlew assembleRelease \
Downloading https://services.gradle.org/distributions/gradle-8.10.2-bin.zip
.............10%.............20%.............30%.............40%.............50%.............60%.............70%.............80%.............90%.............100%

Welcome to Gradle 8.10.2!

Here are the highlights of this release:
 - Support for Java 23
 - Faster configuration cache
 - Better configuration cache reports

For more details see https://docs.gradle.org/8.10.2/release-notes.html

To honour the JVM settings for this build a single-use Daemon process will be forked. For more on this, please refer to https://docs.gradle.org/8.10.2/userguide/gradle_daemon.html#sec:disabling_the_daemon in the Gradle documentation.
Daemon will be stopped at the end of the build 

> Configure project :expo-gradle-plugin:expo-autolinking-plugin
w: file:///home/runner/work/carousel/carousel/node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-plugin/build.gradle.kts:25:3: 'kotlinOptions(KotlinJvmOptionsDeprecated /* = KotlinJvmOptions */.() -> Unit): Unit' is deprecated. Please migrate to the compilerOptions DSL. More details are here: https://kotl.in/u1r8ln

> Configure project :expo-gradle-plugin:expo-autolinking-settings-plugin
w: file:///home/runner/work/carousel/carousel/node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/build.gradle.kts:30:3: 'kotlinOptions(KotlinJvmOptionsDeprecated /* = KotlinJvmOptions */.() -> Unit): Unit' is deprecated. Please migrate to the compilerOptions DSL. More details are here: https://kotl.in/u1r8ln

> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :gradle-plugin:settings-plugin:checkKotlinGradlePluginConfigurationErrors
> Task :gradle-plugin:shared:checkKotlinGradlePluginConfigurationErrors
> Task :gradle-plugin:shared:processResources NO-SOURCE
> Task :gradle-plugin:settings-plugin:pluginDescriptors
> Task :gradle-plugin:settings-plugin:processResources
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:processResources NO-SOURCE
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:pluginDescriptors
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:processResources
> Task :gradle-plugin:shared:compileKotlin
> Task :gradle-plugin:shared:compileJava NO-SOURCE
> Task :gradle-plugin:shared:classes UP-TO-DATE
> Task :gradle-plugin:shared:jar
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:compileKotlin
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:compileJava NO-SOURCE
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:classes UP-TO-DATE
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:jar
> Task :gradle-plugin:settings-plugin:compileKotlin
> Task :gradle-plugin:settings-plugin:compileJava NO-SOURCE
> Task :gradle-plugin:settings-plugin:classes
> Task :gradle-plugin:settings-plugin:jar
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:compileKotlin
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:compileJava NO-SOURCE
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:classes
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:jar

> Configure project :expo-module-gradle-plugin
w: file:///home/runner/work/carousel/carousel/node_modules/expo-modules-core/expo-module-gradle-plugin/build.gradle.kts:58:3: 'kotlinOptions(KotlinJvmOptionsDeprecated /* = KotlinJvmOptions */.() -> Unit): Unit' is deprecated. Please migrate to the compilerOptions DSL. More details are here: https://kotl.in/u1r8ln

> Task :expo-gradle-plugin:expo-autolinking-plugin:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-module-gradle-plugin:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :gradle-plugin:react-native-gradle-plugin:checkKotlinGradlePluginConfigurationErrors
> Task :expo-module-gradle-plugin:pluginDescriptors
> Task :expo-module-gradle-plugin:processResources
> Task :expo-gradle-plugin:expo-autolinking-plugin:pluginDescriptors
> Task :expo-gradle-plugin:expo-autolinking-plugin:processResources
> Task :gradle-plugin:react-native-gradle-plugin:pluginDescriptors
> Task :gradle-plugin:react-native-gradle-plugin:processResources
> Task :expo-gradle-plugin:expo-autolinking-plugin:compileKotlin
> Task :expo-gradle-plugin:expo-autolinking-plugin:compileJava NO-SOURCE
> Task :expo-gradle-plugin:expo-autolinking-plugin:classes
> Task :expo-gradle-plugin:expo-autolinking-plugin:jar
> Task :gradle-plugin:react-native-gradle-plugin:compileKotlin
> Task :gradle-plugin:react-native-gradle-plugin:compileJava NO-SOURCE
> Task :gradle-plugin:react-native-gradle-plugin:classes
> Task :gradle-plugin:react-native-gradle-plugin:jar

> Task :expo-module-gradle-plugin:compileKotlin
w: file:///home/runner/work/carousel/carousel/node_modules/expo-modules-core/expo-module-gradle-plugin/src/main/kotlin/expo/modules/plugin/android/AndroidLibraryExtension.kt:9:24 'var targetSdk: Int?' is deprecated. Will be removed from library DSL in v9.0. Use testOptions.targetSdk or/and lint.targetSdk instead.

> Task :expo-module-gradle-plugin:compileJava NO-SOURCE
> Task :expo-module-gradle-plugin:classes
> Task :expo-module-gradle-plugin:jar

> Configure project :
[ExpoRootProject] Using the following versions:
  - buildTools:  35.0.0
  - minSdk:      24
  - compileSdk:  35
  - targetSdk:   34
  - ndk:         26.1.10909125
  - kotlin:      2.0.21
  - ksp:         2.0.21-1.0.28

> Configure project :app
Checking the license for package NDK (Side by side) 26.1.10909125 in /usr/local/lib/android/sdk/licenses
License for package NDK (Side by side) 26.1.10909125 accepted.
Preparing "Install NDK (Side by side) 26.1.10909125 v.26.1.10909125".
"Install NDK (Side by side) 26.1.10909125 v.26.1.10909125" ready.
Installing NDK (Side by side) 26.1.10909125 in /usr/local/lib/android/sdk/ndk/26.1.10909125
"Install NDK (Side by side) 26.1.10909125 v.26.1.10909125" complete.
"Install NDK (Side by side) 26.1.10909125 v.26.1.10909125" finished.

> Configure project :expo

Using expo modules
  - expo-constants (17.0.8)
  - expo-image-loader (5.0.0)
  - expo-image-manipulator (13.0.6)
  - expo-image-picker (16.0.6)
  - expo-linking (7.0.5)
  - expo-media-library (17.0.6)
  - expo-modules-core (3.0.29)
  - [📦] expo-asset (12.0.12)
  - [📦] expo-file-system (19.0.21)
  - [📦] expo-font (14.0.11)
  - [📦] expo-keep-awake (15.0.8)


> Configure project :react-native-reanimated
Android gradle plugin: 8.6.0
Gradle: 8.10.2

> Task :app:checkKotlinGradlePluginConfigurationErrors
> Task :app:generateAutolinkingNewArchitectureFiles
> Task :app:generateAutolinkingPackageList
> Task :app:generateCodegenSchemaFromJavaScript SKIPPED
> Task :app:generateCodegenArtifactsFromSchema SKIPPED
> Task :app:preBuild
> Task :app:preReleaseBuild
> Task :app:generateReleaseBuildConfig
> Task :expo:generatePackagesList
> Task :expo:preBuild
> Task :expo:preReleaseBuild
> Task :expo:writeReleaseAarMetadata

> Task :expo-constants:createExpoConfig
The NODE_ENV environment variable is required but was not specified. Ensure the project is bundled with Expo CLI or NODE_ENV is set.
Proceeding without mode-specific .env

> Task :expo-constants:preBuild
> Task :expo-constants:preReleaseBuild
> Task :expo-image-loader:preBuild UP-TO-DATE
> Task :expo-constants:writeReleaseAarMetadata
> Task :expo-image-loader:preReleaseBuild UP-TO-DATE
> Task :expo-image-manipulator:preBuild UP-TO-DATE
> Task :expo-image-manipulator:preReleaseBuild UP-TO-DATE
> Task :expo-image-loader:writeReleaseAarMetadata
> Task :expo-image-manipulator:writeReleaseAarMetadata
> Task :expo-image-picker:preBuild UP-TO-DATE
> Task :expo-image-picker:preReleaseBuild UP-TO-DATE
> Task :expo-linking:preBuild UP-TO-DATE
> Task :expo-image-picker:writeReleaseAarMetadata
> Task :expo-linking:preReleaseBuild UP-TO-DATE
> Task :expo-media-library:preBuild UP-TO-DATE
> Task :expo-media-library:preReleaseBuild UP-TO-DATE
> Task :expo-linking:writeReleaseAarMetadata
> Task :expo-media-library:writeReleaseAarMetadata
> Task :expo-modules-core:preBuild UP-TO-DATE
> Task :expo-modules-core:preReleaseBuild UP-TO-DATE
> Task :expo-modules-core:writeReleaseAarMetadata
> Task :react-native-async-storage_async-storage:generateCodegenSchemaFromJavaScript
> Task :react-native-async-storage_async-storage:generateCodegenArtifactsFromSchema
> Task :react-native-async-storage_async-storage:preBuild
> Task :react-native-async-storage_async-storage:preReleaseBuild
> Task :react-native-async-storage_async-storage:writeReleaseAarMetadata
> Task :react-native-gesture-handler:generateCodegenSchemaFromJavaScript
> Task :react-native-gesture-handler:generateCodegenArtifactsFromSchema
> Task :react-native-gesture-handler:preBuild
> Task :react-native-gesture-handler:preReleaseBuild
> Task :react-native-reanimated:assertLatestReactNativeWithNewArchitectureTask SKIPPED
> Task :react-native-reanimated:assertMinimalReactNativeVersionTask SKIPPED
> Task :react-native-gesture-handler:writeReleaseAarMetadata
> Task :react-native-reanimated:generateCodegenSchemaFromJavaScript
> Task :react-native-reanimated:generateCodegenArtifactsFromSchema
> Task :react-native-reanimated:prepareReanimatedHeadersForPrefabs
> Task :react-native-reanimated:prepareWorkletsHeadersForPrefabs
> Task :react-native-reanimated:preBuild
> Task :react-native-reanimated:preReleaseBuild
> Task :react-native-reanimated:writeReleaseAarMetadata
> Task :react-native-safe-area-context:generateCodegenSchemaFromJavaScript
> Task :react-native-safe-area-context:generateCodegenArtifactsFromSchema
> Task :react-native-safe-area-context:preBuild
> Task :react-native-safe-area-context:preReleaseBuild
> Task :react-native-safe-area-context:writeReleaseAarMetadata
> Task :react-native-screens:generateCodegenSchemaFromJavaScript
> Task :react-native-screens:generateCodegenArtifactsFromSchema
> Task :react-native-screens:preBuild
> Task :react-native-screens:preReleaseBuild
> Task :react-native-screens:writeReleaseAarMetadata
> Task :react-native-svg:generateCodegenSchemaFromJavaScript
> Task :react-native-svg:generateCodegenArtifactsFromSchema
> Task :react-native-svg:preBuild
> Task :react-native-svg:preReleaseBuild
> Task :react-native-svg:writeReleaseAarMetadata
> Task :react-native-webview:generateCodegenSchemaFromJavaScript
> Task :react-native-webview:generateCodegenArtifactsFromSchema
> Task :react-native-webview:preBuild
> Task :react-native-webview:preReleaseBuild
> Task :react-native-webview:writeReleaseAarMetadata

> Task :app:createBundleReleaseJsAndAssets
Starting Metro Bundler
Android node_modules/expo-router/entry.js ▓▓▓▓░░░░░░░░░░░░ 25.0% ( 80/241)
Android node_modules/expo-router/entry.js ▓▓▓▓▓▓▓▓░░░░░░░░ 51.7% (432/601)
Android node_modules/expo-router/entry.js ▓▓▓▓▓▓▓▓▓▓▓░░░░░ 74.0% (598/766)
Android node_modules/expo-router/entry.js ▓▓▓▓▓▓▓▓▓▓▓░░░░░ 74.0% (1186/2461)
Android node_modules/expo-router/entry.js ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░ 91.7% (2399/2505)
Android node_modules/expo-router/entry.js ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░ 98.5% (2794/2863)
Android Bundled 22774ms node_modules/expo-router/entry.js (2915 modules)
Writing bundle output to: /home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle
Writing sourcemap output to: /home/runner/work/carousel/carousel/android/app/build/intermediates/sourcemaps/react/release/index.android.bundle.packager.map
Copying 25 asset files
Done writing bundle output
Done writing sourcemap output
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:2173:34: warning: the variable "AbortController" was not declared in anonymous function " 63#"
        if ("function" == typeof AbortController) return new AbortController();
                                 ^~~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:2325:165: warning: the variable "Promise" was not declared in anonymous arrow function " 87#"
...Br(r, D) : c(undefined)), q(() => Promise.all(de.map(r => r())), true, D);
                                     ^~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:823:32: warning: the variable "queueMicrotask" was not declared in arrow function "y"
      if ("function" == typeof queueMicrotask) y = queueMicrotask;else {
                               ^~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:1071:100: warning: the variable "structuredClone" was not declared in arrow function "ie"
...sfer() : "function" == typeof structuredClone ? r => structuredClone(r, {
                                 ^~~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:2291:84: warning: the variable "self" was not declared in anonymous function " 22#"
...globalThis : "undefined" != typeof self ? self : "undefined" != typeof glo...
                                      ^~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:3392:24: warning: the variable "URL" was not declared in function "_fetch"
        props[0] = new URL(props[0], window.location?.origin).toString();
                       ^~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:3437:42: warning: the variable "fetch" was not declared in anonymous function " 231#"
      value: wrapFetchWithWindowLocation(fetch)
                                         ^~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:4964:46: warning: the variable "performance" was not declared in function "PerformanceMark"
        startTime: markOptions?.startTime ?? performance.now(),
                                             ^~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:5394:23: warning: the variable "DebuggerInternal" was not declared in function "__shouldPauseOnThrow"
        return typeof DebuggerInternal !== 'undefined' && DebuggerInternal.sh...
                      ^~~~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:6848:5: warning: the variable "setImmediate" was not declared in function "handleResolved"
    setImmediate(function () {
    ^~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:8687:94: warning: the variable "setTimeout" was not declared in anonymous arrow function " 451#"
...).then(callback).catch(error => setTimeout(() => {
                                   ^~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:11154:5: warning: the variable "Headers" was not declared in anonymous function " 526#"
    Headers,
    ^~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:11155:5: warning: the variable "Request" was not declared in anonymous function " 526#"
    Request,
    ^~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:11156:5: warning: the variable "Response" was not declared in anonymous function " 526#"
    Response
    ^~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:11313:24: warning: the variable "FileReader" was not declared in function "readBlobAsArrayBuffer"
      var reader = new FileReader();
                       ^~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:11364:36: warning: the variable "Blob" was not declared in anonymous function " 537#"
        } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
                                   ^~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:11366:40: warning: the variable "FormData" was not declared in anonymous function " 537#"
        } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
                                       ^~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:11368:44: warning: the variable "URLSearchParams" was not declared in anonymous function " 537#"
...e if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body...
                                 ^~~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:11621:23: warning: the variable "XMLHttpRequest" was not declared in anonymous function " 547#"
        var xhr = new XMLHttpRequest();
                      ^~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:21010:24: warning: the variable "DOMRect" was not declared in function "unstable_getBoundingClientRect"
            return new DOMRect(rect[0], rect[1], rect[2], rect[3]);
                       ^~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:22013:31: warning: the variable "nativeFabricUIManager" was not declared in anonymous function " 881#"
  var _nativeFabricUIManage = nativeFabricUIManager,
                              ^~~~~~~~~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:22041:21: warning: the variable "clearTimeout" was not declared in anonymous function " 881#"
    cancelTimeout = clearTimeout;
                    ^~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:22054:51: warning: the variable "RN$enableMicrotasksInReact" was not declared in anonymous function " 881#"
... "undefined" !== typeof RN$enableMicrotasksInReact && !!RN$enableMicrotask...
                           ^~~~~~~~~~~~~~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:26476:30: warning: the variable "__REACT_DEVTOOLS_GLOBAL_HOOK__" was not declared in anonymous function " 881#"
  if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
                             ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:26616:26: warning: the variable "navigator" was not declared in anonymous function " 914#"
  "undefined" !== typeof navigator && undefined !== navigator.scheduling && u...
                         ^~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:26726:37: warning: the variable "MessageChannel" was not declared in anonymous function " 914#"
  };else if ("undefined" !== typeof MessageChannel) {
                                    ^~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:26741:34: warning: the variable "nativeRuntimeScheduler" was not declared in anonymous function " 914#"
... = "undefined" !== typeof nativeRuntimeScheduler ? nativeRuntimeScheduler....
                             ^~~~~~~~~~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:32709:25: warning: the variable "ErrorUtils" was not declared in anonymous function " 967#"
    var globalHandler = ErrorUtils.getGlobalHandler();
                        ^~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:33497:25: warning: the variable "TextDecoder" was not declared in function "TextDecoderStream"
      var decoder = new TextDecoder(label, options);
                        ^~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:33538:48: warning: the variable "TransformStream" was not declared in anonymous function " 989#"
...(0, _wrapNativeSuper.default)(TransformStream)); // https://encoding.spec....
                                 ^~~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:33543:25: warning: the variable "TextEncoder" was not declared in function "TextEncoderStream"
      var encoder = new TextEncoder();
                        ^~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:35947:16: warning: the variable "SharedArrayBuffer" was not declared in function "from 1#"
    if (typeof SharedArrayBuffer !== 'undefined' && (isInstance(value, Shared...
               ^~~~~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:39145:16: warning: the variable "location" was not declared in function "buildUrlForBundle"
    if (typeof location !== 'undefined') {
               ^~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:39202:16: warning: Direct call to eval(), but lexical scope is not supported.
        return eval(body);
               ^~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:42819:9: warning: the variable "clearImmediate" was not declared in function "disableQueue"
        clearImmediate(prevTimeout);
        ^~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:44756:34: warning: the variable "requestAnimationFrame" was not declared in function "start 9#"
...    this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
                              ^~~~~~~~~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:62692:21: warning: the variable "Image" was not declared in anonymous arrow function " 1979#"
      var img = new Image();
                    ^~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:63811:16: warning: Direct call to eval(), but lexical scope is not supported.
        return eval(body);
               ^~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:67098:38: warning: the variable "document" was not declared in anonymous function " 2193#"
...r useClientLayoutEffect = typeof document !== 'undefined' || typeof naviga...
                                    ^~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:73757:9: warning: the variable "REACT_NAVIGATION_DEVTOOLS" was not declared in anonymous arrow function " 2607#"
        REACT_NAVIGATION_DEVTOOLS.set(refContainer.current, {
        ^~~~~~~~~~~~~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:80187:16: warning: the variable "requestIdleCallback" was not declared in anonymous arrow function " 2877#"
      var id = requestIdleCallback(() => {
               ^~~~~~~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:80190:20: warning: the variable "cancelIdleCallback" was not declared in anonymous arrow function " 2879#"
      return () => cancelIdleCallback(id);
                   ^~~~~~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:84242:11: warning: the variable "cancelAnimationFrame" was not declared in function "cleanup"
          cancelAnimationFrame(this.splashScreenAnimationFrame);
          ^~~~~~~~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:85496:16: warning: the variable "ReactNativeWebView" was not declared in function "emitDomEvent"
    if (typeof ReactNativeWebView !== 'undefined') {
               ^~~~~~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:217897:39: warning: the variable "setInterval" was not declared in arrow function "setInterval 1#"
    setInterval: (callback, delay) => setInterval(callback, delay),
                                      ^~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:217898:34: warning: the variable "clearInterval" was not declared in arrow function "clearInterval 1#"
    clearInterval: intervalId => clearInterval(intervalId)
                                 ^~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:227641:11: warning: the variable "_WORKLET" was not declared in function "assertEasingIsWorklet"
      if (_WORKLET) {
          ^~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:230103:12: warning: the variable "__reanimatedLoggerConfig" was not declared in function "replaceLoggerImplementation"
        ...__reanimatedLoggerConfig,
           ^~~~~~~~~~~~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:230769:26: warning: Direct call to eval(), but lexical scope is not supported.
            workletFun = eval('(' + initData.code + '\n)');
                         ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:230792:112: warning: the variable "_toString" was not declared in function "valueUnpacker"
...recognized by value unpacker: "${_toString(objectToUnpack)}".`);
                                    ^~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:249595:27: warning: the variable "HTMLElement" was not declared in function "findDescendantWithExitingAnimation"
    if (!(node instanceof HTMLElement)) {
                          ^~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:249621:24: warning: the variable "MutationObserver" was not declared in function "addHTMLMutationObserver"
    var observer = new MutationObserver(mutationsList => {
                       ^~~~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:249671:41: warning: the variable "getComputedStyle" was not declared in function "fixElementPosition"
...entBorderTopValue = parseInt(getComputedStyle(parent).borderTopWidth);
                                ^~~~~~~~~~~~~~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:253854:5: warning: the variable "jest" was not declared in arrow function "beforeTest"
    jest.useFakeTimers();
    ^~~~
/home/runner/work/carousel/carousel/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle:254456:26: warning: the variable "_getAnimationTimestamp" was not declared in function "computeEasingProgress"
      var elapsedTime = (_getAnimationTimestamp() - startingTimestamp) / 1000;
                         ^~~~~~~~~~~~~~~~~~~~~~

> Task :app:checkReleaseAarMetadata
> Task :app:generateReleaseResValues
> Task :expo:generateReleaseResValues
> Task :expo:generateReleaseResources
> Task :expo:packageReleaseResources
> Task :expo-constants:generateReleaseResValues
> Task :expo-constants:generateReleaseResources
> Task :expo-constants:packageReleaseResources
> Task :expo-image-loader:generateReleaseResValues
> Task :expo-image-loader:generateReleaseResources
> Task :expo-image-loader:packageReleaseResources
> Task :expo-image-manipulator:generateReleaseResValues
> Task :expo-image-manipulator:generateReleaseResources
> Task :expo-image-manipulator:packageReleaseResources
> Task :expo-image-picker:generateReleaseResValues
> Task :expo-image-picker:generateReleaseResources
> Task :expo-image-picker:packageReleaseResources
> Task :expo-linking:generateReleaseResValues
> Task :expo-linking:generateReleaseResources
> Task :expo-linking:packageReleaseResources
> Task :expo-media-library:generateReleaseResValues
> Task :expo-media-library:generateReleaseResources
> Task :expo-media-library:packageReleaseResources
> Task :expo-modules-core:generateReleaseResValues
> Task :expo-modules-core:generateReleaseResources
> Task :expo-modules-core:packageReleaseResources
> Task :react-native-async-storage_async-storage:generateReleaseResValues
> Task :react-native-async-storage_async-storage:generateReleaseResources
> Task :react-native-async-storage_async-storage:packageReleaseResources
> Task :react-native-gesture-handler:generateReleaseResValues
> Task :react-native-gesture-handler:generateReleaseResources
> Task :react-native-gesture-handler:packageReleaseResources
> Task :react-native-reanimated:generateReleaseResValues
> Task :react-native-reanimated:generateReleaseResources
> Task :react-native-reanimated:packageReleaseResources
> Task :react-native-safe-area-context:generateReleaseResValues
> Task :react-native-safe-area-context:generateReleaseResources
> Task :react-native-safe-area-context:packageReleaseResources
> Task :react-native-screens:generateReleaseResValues
> Task :react-native-screens:generateReleaseResources
> Task :react-native-screens:packageReleaseResources
> Task :react-native-svg:generateReleaseResValues
> Task :react-native-svg:generateReleaseResources
> Task :react-native-svg:packageReleaseResources
> Task :react-native-webview:generateReleaseResValues
> Task :react-native-webview:generateReleaseResources
> Task :react-native-webview:packageReleaseResources
> Task :app:mapReleaseSourceSetPaths
> Task :app:generateReleaseResources
> Task :app:packageReleaseResources
> Task :app:mergeReleaseResources
> Task :app:createReleaseCompatibleScreenManifests
> Task :app:extractDeepLinksRelease
> Task :expo:extractDeepLinksRelease
> Task :expo-constants:extractDeepLinksRelease
> Task :expo-image-loader:extractDeepLinksRelease
> Task :app:parseReleaseLocalResources
> Task :expo-image-manipulator:extractDeepLinksRelease
> Task :expo-constants:processReleaseManifest
> Task :expo-image-loader:processReleaseManifest
> Task :expo:processReleaseManifest
> Task :expo-image-manipulator:processReleaseManifest
> Task :expo-image-picker:extractDeepLinksRelease
> Task :expo-linking:extractDeepLinksRelease
> Task :expo-linking:processReleaseManifest
> Task :expo-media-library:extractDeepLinksRelease
> Task :expo-image-picker:processReleaseManifest
> Task :expo-modules-core:extractDeepLinksRelease
> Task :expo-media-library:processReleaseManifest
> Task :react-native-async-storage_async-storage:extractDeepLinksRelease

> Task :expo-modules-core:processReleaseManifest
/home/runner/work/carousel/carousel/node_modules/expo-modules-core/android/src/main/AndroidManifest.xml:8:9-11:45 Warning:
	meta-data#com.facebook.soloader.enabled@android:value was tagged at AndroidManifest.xml:8 to replace other declarations but no other declaration present

> Task :react-native-gesture-handler:extractDeepLinksRelease

> Task :react-native-async-storage_async-storage:processReleaseManifest
package="com.reactnativecommunity.asyncstorage" found in source AndroidManifest.xml: /home/runner/work/carousel/carousel/node_modules/@react-native-async-storage/async-storage/android/src/main/AndroidManifest.xml.
Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported, and the value is ignored.
Recommendation: remove package="com.reactnativecommunity.asyncstorage" from the source AndroidManifest.xml: /home/runner/work/carousel/carousel/node_modules/@react-native-async-storage/async-storage/android/src/main/AndroidManifest.xml.

> Task :react-native-gesture-handler:processReleaseManifest
> Task :react-native-reanimated:extractDeepLinksRelease
> Task :react-native-safe-area-context:extractDeepLinksRelease
> Task :react-native-reanimated:processReleaseManifest
> Task :react-native-screens:extractDeepLinksRelease

> Task :react-native-safe-area-context:processReleaseManifest
package="com.th3rdwave.safeareacontext" found in source AndroidManifest.xml: /home/runner/work/carousel/carousel/node_modules/react-native-safe-area-context/android/src/main/AndroidManifest.xml.
Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported, and the value is ignored.
Recommendation: remove package="com.th3rdwave.safeareacontext" from the source AndroidManifest.xml: /home/runner/work/carousel/carousel/node_modules/react-native-safe-area-context/android/src/main/AndroidManifest.xml.

> Task :react-native-svg:extractDeepLinksRelease

> Task :react-native-screens:processReleaseManifest
package="com.swmansion.rnscreens" found in source AndroidManifest.xml: /home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/AndroidManifest.xml.
Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported, and the value is ignored.
Recommendation: remove package="com.swmansion.rnscreens" from the source AndroidManifest.xml: /home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/AndroidManifest.xml.

> Task :react-native-webview:extractDeepLinksRelease

> Task :react-native-svg:processReleaseManifest
package="com.horcrux.svg" found in source AndroidManifest.xml: /home/runner/work/carousel/carousel/node_modules/react-native-svg/android/src/main/AndroidManifest.xml.
Setting the namespace via the package attribute in the source AndroidManifest.xml is no longer supported, and the value is ignored.
Recommendation: remove package="com.horcrux.svg" from the source AndroidManifest.xml: /home/runner/work/carousel/carousel/node_modules/react-native-svg/android/src/main/AndroidManifest.xml.

> Task :react-native-webview:processReleaseManifest
> Task :expo:compileReleaseLibraryResources

> Task :app:processReleaseMainManifest
/home/runner/work/carousel/carousel/android/app/src/main/AndroidManifest.xml Warning:
	provider#expo.modules.filesystem.FileSystemFileProvider@android:authorities was tagged at AndroidManifest.xml:0 to replace other declarations but no other declaration present

> Task :app:processReleaseManifest
> Task :app:processReleaseManifestForPackage
> Task :expo-constants:compileReleaseLibraryResources
> Task :expo:parseReleaseLocalResources
> Task :expo-constants:parseReleaseLocalResources
> Task :expo-image-loader:compileReleaseLibraryResources
> Task :expo-image-manipulator:compileReleaseLibraryResources
> Task :expo-image-manipulator:parseReleaseLocalResources
> Task :expo-image-loader:parseReleaseLocalResources
> Task :expo-image-manipulator:generateReleaseRFile
> Task :expo-constants:generateReleaseRFile
> Task :expo:generateReleaseRFile
> Task :expo-image-picker:compileReleaseLibraryResources
> Task :expo-image-picker:parseReleaseLocalResources
> Task :expo-image-loader:generateReleaseRFile
> Task :expo-linking:compileReleaseLibraryResources
> Task :expo-image-picker:generateReleaseRFile
> Task :expo-linking:parseReleaseLocalResources
> Task :expo-media-library:compileReleaseLibraryResources
> Task :expo-linking:generateReleaseRFile
> Task :expo-media-library:parseReleaseLocalResources
> Task :expo-modules-core:compileReleaseLibraryResources
> Task :expo-media-library:generateReleaseRFile
> Task :expo-modules-core:parseReleaseLocalResources
> Task :react-native-async-storage_async-storage:compileReleaseLibraryResources
> Task :expo-modules-core:generateReleaseRFile
> Task :react-native-gesture-handler:compileReleaseLibraryResources
> Task :react-native-async-storage_async-storage:parseReleaseLocalResources
> Task :react-native-gesture-handler:parseReleaseLocalResources
> Task :react-native-reanimated:compileReleaseLibraryResources
> Task :react-native-async-storage_async-storage:generateReleaseRFile
> Task :react-native-gesture-handler:generateReleaseRFile
> Task :react-native-reanimated:parseReleaseLocalResources
> Task :react-native-safe-area-context:compileReleaseLibraryResources
> Task :react-native-reanimated:generateReleaseRFile
> Task :react-native-safe-area-context:parseReleaseLocalResources
> Task :react-native-screens:compileReleaseLibraryResources
> Task :react-native-safe-area-context:generateReleaseRFile
> Task :react-native-screens:parseReleaseLocalResources
> Task :react-native-svg:compileReleaseLibraryResources
> Task :react-native-svg:parseReleaseLocalResources
> Task :react-native-webview:compileReleaseLibraryResources
> Task :react-native-screens:generateReleaseRFile
> Task :expo:checkKotlinGradlePluginConfigurationErrors
> Task :expo:generateReleaseBuildConfig
> Task :expo-constants:checkKotlinGradlePluginConfigurationErrors
> Task :react-native-svg:generateReleaseRFile
> Task :react-native-webview:parseReleaseLocalResources
> Task :expo-constants:generateReleaseBuildConfig
> Task :expo-modules-core:checkKotlinGradlePluginConfigurationErrors
> Task :react-native-webview:generateReleaseRFile
> Task :expo-modules-core:generateReleaseBuildConfig
> Task :app:processReleaseResources
> Task :expo-image-loader:checkKotlinGradlePluginConfigurationErrors
> Task :expo-image-loader:generateReleaseBuildConfig
> Task :expo-modules-core:javaPreCompileRelease
> Task :expo-constants:javaPreCompileRelease
> Task :expo-image-loader:javaPreCompileRelease
> Task :expo-image-manipulator:checkKotlinGradlePluginConfigurationErrors
> Task :expo-image-manipulator:generateReleaseBuildConfig
> Task :expo-image-picker:checkKotlinGradlePluginConfigurationErrors
> Task :expo-image-manipulator:javaPreCompileRelease
> Task :expo-image-picker:generateReleaseBuildConfig
> Task :expo-linking:checkKotlinGradlePluginConfigurationErrors
> Task :expo-image-picker:javaPreCompileRelease
> Task :expo-linking:generateReleaseBuildConfig
> Task :expo-media-library:checkKotlinGradlePluginConfigurationErrors
> Task :expo-linking:javaPreCompileRelease
> Task :expo-media-library:generateReleaseBuildConfig
> Task :expo-media-library:javaPreCompileRelease
> Task :expo:javaPreCompileRelease
> Task :react-native-async-storage_async-storage:generateReleaseBuildConfig
> Task :react-native-gesture-handler:checkKotlinGradlePluginConfigurationErrors
> Task :react-native-async-storage_async-storage:javaPreCompileRelease
> Task :react-native-gesture-handler:generateReleaseBuildConfig

> Task :react-native-async-storage_async-storage:compileReleaseJavaWithJavac
/home/runner/work/carousel/carousel/node_modules/@react-native-async-storage/async-storage/android/src/main/java/com/reactnativecommunity/asyncstorage/AsyncStorageModule.java:84: warning: [removal] onCatalystInstanceDestroy() in NativeModule has been deprecated and marked for removal
  public void onCatalystInstanceDestroy() {
              ^
Note: Some input files use or override a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
Note: /home/runner/work/carousel/carousel/node_modules/@react-native-async-storage/async-storage/android/src/javaPackage/java/com/reactnativecommunity/asyncstorage/AsyncStoragePackage.java uses unchecked or unsafe operations.
Note: Recompile with -Xlint:unchecked for details.
1 warning

> Task :react-native-reanimated:generateReleaseBuildConfig
> Task :react-native-reanimated:packageNdkLibs NO-SOURCE
> Task :react-native-gesture-handler:javaPreCompileRelease
> Task :react-native-safe-area-context:checkKotlinGradlePluginConfigurationErrors
> Task :react-native-reanimated:javaPreCompileRelease
> Task :react-native-safe-area-context:generateReleaseBuildConfig
> Task :react-native-async-storage_async-storage:bundleLibCompileToJarRelease
Note: Some input files use or override a deprecated API.

> Task :react-native-reanimated:compileReleaseJavaWithJavac
Note: Recompile with -Xlint:deprecation for details.
Note: Some input files use unchecked or unsafe operations.
Note: Recompile with -Xlint:unchecked for details.

> Task :react-native-reanimated:bundleLibCompileToJarRelease
> Task :react-native-safe-area-context:javaPreCompileRelease
> Task :react-native-screens:checkKotlinGradlePluginConfigurationErrors
> Task :react-native-screens:generateReleaseBuildConfig

> Task :react-native-safe-area-context:compileReleaseKotlin
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-safe-area-context/android/src/main/java/com/th3rdwave/safeareacontext/SafeAreaContextPackage.kt:27:11 'constructor ReactModuleInfo(String, String, Boolean, Boolean, Boolean, Boolean, Boolean)' is deprecated. use ReactModuleInfo(String, String, boolean, boolean, boolean, boolean)]
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-safe-area-context/android/src/main/java/com/th3rdwave/safeareacontext/SafeAreaContextPackage.kt:33:27 'getter for hasConstants: Boolean' is deprecated. This property is unused and it's planning to be removed in a future version of
        React Native. Please refrain from using it.
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-safe-area-context/android/src/main/java/com/th3rdwave/safeareacontext/SafeAreaView.kt:59:23 'getter for uiImplementation: UIImplementation!' is deprecated. Deprecated in Java

> Task :react-native-safe-area-context:compileReleaseJavaWithJavac
> Task :react-native-safe-area-context:bundleLibCompileToJarRelease
> Task :react-native-screens:javaPreCompileRelease
> Task :react-native-svg:generateReleaseBuildConfig
> Task :react-native-svg:javaPreCompileRelease
/home/runner/work/carousel/carousel/node_modules/react-native-svg/android/src/main/java/com/horcrux/svg/RenderableViewManager.java:388: warning: [removal] processTransform(ReadableArray,double[]) in TransformHelper has been deprecated and marked for removal

> Task :react-native-svg:compileReleaseJavaWithJavac
    TransformHelper.processTransform(transforms, sTransformDecompositionArray);
                   ^
Note: Some input files use or override a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
Note: Some input files use unchecked or unsafe operations.
Note: Recompile with -Xlint:unchecked for details.
1 warning

> Task :react-native-svg:bundleLibCompileToJarRelease
> Task :react-native-webview:checkKotlinGradlePluginConfigurationErrors
> Task :react-native-webview:generateReleaseBuildConfig
> Task :expo-modules-core:compileReleaseKotlin

> Task :react-native-webview:compileReleaseKotlin
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:22:34 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:40:71 Parameter 'webView' is never used, could be renamed to _
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:82:18 'setter for allowFileAccessFromFileURLs: Boolean' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:83:18 'setter for allowUniversalAccessFromFileURLs: Boolean' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:94:102 Parameter 'contentLength' is never used, could be renamed to _
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:111:32 Variable 'urlObj' initializer is redundant
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:125:21 'allowScanningByMediaScanner(): Unit' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:162:36 'setter for systemUiVisibility: Int' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:301:14 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:344:15 Condition 'args == null' is always 'false'
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:353:34 Condition 'args != null' is always 'true'
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:372:38 'setter for allowUniversalAccessFromFileURLs: Boolean' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:384:19 Parameter 'viewWrapper' is never used
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:433:51 Unchecked cast: Any to kotlin.collections.HashMap<String, String> /* = java.util.HashMap<String, String> */
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:489:23 'setter for savePassword: Boolean' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:490:23 'setter for saveFormData: Boolean' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:560:23 'setter for allowFileAccessFromFileURLs: Boolean' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:661:65 Unchecked cast: ArrayList<Any> to List<Map<String, String>>
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:682:23 'setter for saveFormData: Boolean' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:717:36 Parameter 'viewWrapper' is never used
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopCustomMenuSelectionEvent.kt:5:44 'RCTEventEmitter' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopCustomMenuSelectionEvent.kt:11:3 'constructor Event<T : Event<(raw) Event<*>>!>(Int)' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopCustomMenuSelectionEvent.kt:22:42 'RCTEventEmitter' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopCustomMenuSelectionEvent.kt:23:21 'receiveEvent(Int, String!, WritableMap?): Unit' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopHttpErrorEvent.kt:5:44 'RCTEventEmitter' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopHttpErrorEvent.kt:11:3 'constructor Event<T : Event<(raw) Event<*>>!>(Int)' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopHttpErrorEvent.kt:22:42 'RCTEventEmitter' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopHttpErrorEvent.kt:23:21 'receiveEvent(Int, String!, WritableMap?): Unit' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingErrorEvent.kt:5:44 'RCTEventEmitter' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingErrorEvent.kt:11:3 'constructor Event<T : Event<(raw) Event<*>>!>(Int)' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingErrorEvent.kt:22:42 'RCTEventEmitter' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingErrorEvent.kt:23:21 'receiveEvent(Int, String!, WritableMap?): Unit' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingFinishEvent.kt:5:44 'RCTEventEmitter' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingFinishEvent.kt:11:3 'constructor Event<T : Event<(raw) Event<*>>!>(Int)' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingFinishEvent.kt:22:42 'RCTEventEmitter' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingFinishEvent.kt:23:21 'receiveEvent(Int, String!, WritableMap?): Unit' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingProgressEvent.kt:5:44 'RCTEventEmitter' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingProgressEvent.kt:11:3 'constructor Event<T : Event<(raw) Event<*>>!>(Int)' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingProgressEvent.kt:22:42 'RCTEventEmitter' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingProgressEvent.kt:23:21 'receiveEvent(Int, String!, WritableMap?): Unit' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingStartEvent.kt:5:44 'RCTEventEmitter' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingStartEvent.kt:11:3 'constructor Event<T : Event<(raw) Event<*>>!>(Int)' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingStartEvent.kt:22:42 'RCTEventEmitter' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopLoadingStartEvent.kt:23:21 'receiveEvent(Int, String!, WritableMap?): Unit' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopMessageEvent.kt:5:44 'RCTEventEmitter' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopMessageEvent.kt:10:75 'constructor Event<T : Event<(raw) Event<*>>!>(Int)' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopMessageEvent.kt:21:42 'RCTEventEmitter' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopMessageEvent.kt:22:21 'receiveEvent(Int, String!, WritableMap?): Unit' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopNewWindowEvent.kt:5:44 'RCTEventEmitter' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopNewWindowEvent.kt:11:3 'constructor Event<T : Event<(raw) Event<*>>!>(Int)' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopNewWindowEvent.kt:22:42 'RCTEventEmitter' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopNewWindowEvent.kt:23:21 'receiveEvent(Int, String!, WritableMap?): Unit' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopRenderProcessGoneEvent.kt:5:44 'RCTEventEmitter' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopRenderProcessGoneEvent.kt:12:3 'constructor Event<T : Event<(raw) Event<*>>!>(Int)' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopRenderProcessGoneEvent.kt:23:42 'RCTEventEmitter' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopRenderProcessGoneEvent.kt:24:21 'receiveEvent(Int, String!, WritableMap?): Unit' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopShouldStartLoadWithRequestEvent.kt:5:44 'RCTEventEmitter' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopShouldStartLoadWithRequestEvent.kt:10:89 'constructor Event<T : Event<(raw) Event<*>>!>(Int)' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopShouldStartLoadWithRequestEvent.kt:27:42 'RCTEventEmitter' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/events/TopShouldStartLoadWithRequestEvent.kt:28:21 'receiveEvent(Int, String!, WritableMap?): Unit' is deprecated. Deprecated in Java

> Task :react-native-webview:javaPreCompileRelease
Note: Some input files use or override a deprecated API.
Note: Recompile with -Xlint:deprecation for details.

> Task :react-native-webview:compileReleaseJavaWithJavac

> Task :react-native-webview:bundleLibCompileToJarRelease
> Task :app:buildKotlinToolingMetadata
> Task :app:javaPreCompileRelease
> Task :app:extractProguardFiles
> Task :expo:extractProguardFiles
> Task :expo-constants:extractProguardFiles
> Task :expo-modules-core:extractProguardFiles
> Task :expo-modules-core:prepareLintJarForPublish
> Task :expo-constants:prepareLintJarForPublish
> Task :expo-image-loader:extractProguardFiles
> Task :expo-image-loader:prepareLintJarForPublish
> Task :expo-image-manipulator:extractProguardFiles
> Task :expo-image-manipulator:prepareLintJarForPublish
> Task :expo-image-picker:extractProguardFiles
> Task :expo-image-picker:prepareLintJarForPublish
> Task :expo-linking:extractProguardFiles
> Task :expo-linking:prepareLintJarForPublish
> Task :expo-media-library:extractProguardFiles
> Task :expo-media-library:prepareLintJarForPublish
> Task :expo:prepareLintJarForPublish
> Task :react-native-async-storage_async-storage:bundleLibRuntimeToJarRelease
> Task :react-native-async-storage_async-storage:processReleaseJavaRes NO-SOURCE
> Task :react-native-async-storage_async-storage:createFullJarRelease
> Task :react-native-async-storage_async-storage:extractProguardFiles

> Task :react-native-gesture-handler:compileReleaseKotlin
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-gesture-handler/android/src/main/java/com/swmansion/gesturehandler/RNGestureHandlerPackage.kt:69:42 'constructor ReactModuleInfo(String, String, Boolean, Boolean, Boolean, Boolean, Boolean)' is deprecated. use ReactModuleInfo(String, String, boolean, boolean, boolean, boolean)]
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-gesture-handler/android/src/main/java/com/swmansion/gesturehandler/core/FlingGestureHandler.kt:25:26 Parameter 'event' is never used
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-gesture-handler/android/src/main/java/com/swmansion/gesturehandler/react/RNGestureHandlerButtonViewManager.kt:72:62 The corresponding parameter in the supertype 'ViewGroupManager' is named 'borderRadius'. This may cause problems when calling this function with named arguments.
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-gesture-handler/android/src/main/java/com/swmansion/gesturehandler/react/RNGestureHandlerButtonViewManager.kt:77:63 The corresponding parameter in the supertype 'ViewGroupManager' is named 'borderRadius'. This may cause problems when calling this function with named arguments.
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-gesture-handler/android/src/main/java/com/swmansion/gesturehandler/react/RNGestureHandlerButtonViewManager.kt:82:65 The corresponding parameter in the supertype 'ViewGroupManager' is named 'borderRadius'. This may cause problems when calling this function with named arguments.
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-gesture-handler/android/src/main/java/com/swmansion/gesturehandler/react/RNGestureHandlerButtonViewManager.kt:87:66 The corresponding parameter in the supertype 'ViewGroupManager' is named 'borderRadius'. This may cause problems when calling this function with named arguments.
e: file:///home/runner/work/carousel/carousel/node_modules/expo-modules-core/android/src/main/java/expo/modules/kotlin/views/decorators/CSSProps.kt:146:55 Too many arguments for public final fun parse(boxShadow: ReadableMap): BoxShadow? defined in com.facebook.react.uimanager.style.BoxShadow.Companion

> Task :expo-modules-core:compileReleaseKotlin FAILED
e: file:///home/runner/work/carousel/carousel/node_modules/expo-modules-core/android/src/main/java/expo/modules/rncompatibility/ReactNativeFeatureFlags.kt:11:62 Unresolved reference: enableBridgelessArchitecture

> Task :react-native-async-storage_async-storage:generateReleaseLintModel

> Task :react-native-screens:compileReleaseKotlin
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/CustomToolbar.kt:19:53 'FrameCallback' is deprecated. Use Choreographer.FrameCallback instead
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/CustomToolbar.kt:20:38 'FrameCallback' is deprecated. Use Choreographer.FrameCallback instead
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/RNScreensPackage.kt:64:17 'constructor ReactModuleInfo(String, String, Boolean, Boolean, Boolean, Boolean, Boolean)' is deprecated. use ReactModuleInfo(String, String, boolean, boolean, boolean, boolean)]
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/Screen.kt:45:77 Unchecked cast: CoordinatorLayout.Behavior<(raw) View!>? to BottomSheetBehavior<Screen>
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenContainer.kt:33:53 'FrameCallback' is deprecated. Use Choreographer.FrameCallback instead
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenContainer.kt:34:38 'FrameCallback' is deprecated. Use Choreographer.FrameCallback instead
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenFooter.kt:252:9 Parameter 'changed' is never used
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenFooter.kt:253:9 Parameter 'left' is never used
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenFooter.kt:254:9 Parameter 'top' is never used
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenFooter.kt:255:9 Parameter 'right' is never used
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenFooter.kt:256:9 Parameter 'bottom' is never used
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStackFragment.kt:257:31 'setter for targetElevation: Float' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStackFragment.kt:260:13 'setHasOptionsMenu(Boolean): Unit' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStackFragment.kt:496:22 'onPrepareOptionsMenu(Menu): Unit' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStackFragment.kt:504:22 'onCreateOptionsMenu(Menu, MenuInflater): Unit' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStackHeaderConfig.kt:100:38 'getter for systemWindowInsetTop: Int' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStackHeaderConfigViewManager.kt:7:34 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStackHeaderConfigViewManager.kt:209:9 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStackHeaderConfigViewManager.kt:211:13 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenStackHeaderConfigViewManager.kt:213:13 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenViewManager.kt:7:34 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenViewManager.kt:375:48 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenViewManager.kt:376:49 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenViewManager.kt:377:45 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenViewManager.kt:378:52 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenViewManager.kt:379:48 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenViewManager.kt:380:51 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenViewManager.kt:381:56 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenViewManager.kt:382:57 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenViewManager.kt:383:51 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:55:42 'replaceSystemWindowInsets(Int, Int, Int, Int): WindowInsetsCompat' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:56:39 'getter for systemWindowInsetLeft: Int' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:58:39 'getter for systemWindowInsetRight: Int' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:59:39 'getter for systemWindowInsetBottom: Int' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:98:53 'getter for statusBarColor: Int' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:109:48 'getter for statusBarColor: Int' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:112:32 'setter for statusBarColor: Int' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:208:72 'getter for navigationBarColor: Int' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/ScreenWindowTraits.kt:214:16 'setter for navigationBarColor: Int' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/SearchBarManager.kt:5:34 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/SearchBarManager.kt:138:66 Elvis operator (?:) always returns the left operand of non-nullable type Boolean
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/SearchBarManager.kt:142:9 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/SearchBarManager.kt:144:13 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/SearchBarManager.kt:146:13 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/SearchBarManager.kt:148:13 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/SearchBarManager.kt:150:13 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/SearchBarManager.kt:152:13 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/SearchBarManager.kt:154:13 'MapBuilder' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/SearchBarView.kt:153:43 Parameter 'flag' is never used
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/bottomsheet/BottomSheetDialogRootView.kt:7:34 'ReactFeatureFlags' is deprecated. Deprecated in Java
w: file:///home/runner/work/carousel/carousel/node_modules/react-native-screens/android/src/main/java/com/swmansion/rnscreens/bottomsheet/BottomSheetDialogRootView.kt:25:13 'ReactFeatureFlags' is deprecated. Deprecated in Java

FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':expo-modules-core:compileReleaseKotlin'.
> A failure occurred while executing org.jetbrains.kotlin.compilerRunner.GradleCompilerRunnerWithWorkers$GradleKotlinCompilerWorkAction
   > Compilation error. See log for more details

* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
> Get more help at https://help.gradle.org.

BUILD FAILED in 5m 43s
278 actionable tasks: 278 executed
Error: Process completed with exit code 1.