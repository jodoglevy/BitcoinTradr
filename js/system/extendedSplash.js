//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

(function () {
    "use strict";
    var cantHideSplash = false;
    var onHideSplashScreen = null;

    // Displays the extended splash screen. Pass the splash screen object retrieved during activation and path to the splash screen image.
    function show(splash, onHideSplashScreenTemp, cantHideSplashTemp) {
        cantHideSplash = cantHideSplashTemp;
        onHideSplashScreen = onHideSplashScreenTemp;

        // Initialize the extended splash screen image using the path provided by the caller.
        var extendedSplashImage = document.getElementById("extendedSplashImage");
        extendedSplashImage.style.position = "absolute";

        // Position the extended splash screen image in the same location as the system splash screen image.
        extendedSplashImage.style.top = splash.imageLocation.y + "px";
        extendedSplashImage.style.left = splash.imageLocation.x + "px";
        extendedSplashImage.style.height = splash.imageLocation.height + "px";
        extendedSplashImage.style.width = splash.imageLocation.width + "px";

        // Position the extended splash screen's progress ring. Note: In this sample, the progress ring is not used.
        var extendedSplashProgress = document.getElementById("extendedSplashProgress");
        extendedSplashProgress.style.position = "absolute";
        extendedSplashProgress.style.bottom = splash.imageLocation.y + splash.imageLocation.height + 32 + "px";
        extendedSplashProgress.style.left = splash.imageLocation.x + (splash.imageLocation.width / 2.15) + "px";

        // Once the extended splash screen is setup, apply the CSS style that will make the extended splash screen visible.
        var extendedSplashScreen = document.getElementById("extendedSplashScreen");
        WinJS.Utilities.removeClass(extendedSplashScreen, "hidden");

        extendedSplashProgress.style.visibility = "hidden";
    }

    function showProgressRing() {
        document.getElementById("extendedSplashProgress").style.visibility = "visible";
    }

    // Updates the location of the extended splash screen image. Should be used to respond to window size changes.
    function updateImageLocation(splash) {
        if (isVisible()) {
            var extendedSplashImage = document.getElementById("extendedSplashImage");

            // Position the extended splash screen image in the same location as the system splash screen image.
            extendedSplashImage.style.top = splash.imageLocation.y + "px";
            extendedSplashImage.style.left = splash.imageLocation.x + "px";
            extendedSplashImage.style.height = splash.imageLocation.height + "px";
            extendedSplashImage.style.width = splash.imageLocation.width + "px";

            // Position the extended splash screen's progress ring. Note: In this sample, the progress ring is not used.
            var extendedSplashProgress = document.getElementById("extendedSplashProgress");
            extendedSplashProgress.style.marginTop = splash.imageLocation.y + splash.imageLocation.height + 32 + "px";
        }
    }

    // Checks whether the extended splash screen is visible and returns a boolean.
    function isVisible() {
        var extendedSplashScreen = document.getElementById("extendedSplashScreen");
        return !(WinJS.Utilities.hasClass(extendedSplashScreen, "hidden"));
    }

    // Removes the extended splash screen if it is currently visible.
    function remove() {
        if (isVisible() && (!cantHideSplash)) {
            var extendedSplashScreen = document.getElementById("extendedSplashScreen");
            extendedSplashScreen.style.display = "none";

            WinJS.Utilities.addClass(extendedSplashScreen, "hidden");

            Ads.setReadyToShow();
        }

        if (onHideSplashScreen) onHideSplashScreen();
    }

    WinJS.Namespace.define("ExtendedSplash", {
        show: show,
        showProgressRing: showProgressRing,
        updateImageLocation: updateImageLocation,
        isVisible: isVisible,
        remove: remove
    });
})();