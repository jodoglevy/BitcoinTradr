(function () {
    "use strict";

    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var appView = Windows.UI.ViewManagement.ApplicationView;
    var readyToShow = false;
    var createdAds = false;

    AppOffers.addOnLicenseChangedFunc(updateAds);

    function updateAds() {
        if (!createdAds && AppInfo.ads.applicationId) {
            var fullAdControl = new MicrosoftNSJS.Advertising.AdControl(document.getElementById("fullViewAd"),
            {
                applicationId: AppInfo.ads.applicationId,
                adUnitId: AppInfo.ads.adUnitId
            });

            var filledAdControl = new MicrosoftNSJS.Advertising.AdControl(document.getElementById("filledViewAd"),
            {
                applicationId: AppInfo.ads.applicationId,
                adUnitId: AppInfo.ads.adUnitId
            });

            createdAds = true;
        }

        if (!readyToShow) return;

        if (AppOffers.ownsOffer(AppOffers.offers.noAds.id) || (!AppInfo.ads.applicationId)) {
            $('#fullViewAd').hide();
            $('#filledViewAd').hide();
        }
        else {
            if (appView.value === appViewState.snapped) {
                $('#fullViewAd').hide();
                $('#filledViewAd').hide();
            }
            else if (appView.value === appViewState.filled) {
                $('#fullViewAd').hide();
                $('#filledViewAd').show();

                // check if the amount of filled ads on the screen is enough for it to count as an impression
                //console.log(document.querySelector('#filledViewAd').winControl._isOnScreen());
            }
            else {
                $('#fullViewAd').show();
                $('#filledViewAd').hide();
            }
        }
    }

    function dispose() {
        document.querySelector('#fullViewAd').winControl.dispose();
        document.querySelector('#filledViewAd').winControl.dispose();
    }

    function setReadyToShow() {
        readyToShow = true;
        updateAds();
    }

    WinJS.Namespace.define("Ads", {
        updateAds: updateAds,
        setReadyToShow: setReadyToShow,
        dispose: dispose
    });
})();