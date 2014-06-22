(function () {
    "use strict";

    var appView = Windows.UI.ViewManagement.ApplicationView;
    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var nav = WinJS.Navigation;
    var ui = WinJS.UI;
    var utils = WinJS.Utilities;

    var appBarDiv;
   
    var btcBalance = 0;
    var btcSpotRate = 0;

    ui.Pages.define("/pages/landing/landing.html", {

        // This function updates the ListView with new layouts
        initializeLayout: function (viewState) {
            var windowWidth = document.documentElement.offsetWidth;

            if (windowWidth > 550) {
                $("#bigDisplay").show();
                $("#littleDisplay").hide();
            }
            else {
                $("#bigDisplay").hide();
                $("#littleDisplay").show();
            }
        },

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            $(".pagetitle").html(AppInfo.title);

            $("header").css("background-color", AppInfo.color);
            $(".win-appbar").css("background-color", AppInfo.color);
            $("#extendedSplashScreen").css("background-color", AppInfo.color);

            var viewState = appView.value;
            this.initializeLayout(viewState);

            data.onDataUpdated(this.actOnNewData);

            $("#cmdRefresh").click(function () {
                appBarDiv.winControl.hide();
                data.refresh();
            });

            $("#cmdBuy").click(function () {
                appBarDiv.winControl.hide();
                data.setTrade("Buy");
            });

            $("#cmdSell").click(function () {
                appBarDiv.winControl.hide();
                data.setTrade("Sell");
            });

            $("#cmdSend").click(function () {
                appBarDiv.winControl.hide();
                data.setSend();
            });

            $("#cmdDonate").click(function () {
                appBarDiv.winControl.hide();
                data.setSend(AppInfo.appBitcoinAddress);
            });

            appBarDiv = document.querySelector("#appBar");
        },

        actOnNewData: function (err, response) {
            if (response.spotRate) {
                var now = new Date();
                btcSpotRate = response.spotRate.amount;

                $(".btcPrice").html("$" + btcSpotRate + " " + response.spotRate.currency);
                $(".currentTime").html(formatDate(now));
            }
            else if (response.user) {
                btcBalance = response.user.balance.amount;
                $(".btcBalanceBTC").html(toNDecimalPlaces(btcBalance, 5) + " BTC");
            }
            else if (response.account) {
                $("#transactionsListBig tr").each(function (i, element) {
                    if(i != 0) $(element).remove();
                });

                $("#transactionsListSmall tr").each(function (i, element) {
                    if (i != 0) $(element).remove();
                });

                for (var i = 0; i < response.account.account_changes.length; i++) {
                    var transaction = response.account.account_changes[i];
                    var transactionDate = new Date(transaction.created_at);
                    var dateLabel = formatDate(transactionDate, { "second": null });
                    var amountNum = parseFloat(transaction.amount.amount);

                    if (amountNum < 0) var amountTextColor = "#ff0000";
                    else var amountTextColor = "#00ff00";

                    if (transaction.cache.category == "transfer") {
                        var description = (amountNum > 0 ? "Purchased Bitcoin" : "Sold Bitcoin");
                        var smallDescription = (amountNum > 0 ? "Bought BTC" : "Sold BTC");
                    }
                    else {
                        var description = (amountNum > 0 ? "Received Bitcoin from " : "Sent Bitcoin to ") + transaction.cache.other_user.name;
                        var smallDescription = (amountNum > 0 ? "Received BTC" : "Sent BTC");
                    }

                    if (transaction.confirmed) var statusTextColor = "#000000";
                    else var statusTextColor = "#eeee00";

                    var amountLabel = amountNum + " BTC";
                    var smallDateLabel = dateLabel.split(",")[0];

                    var tdBig =
                        $("<tr id='" + transaction.id + "' class='transactionTrBig'>" +
                            "<td>" + dateLabel + "</td>" +
                            "<td>" + description + "</td>" +
                            "<td style='color:" + amountTextColor + "'>" + amountLabel + "</td>" +
                            "<td style='color:" + statusTextColor + "'>" + (transaction.confirmed ? "Completed" : "Pending") + "</td>" +
                        "</tr>");

                    var tdSmall =
                        $("<tr id='" + transaction.id + "' class='transactionTrSmall'>" +
                            "<td>" + smallDateLabel + "</td>" +
                            "<td>" + smallDescription + "</td>" +
                            "<td style='color:" + amountTextColor + "'>" + amountLabel + "</td>" +
                            "<td style='color:" + statusTextColor + "'>" + (transaction.confirmed ? "Yes" : "No") + "</td>" +
                        "</tr>");

                    if (i % 2 == 1) {
                        tdSmall.addClass("alt");
                        tdBig.addClass("alt");
                    }

                    $("#transactionsListBig").append(tdBig);
                    $("#transactionsListSmall").append(tdSmall);
                }
            }

            $(".btcBalanceCurrency").html("$" + toNDecimalPlaces(btcSpotRate * btcBalance, 2) + " " + data.getUserNativeCurrency());
        },

        // This function updates the page layout in response to viewState changes.
        updateLayout: function (element, viewState, lastViewState) {
            this.initializeLayout(viewState);
        },

        setVisible: function (control, visible) {
            if (visible) {
                control.element.style.display = "";
                control.forceLayout();
            }
            else {
                control.element.style.display="none";
            }
        }
    })

    function toNDecimalPlaces(num, n) {
        var rate = Math.pow(10, n);
        return Math.floor(Math.round(num * rate)) / rate
    }

    function formatDate(date, overrideDefaults) {
        var options = {
            year: "numeric", month: "short", day: "numeric",
            hour: "numeric", minute: "2-digit", second: "2-digit"
        };

        Object.keys(overrideDefaults || {}).forEach(function (key) {
            options[key] = overrideDefaults[key];

            if (!options[key]) delete options[key];
        });

        return date.toLocaleTimeString("en-us", options);
    }

})();
