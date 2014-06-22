(function () {
    "use strict";

    var nav = WinJS.Navigation;
    var passwordVault = new Windows.Security.Credentials.PasswordVault();
    var localSettings = Windows.Storage.ApplicationData.current.localSettings;

    var dataHandler = null;
   
    var loginInfoToSave = null;
    var loginResourceName = AppInfo.siteName + " Account Credentials";
    var isLoggedIn = false;

    var noInternetError = "No Internet Connection!"

    var dataUpdatedFunctions = [];

    var shouldKeepShowingLoginPage = true;

    var newSendDetails = {};
    var newTradeDetails = {};
        
    function connect(apiKey, apiSecret, saveLoginInfo) {
        // initial connect at app start
        if (!apiKey || !apiSecret) {
            try {
                var view = passwordVault.findAllByResource(loginResourceName);
                var credential = view.getAt(0);

                credential.retrievePassword();
                apiKey = credential.userName;
                apiSecret = credential.password;

                if (apiKey == "credential") {
                    // user has a credential from when we supported simple api auth, make them enter new creds
                    askForLogin();
                }
                else {
                    init(apiKey, apiSecret, false, false);
                }
            }
            catch (ex) {
                // no login info stored
                askForLogin();
            }
        }
            // manual request to change login info
        else {
            revokeLoginCredentials();
            init(apiKey, apiSecret, true, saveLoginInfo);
        }
    }

    function revokeLoginCredentials() {
        try {
            var view = passwordVault.findAllByResource(loginResourceName);
            var credentialToRemove = view.getAt(0);
            passwordVault.remove(credentialToRemove);
        }
        catch (ex) { }
    }

    function saveLoginCredentials() {
        if (!loginInfoToSave) return;

        revokeLoginCredentials();

        var credential = new Windows.Security.Credentials.PasswordCredential(
            loginResourceName,
            loginInfoToSave.apiKey,
            loginInfoToSave.apiSecret
        );
        passwordVault.add(credential);

        loginInfoToSave = null;
    }

    function init(apiKey, apiSecret, isManualLogin, saveLoginInfo) {
        // make sure we've asked for background access
        Overlord.requestBackgroundAccess();

        ExtendedSplash.showProgressRing();

        if (saveLoginInfo) {
            loginInfoToSave = {
                apiKey: apiKey,
                apiSecret: apiSecret
            };
        }
        else loginInfoToSave = null;

        if (dataHandler) {
            dataHandler.setCredentials(apiKey, apiSecret, isManualLogin);
            checkLogin();
        }
        else {
            dataHandler = new DataHandler(apiKey, apiSecret, isManualLogin);

            Overlord.onActivated(dataHandler.onActivated);
            Overlord.onStopped(dataHandler.onStopped);

            dataHandler.loadData(function () {
                checkLogin();
            });
        }
    }

    function checkLogin() {
        var functions = {
            user: getUserData,
            account: listAccountChanges,
            spotRate: getSpotRate
        };

        async.series(functions, function (err, data) {
            if (!err) {
                isLoggedIn = true;

                dataUpdatedFunctions.forEach(function (func) {
                    func(null, data);
                });
                ExtendedSplash.remove();

                if (loginInfoToSave) saveLoginCredentials();

                dataHandler.saveData();
                
                pollForSpotRate();
                pollForData();
            }
            else if (dataHandler.loginFailed()) {
                shouldKeepShowingLoginPage = true;
                askForLogin();
            }

            if (!hasInternet()) {
                $("#errorText").html(noInternetError);
            }
            else $("#errorText").html("");

            if (err && localSettings.values["debugMode"]) MK.trace("initial login failed", err);
        });
    };

    function pollForSpotRate() {
        setTimeout(function () {
            getSpotRate(function (err, data) {
                pollForSpotRate();
            });
        }, 30000);
    }

    function pollForData() {
        setTimeout(function () {
            var functions = {
                user: getUserData,
                account: listAccountChanges
            };

            async.series(functions, function (err, data) {
                pollForData();
            });
        }, 60000);
    }

    function askForLogin() {
        isLoggedIn = false;
        revokeLoginCredentials();

        // timeout forces the login page to show after landing page's onready event so
        // that text input will go to login page not search bar
        setTimeout(function () {
            WinJS.UI.SettingsFlyout.showSettings("account", "/pages/login/login.html");
        }, 500);

        setTimeout(function () {
            if (shouldKeepShowingLoginPage && (!dataHandler || dataHandler.loginFailed())) askForLogin();
        }, 5000);
    }

    function loggedIn() {
        return isLoggedIn;
    }

    function hasInternet() {
        var profile = Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile();

        if (profile) return (profile.getNetworkConnectivityLevel() != Windows.Networking.Connectivity.NetworkConnectivityLevel.none);
        else return false;
    }

    function onDataUpdated(onDataUpdatedFunction) {
        dataUpdatedFunctions.push(onDataUpdatedFunction);
    }

    function getUserNativeCurrency() {
        return dataHandler.getUserNativeCurrency();
    }

    function getSpotRate(callback) {
        $("#mainProgressRing").fadeIn();

        dataHandler.getSpotRate(function (err, data) {

            dataUpdatedFunctions.forEach(function (func) {
                func(null, { spotRate: data });
            });

            callback(err, data);

            $("#mainProgressRing").fadeOut();

            if (data) {
                Notifications.updateTile(data.amount, null);
                $("#errorText").html("");
            }
            else if (!hasInternet()) $("#errorText").html(noInternetError);
        });
    }

    function signUp(username, password, callback) {
        var noDataHandler = !dataHandler;

        if (noDataHandler) dataHandler = new DataHandler("", false);

        dataHandler.signUp(username, password, function (err, response) {
            if (noDataHandler) dataHandler = null;
            callback(err, response);
        });
    }

    function getCurrencyExchangeRates(callback) {
        dataHandler.getCurrencyExchangeRates(callback);
    }

    function listAccountChanges(callback) {
        $("#mainProgressRing").fadeIn();

        dataHandler.listAccountChanges(function (err, data) {

            dataUpdatedFunctions.forEach(function (func) {
                func(null, { account: data });
            });

            callback(err, data);

            $("#mainProgressRing").fadeOut();
        });
    }

    function getUserData(callback) {
        $("#mainProgressRing").fadeIn();

        dataHandler.getUserData(function (err, data) {

            dataUpdatedFunctions.forEach(function (func) {
                func(null, { user: data });
            });

            callback(err, data);

            $("#mainProgressRing").fadeOut();

            if (data) {
                Notifications.updateTile(null, data.balance.amount);
                $("#errorText").html("");
            }
            else if (!hasInternet()) $("#errorText").html(noInternetError);
        });
    }

    function setShouldKeepShowingLoginPage(newShouldKeepShowingLoginPageValue) {
        shouldKeepShowingLoginPage = newShouldKeepShowingLoginPageValue;
    }

    function refresh() {
        getSpotRate(function () { });
        listAccountChanges(function () { });
        getUserData(function () { });
    }

    function setSend(toAddress, toPerson, amount, currency, note, error) {
        newSendDetails = {
            toAddress: toAddress,
            toPerson: toPerson,
            amount: amount,
            currency: currency,
            note: note,
            error: error
        };

        WinJS.UI.SettingsFlyout.showSettings("send", "/pages/send/send.html");
    }

    function setTrade(action, amount, error) {
        newTradeDetails = {
            action: action,
            amount: amount,
            error: error
        };

        WinJS.UI.SettingsFlyout.showSettings("trade", "/pages/trade/trade.html");
    }

    function tradeBitcoin(action, amount, confirmTrade, callback) {
        if (action == "Buy") {
            var tradeFunc = dataHandler.buyBitcoin;
            var tradePriceFunc = data.getBuyPrice;
        }
        else {
            var tradeFunc = dataHandler.sellBitcoin;
            var tradePriceFunc = data.getSellPrice;
        }

        if (confirmTrade) tradeFunc(amount, callback, dataHandler);
        else {
            tradePriceFunc(amount, function (err, response) {
                var amountUSD = response.amount;
                var msgString = "Are you sure you want to " + action.toLowerCase() + " " + amount + " Bitcoin for ≈ $" + amountUSD + " USD?"

                var msg = new Windows.UI.Popups.MessageDialog(msgString);
                msg.commands.append(new Windows.UI.Popups.UICommand("Confirm", null, 0));
                msg.commands.append(new Windows.UI.Popups.UICommand("Cancel", null, 1));

                // Set the command that will be invoked by default 
                msg.defaultCommandIndex = 0;

                // Show the message dialog 
                msg.showAsync().done(function (command) {
                    if (command.id == 0) {
                        data.tradeBitcoin(action, amount, true, callback);
                    }
                    else {
                        data.setTrade(action, amount);
                    }
                });
            });
        }
    }

    function sendBitcoin(toEmailOrBitcoinAddress, amount, currency, note, contact, confirmSend, callback) {
        var toAddress = contact.email || toEmailOrBitcoinAddress;
        var toName = contact.title || toEmailOrBitcoinAddress;

        if (confirmSend) dataHandler.sendBitcoin(toAddress, amount, currency, note, callback);
        else {
            var msgString = "Are you sure you want to send "
            if (currency == "USD") {
                msgString += "$"
            }
            msgString += "" + amount + " " + currency + " to " + toName + "?"

            var msg = new Windows.UI.Popups.MessageDialog(msgString);
            msg.commands.append(new Windows.UI.Popups.UICommand("Confirm", null, 0));
            msg.commands.append(new Windows.UI.Popups.UICommand("Cancel", null, 1));

            // Set the command that will be invoked by default 
            msg.defaultCommandIndex = 0;

            // Show the message dialog 
            msg.showAsync().done(function (command) {
                if (command.id == 0) {
                    dataHandler.sendBitcoin(toAddress, amount, currency, note, callback);
                }
                else {
                    data.setSend(toEmailOrBitcoinAddress, contact, amount, currency, note);
                }
            });
        }
    }

    function getContacts(callback) {
        dataHandler.getContacts(callback);
    }

    function getBuyPrice(numberOfBitcoinsToBuy, callback) {
        dataHandler.getBuyPrice(numberOfBitcoinsToBuy, callback);
    }

    function getSellPrice(numberOfBitcoinsToSell, callback) {
        dataHandler.getSellPrice(numberOfBitcoinsToSell, callback);
    }

    WinJS.Namespace.define("data", {
        connect: connect,
        loginFailed: function () {
            if (dataHandler) return !isLoggedIn;
            else return false;
        },
        hasInternet: hasInternet,
        loggedIn: loggedIn,
        onDataUpdated: onDataUpdated,
        getUserNativeCurrency: getUserNativeCurrency,
        getUserData: getUserData,
        listAccountChanges: listAccountChanges,
        getSpotRate: getSpotRate,
        signUp: signUp,
        setShouldKeepShowingLoginPage: setShouldKeepShowingLoginPage,
        askForLogin: askForLogin,
        refresh: refresh,
        setSend: setSend,
        setTrade: setTrade,
        grabNewSendDetails: function () {
            return newSendDetails;
        },
        grabNewTradeDetails: function () {
            return newTradeDetails;
        },
        getContacts: getContacts,
        sendBitcoin: sendBitcoin,
        getCurrencyExchangeRates: getCurrencyExchangeRates,
        getBuyPrice: getBuyPrice,
        getSellPrice: getSellPrice,
        tradeBitcoin: tradeBitcoin
    });
})();