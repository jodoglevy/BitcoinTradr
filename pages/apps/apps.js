(function () {
    "use strict";

    var ui = WinJS.UI;

    ui.Pages.define("/pages/apps/apps.html", {

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            $("#appFlyoutInner").css("background-color", AppInfo.color);
        }
    });
})();