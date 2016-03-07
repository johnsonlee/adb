## Overview

Android Debug Bridge (ADB) Library for Chrome Application is used to access
Android devices in Chrome Application via [ADB Protocol](https://android.googlesource.com/platform/system/core/+/master/adb/protocol.txt).

## Reference

Please see [here](https://rawgit.com/johnsonlee/adb/master/reference/index.html)

## Usage

```javascript
adb.listDevices().then(function(devices) {
    devices.forEach(function(device) {
        console.log(JSON.stringify(device));
    });
});
```
