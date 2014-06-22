(function () {
    "use strict";

    var ui = WinJS.UI;

    ui.Pages.define("/pages/trade/trade.html", {
    
        getInfo: function() {
            var tradeDetails = {
                action: null,
                amount: "",
                error: null
            };

            tradeDetails.amount = parseFloat($("#amount").val());
            tradeDetails.action = $("#tradeAction").val();
            
            return tradeDetails;
        },

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            var me = this;
            var tradeDetails = data.grabNewTradeDetails();

            $("#tradeFlyoutInner").css("background-color", AppInfo.color);
            $("#resetButton").css("background-color", AppInfo.color);
            $("#tradeButton").css("background-color", AppInfo.color);

            $("#tradeAction").val(tradeDetails.action);
            $("#tradeActionLabel").html(tradeDetails.action.toLowerCase());
            $("#tradeButton").val(tradeDetails.action);

            if (tradeDetails.amount) $("#amount").val(tradeDetails.amount);
            if (tradeDetails.error) me.sayError(tradeDetails.error);

            this.convertCurrency();

            $('#tradeForm').submit(function () {
                return false;
            });

            $("#resetButton").click(function () {
                $("#amount").val("");

                $("#tradeAction").val("Buy");
                $("#tradeActionLabel").html("buy");
                $("#tradeButton").val("Buy");
                
                $("#signupError").hide();
                
                me.convertCurrency();
            });

            var tradeIt = function () {
                var tradeDetails = me.getInfo();

                if (!tradeDetails.amount || isNaN(tradeDetails.amount) || tradeDetails.amount <= 0) me.sayError("Please enter a valid amount to trade");
                else {
                    data.tradeBitcoin(tradeDetails.action, tradeDetails.amount, false, function (err, response) {
                        if (err || response.errors) {
                            var error = err ? err.response : response.errors[0];
                            data.setTrade(tradeDetails.action, tradeDetails.amount, error);
                        }
                        else {
                            data.refresh();
                        }
                    });
                }
            };

            $("#tradeButton").click(function () {
                tradeIt();
            });

            $("#backbutton").click(function () {
                Overlord.showMainWindow();
            });
            
            $("#tradeAction").change(me.convertCurrency);
            $("#amount").keyup(me.convertCurrency);
        },

        convertCurrency: function() {
            var amount = parseFloat($("#amount").val());
            var action = $("#tradeAction").val();

            if (isNaN(amount)) amount = 0;

            var func = null;
            if (action == "Buy") func = data.getBuyPrice;
            else func = data.getSellPrice;

            func(amount, function (err, response) {
                var usdAmount = response.amount;
                if (usdAmount == "0.15" || usdAmount == "-0.15") usdAmount = 0;

                var msg = "$" + usdAmount + " USD";

                $("#convertedCurrency").html(msg);
            });

            $("#tradeActionLabel").html(action.toLowerCase());
            $("#tradeButton").val(action);
        },
        
        sayError: function(error) {
            $("#tradeError").html(error);
            $("#tradeError").show();
        }
    });
})();