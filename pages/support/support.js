(function () {
    "use strict";

    var ui = WinJS.UI;
    var localSettings = Windows.Storage.ApplicationData.current.localSettings;

    ui.Pages.define("/pages/support/support.html", {

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            $("#feedbackUrl").attr("href", AppInfo.feedbackUrl).css("color", AppInfo.color);
            $("#supportEmail").attr("href", AppInfo.supportEmail).css("color", AppInfo.color);

            $("#debugFlyoutInner").css("background-color", AppInfo.color);

            $(".appTitleReplace").html(AppInfo.title);

            var debugSwitch = document.querySelector("#debugSwitch").winControl;
            
            debugSwitch.checked = localSettings.values["debugMode"];

            debugSwitch.onchange = function () {
                localSettings.values["debugMode"] = debugSwitch.checked;
            };
        }
    });
})();