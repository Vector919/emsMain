
$currentVersion = $oldVersion = ([string](dir *.apk | select BaseName)[0]).split('-')[2].split('}')[0].Split(".")
$currentVersion[3] = [int]$currentVersion[3] + 1
$currentVersion -join "."

Remove-Item *.apk

Copy-Item platforms\android\build\outputs\apk\android-debug.apk ("hashtagEMS-debug-"+($currentVersion -join ".")+".apk")
Copy-Item platforms\android\build\outputs\apk\android-release-unsigned.apk ("hashtagEMS-release-unsigned-"+($currentVersion -join ".")+".apk")
