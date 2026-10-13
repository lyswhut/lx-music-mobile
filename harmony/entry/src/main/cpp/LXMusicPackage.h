#pragma once

#include "RNOH/ArkTSTurboModule.h"
#include "RNOH/Package.h"

namespace rnoh {

class UtilsModule : public ArkTSTurboModule {
 public:
  UtilsModule(const ArkTSTurboModule::Context ctx, const std::string& name)
      : ArkTSTurboModule(ctx, name) {
    methodMap_ = {
        ARK_SCHEDULE_METHOD_METADATA(exitApp, 0),
        ARK_ASYNC_METHOD_METADATA(getSupportedAbis, 0),
        ARK_ASYNC_METHOD_METADATA(installApk, 2),
        ARK_SCHEDULE_METHOD_METADATA(screenkeepAwake, 0),
        ARK_SCHEDULE_METHOD_METADATA(screenUnkeepAwake, 0),
        ARK_ASYNC_METHOD_METADATA(getWIFIIPV4Address, 0),
        ARK_ASYNC_METHOD_METADATA(getDeviceName, 0),
        ARK_ASYNC_METHOD_METADATA(openDocument, 2),
        ARK_ASYNC_METHOD_METADATA(isNotificationsEnabled, 0),
        ARK_ASYNC_METHOD_METADATA(openNotificationPermissionActivity, 0),
        ARK_ASYNC_METHOD_METADATA(shareText, 3),
        ARK_ASYNC_METHOD_METADATA(getSystemLocales, 0),
        ARK_ASYNC_METHOD_METADATA(getWindowSize, 0),
        ARK_SCHEDULE_METHOD_METADATA(listenWindowSizeChanged, 0),
        ARK_ASYNC_METHOD_METADATA(isIgnoringBatteryOptimization, 0),
        ARK_ASYNC_METHOD_METADATA(requestIgnoreBatteryOptimization, 0),
        ARK_SCHEDULE_METHOD_METADATA(addListener, 1),
        ARK_SCHEDULE_METHOD_METADATA(removeListeners, 1),
        ARK_SCHEDULE_METHOD_METADATA(removeListener, 1),
    };
  }
};

class TrackPlayerModule : public ArkTSTurboModule {
 public:
  TrackPlayerModule(const ArkTSTurboModule::Context ctx, const std::string& name)
      : ArkTSTurboModule(ctx, name) {
    methodMap_ = {
        ARK_ASYNC_METHOD_METADATA(setupPlayer, 1),
        ARK_ASYNC_METHOD_METADATA(destroy, 0),
        ARK_ASYNC_METHOD_METADATA(add, 2),
        ARK_ASYNC_METHOD_METADATA(remove, 1),
        ARK_ASYNC_METHOD_METADATA(removeUpcomingTracks, 0),
        ARK_ASYNC_METHOD_METADATA(skip, 1),
        ARK_ASYNC_METHOD_METADATA(skipToNext, 0),
        ARK_ASYNC_METHOD_METADATA(skipToPrevious, 0),
        ARK_ASYNC_METHOD_METADATA(updateOptions, 1),
        ARK_ASYNC_METHOD_METADATA(updateMetadataForTrack, 2),
        ARK_ASYNC_METHOD_METADATA(clearNowPlayingMetadata, 0),
        ARK_ASYNC_METHOD_METADATA(updateNowPlayingMetadata, 1),
        ARK_ASYNC_METHOD_METADATA(updateNowPlayingTitles, 1),
        ARK_ASYNC_METHOD_METADATA(reset, 0),
        ARK_ASYNC_METHOD_METADATA(play, 0),
        ARK_ASYNC_METHOD_METADATA(pause, 0),
        ARK_ASYNC_METHOD_METADATA(stop, 0),
        ARK_ASYNC_METHOD_METADATA(seekTo, 1),
        ARK_ASYNC_METHOD_METADATA(setVolume, 1),
        ARK_ASYNC_METHOD_METADATA(setRate, 1),
        ARK_ASYNC_METHOD_METADATA(setRepeatMode, 1),
        ARK_ASYNC_METHOD_METADATA(getVolume, 0),
        ARK_ASYNC_METHOD_METADATA(getRate, 0),
        ARK_ASYNC_METHOD_METADATA(getQueue, 0),
        ARK_ASYNC_METHOD_METADATA(getCurrentTrack, 0),
        ARK_ASYNC_METHOD_METADATA(getDuration, 0),
        ARK_ASYNC_METHOD_METADATA(getBufferedPosition, 0),
        ARK_ASYNC_METHOD_METADATA(getPosition, 0),
        ARK_ASYNC_METHOD_METADATA(getState, 0),
        ARK_ASYNC_METHOD_METADATA(getRepeatMode, 0),
    };
  }
};

class CryptoModule : public ArkTSTurboModule {
 public:
  CryptoModule(const ArkTSTurboModule::Context ctx, const std::string& name)
      : ArkTSTurboModule(ctx, name) {
    methodMap_ = {
        ARK_ASYNC_METHOD_METADATA(generateRsaKey, 0),
        ARK_ASYNC_METHOD_METADATA(rsaEncrypt, 3),
        ARK_ASYNC_METHOD_METADATA(rsaDecrypt, 3),
        ARK_METHOD_METADATA(rsaEncryptSync, 3),
        ARK_METHOD_METADATA(rsaDecryptSync, 3),
        ARK_ASYNC_METHOD_METADATA(aesEncrypt, 4),
        ARK_ASYNC_METHOD_METADATA(aesDecrypt, 4),
        ARK_METHOD_METADATA(aesEncryptSync, 4),
        ARK_METHOD_METADATA(aesDecryptSync, 4),
        ARK_ASYNC_METHOD_METADATA(sha1, 1),
    };
  }
};

class UserApiModule : public ArkTSTurboModule {
 public:
  UserApiModule(const ArkTSTurboModule::Context ctx, const std::string& name)
      : ArkTSTurboModule(ctx, name) {
    methodMap_ = {
        ARK_SCHEDULE_METHOD_METADATA(loadScript, 1),
        ARK_SCHEDULE_METHOD_METADATA(sendAction, 2),
        ARK_SCHEDULE_METHOD_METADATA(destroy, 0),
    };
  }
};

class BackgroundTimerModule : public ArkTSTurboModule {
 public:
  BackgroundTimerModule(const ArkTSTurboModule::Context ctx, const std::string& name)
      : ArkTSTurboModule(ctx, name) {
    methodMap_ = {
        ARK_SCHEDULE_METHOD_METADATA(setTimeout, 2),
        ARK_SCHEDULE_METHOD_METADATA(clearTimeout, 1),
        ARK_SCHEDULE_METHOD_METADATA(start, 1),
        ARK_SCHEDULE_METHOD_METADATA(stop, 0),
    };
  }
};

class DownloadModule : public ArkTSTurboModule {
 public:
  DownloadModule(const ArkTSTurboModule::Context ctx, const std::string& name)
      : ArkTSTurboModule(ctx, name) {
    methodMap_ = {
        ARK_ASYNC_METHOD_METADATA(prepareDirectory, 0),
        ARK_ASYNC_METHOD_METADATA(downloadMusic, 3),
        ARK_SCHEDULE_METHOD_METADATA(cancelDownload, 1),
    };
  }
};

class LXMusicTurboModuleFactoryDelegate : public TurboModuleFactoryDelegate {
 public:
  SharedTurboModule createTurboModule(Context ctx, const std::string& name) const override {
    if (name == "UtilsModule") return std::make_shared<UtilsModule>(ctx, name);
    if (name == "LXTrackPlayer") return std::make_shared<TrackPlayerModule>(ctx, name);
    if (name == "RNBackgroundTimer") return std::make_shared<BackgroundTimerModule>(ctx, name);
    if (name == "CryptoModule") return std::make_shared<CryptoModule>(ctx, name);
    if (name == "UserApiModule") return std::make_shared<UserApiModule>(ctx, name);
    if (name == "LXDownload") return std::make_shared<DownloadModule>(ctx, name);
    return nullptr;
  }
};

class LXMusicPackage : public Package {
 public:
  LXMusicPackage(Package::Context ctx) : Package(ctx) {}

  std::unique_ptr<TurboModuleFactoryDelegate> createTurboModuleFactoryDelegate() override {
    return std::make_unique<LXMusicTurboModuleFactoryDelegate>();
  }
};

}
