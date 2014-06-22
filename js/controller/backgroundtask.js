(function () {
    "use strict";
    importScripts("//Microsoft.WinJS.2.0/js/base.js", "/js/lib/async/async.js", "/js/system/appInfo.js", "/js/controller/dataHandler.js", "/js/model/coinbase.js", "/js/system/notifier.js");

    var backgroundTask = Windows.UI.WebUI.WebUIBackgroundTaskInstance.current;
    var taskName = backgroundTask.task.name;
    var settings = Windows.Storage.ApplicationData.current.localSettings;

    var now = new Date();
    var tenSeconds = 10000;

    // force only one instance of the background task to run. Stops task from running multiple times within 10 seconds 
    if (settings.values.hasKey(taskName) && (now - settings.values[taskName] < tenSeconds)) return close();
    else settings.values[taskName] = now;

    backgroundTask.addEventListener("canceled", function (cancelSender, cancelReason) {
        endTask(0, false);
    });

    var passwordVault = new Windows.Security.Credentials.PasswordVault();
    var loginResourceName = AppInfo.siteName + " Account Credentials"; // must match loginResourceName in data.js!
    var username = "";
    var password = "";
    var hasUsernameAndPassword = false;

    try {
        var view = passwordVault.findAllByResource(loginResourceName);
        var credential = view.getAt(0);
        credential.retrievePassword();

        username = credential.userName
        password = credential.password;

        hasUsernameAndPassword = true;
    }
    catch (ex) { }

    var dataHandler = new DataHandler(password, false);

    if (hasUsernameAndPassword) {
        dataHandler.loadData(function () {
            var funcs = {
                spotRate: function (callback) { dataHandler.getSpotRate(callback) },
                userData: function(callback) { dataHandler.getUserData(callback) }
            };

            async.series(funcs, function(err, data) {
                if (data) Notifications.updateTile(data.spotRate.amount, data.userData.balance.amount);
            });
        });
    }
    else endTask(0, false);

    function endTask(progress, succeeded) {
        backgroundTask.progress = progress;
        backgroundTask.succeeded = succeeded;
        close();
    }

})();