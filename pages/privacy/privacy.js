(function () {
    "use strict";

    var ui = WinJS.UI;
    
    ui.Pages.define("/pages/privacy/privacy.html", {

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            var uri = new Windows.Foundation.Uri(AppInfo.privacyUrl);
            Windows.System.Launcher.launchUriAsync(uri);
        },
    });
})();