require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

new_arch_enabled = ENV['RCT_NEW_ARCH_ENABLED'] == '1'
platform = new_arch_enabled ? "11.0" : "9.0"
source_files = new_arch_enabled ? 'ios/**/*.{h,m,mm,cpp}' : ["ios/**/*.{h,m,mm}", "cpp/RNScreensTurboModule.cpp", "cpp/RNScreensTurboModule.h"]

Pod::Spec.new do |s|
  s.name         = "RNScreens"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.description  = <<-DESC
                  RNScreens - first incomplete navigation solution for your React Native app
                   DESC
  s.homepage     = "https://github.com/software-mansion/react-native-screens"
  s.license      = "MIT"
  s.author       = { "author" => "author@domain.cn" }
  s.platforms    = { :ios => platform, :tvos => "11.0", :visionos => "1.0" }
  s.source       = { :git => "https://github.com/software-mansion/react-native-screens.git", :tag => "#{s.version}" }
  s.source_files = source_files
  s.project_header_files = "cpp/**/*.h" # Don't expose C++ headers publicly to allow importing framework into Swift files
  s.requires_arc = true

  install_modules_dependencies(s)
  if new_arch_enabled
    s.subspec "common" do |ss|
      ss.source_files         = ["common/cpp/**/*.{cpp,h}", "cpp/**/*.{cpp,h}"]
      ss.header_dir           = "rnscreens"
      ss.pod_target_xcconfig  = { "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/common/cpp\"" }
    end
  end

  s.dependency "React-RCTImage"
end
