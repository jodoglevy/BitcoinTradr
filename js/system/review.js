(function () {
    "use strict";

    var localSettings = Windows.Storage.ApplicationData.current.localSettings;
    
    function appWasOpenedByUser() {
        if (!localSettings.values["timesOpened"]) localSettings.values["timesOpened"] = 0;
        
        setTimeout(function () {
            if (localSettings.values["timesOpened"] < 5) {
                localSettings.values["timesOpened"] = localSettings.values["timesOpened"] + 1;

                if (localSettings.values["timesOpened"] == 5) {
                    var msg = new Windows.UI.Popups.MessageDialog("Hey there! If you're enjoying " + AppInfo.title + ", would you mind posting a review?  Don't worry, we won't ask you again.", "Spread the Word!");

                    // Add commands and set their CommandIds 
                    msg.commands.append(new Windows.UI.Popups.UICommand("Review " + AppInfo.title, null, 1));
                    msg.commands.append(new Windows.UI.Popups.UICommand("No thanks", null, 2));

                    // Set the command that will be invoked by default 
                    msg.defaultCommandIndex = 2;

                    // Show the message dialog 
                    msg.showAsync().done(function (command) {
                        if (command && command.id == 1) {
                            var uri = new Windows.Foundation.Uri("ms-windows-store:REVIEW?PFN=" + AppInfo.storeId);
                            Windows.System.Launcher.launchUriAsync(uri);
                        }
                    });
                }
            }
        }, 5000);
    }

    WinJS.Namespace.define("Review", {
        appWasOpenedByUser: appWasOpenedByUser,
    });

})();