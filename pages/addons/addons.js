(function () {
    "use strict";

    var ui = WinJS.UI;

    ui.Pages.define("/DatingAppsShared/pages/addons/addons.html", {

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            $("#addonsFlyoutInner").css("background-color", AppInfo.color);

            Object.keys(AppOffers.offers).forEach(function (offerKey) {
                var offer = AppOffers.offers[offerKey];

                var enableButton = $("<input type='submit' /><br /><br /><br /><br />");

                $("#addons").append($("<h2>" + offer.name + "</h2><br />"));
                $("#addons").append($("<span>" + offer.description + "</span><br /><br />"));
                $("#addons").append(enableButton);

                if (!AppOffers.ownsOffer(offer.id)) {
                    enableButton.attr("value", "Enable");
                    enableButton.css("background-color", AppInfo.color);

                    enableButton.click(function () {
                        AppOffers.requestPurchase(offer.id, function () {
                            // success
                        },
                        function () {
                            // error
                        });
                    });
                }
                else {
                    enableButton.attr("value", "Enabled");
                    enableButton.css("background-color", "#000000");
                }
            });
        }
    });
})();