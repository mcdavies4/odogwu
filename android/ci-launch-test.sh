#!/usr/bin/env bash
# Runs inside the GitHub emulator: install the app, tap the icon, record what happened.
set -x
mkdir -p launch-test
APK=$(ls apk/*.apk | head -1)
PKG=online.odogwu.app
adb install -r "$APK" > launch-test/install.txt 2>&1
{
  echo "== Browsers on the test phone"
  adb shell pm list packages | grep -iE "chrome|webview|browser"
  echo; echo "== App installed?"
  adb shell pm list packages | grep -i "$PKG"
} > launch-test/summary.txt 2>&1
adb logcat -c
adb shell am start -W -n "$PKG/$PKG.LauncherActivity" >> launch-test/summary.txt 2>&1
sleep 35
adb exec-out screencap -p > launch-test/after-tap.png
{
  echo; echo "== What's on screen after 35 seconds"
  adb shell dumpsys activity activities | grep -E "mResumedActivity|topResumedActivity|ResumedActivity" | head -5
  echo; echo "== Errors and app messages"
  adb logcat -d | grep -iE "FATAL|AndroidRuntime|TwaLauncher|TrustedWebActivity|androidbrowserhelper|$PKG|LauncherActivity" | tail -120
} >> launch-test/summary.txt 2>&1
adb logcat -d > launch-test/full-logcat.txt
cat launch-test/summary.txt
