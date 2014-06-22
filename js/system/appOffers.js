(function () {
    "use strict";

    var currentApp = Windows.ApplicationModel.Store.CurrentApp; // production
    //var currentApp = Windows.ApplicationModel.Store.CurrentAppSimulator; // testing

    var licenseInformation = currentApp.licenseInformation;

    var offers = {
        noAds: {
            id: "NoAds",
            name: "Remove Advertisements",
            description: "Remove all advertisements from " + AppInfo.title + ", permanently."
        },
    };

    var onLicenseChangedFuncs = [];

    licenseInformation.addEventListener("licensechanged", onLicenseChanged);

    function onLicenseChanged() {
        onLicenseChangedFuncs.forEach(function (func) {
            func();
        });
    };

    function requestPurchase(offerId, successCallback, errorCallback) {
        currentApp.requestProductPurchaseAsync(offerId, false).then(
            function () {
                onLicenseChanged();
                successCallback();
            },
            errorCallback
        );
    }

    function addOnLicenseChangedFunc(func) {
        onLicenseChangedFuncs.push(func);
    };

    function ownsOffer(offerId) {
        return licenseInformation.productLicenses.lookup(offerId).isActive
    }    

    WinJS.Namespace.define("AppOffers", {
        addOnLicenseChangedFunc: addOnLicenseChangedFunc,
        ownsOffer: ownsOffer,
        requestPurchase: requestPurchase,
        offers: offers,
    });
})();