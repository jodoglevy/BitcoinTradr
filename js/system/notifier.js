(function () {
    var tileUpdater = Windows.UI.Notifications.TileUpdateManager.createTileUpdaterForApplication();
    var badgeUpdater = Windows.UI.Notifications.BadgeUpdateManager.createBadgeUpdaterForApplication();
    var notifications = Windows.UI.Notifications;
    var notificationManager = notifications.ToastNotificationManager;
    var notifier = notificationManager.createToastNotifier();

    var spotRate = null;
    var btcBalance = null;
    
    tileUpdater.enableNotificationQueue(true);

    function updateBadge() {
        if (Object.keys(this.currentNotifications).length == 0) {
            this.badgeUpdater.clear();
        }
        else {
            var badgeXml = Windows.UI.Notifications.BadgeUpdateManager.getTemplateContent(Windows.UI.Notifications.BadgeTemplateType.badgeNumber);
            badgeXml.getElementsByTagName('badge')[0].setAttribute('value', Object.keys(this.currentNotifications).length);

            var badgeNotification = new Windows.UI.Notifications.BadgeNotification(badgeXml);
            this.badgeUpdater.update(badgeNotification);
        }
    }

    function updateTile(btcPrice, balance) {
        if (btcPrice) spotRate = btcPrice;
        else if (balance) btcBalance = parseFloat(balance);

        var usdBalance = toNDecimalPlaces(spotRate * btcBalance, 2);

        var options = {
            month: "short", day: "numeric",
            hour: "numeric", minute: "2-digit"
        };
        var dateString = (new Date()).toLocaleTimeString("en-us", options);

        if (spotRate && btcBalance) {
            tileUpdater.clear();

            var smallTileXML = Windows.UI.Notifications.TileUpdateManager.getTemplateContent(Windows.UI.Notifications.TileTemplateType.tileSquare150x150Text01);

            var smallTileTextAttributes = smallTileXML.getElementsByTagName("text");
            smallTileTextAttributes[0].appendChild(smallTileXML.createTextNode("$" + spotRate));
            smallTileTextAttributes[1].appendChild(smallTileXML.createTextNode("Current BTC price"));
            smallTileTextAttributes[3].appendChild(smallTileXML.createTextNode(dateString));

            var tileNotification = new Windows.UI.Notifications.TileNotification(smallTileXML);
            tileUpdater.update(tileNotification);

            var mediumTileXML = Windows.UI.Notifications.TileUpdateManager.getTemplateContent(Windows.UI.Notifications.TileTemplateType.tileWide310x150Text09);

            var mediumTileTextAttributes = mediumTileXML.getElementsByTagName("text");
            mediumTileTextAttributes[0].appendChild(mediumTileXML.createTextNode("$" + spotRate + " USD"));
            mediumTileTextAttributes[1].appendChild(mediumTileXML.createTextNode("Current Bitcoin price\n\nLast updated " + dateString));

            var tileNotification2 = new Windows.UI.Notifications.TileNotification(mediumTileXML);
            tileUpdater.update(tileNotification2);

            var largeTileXML = Windows.UI.Notifications.TileUpdateManager.getTemplateContent(Windows.UI.Notifications.TileTemplateType.tileSquare310x310Text09);

            var largeTileTextAttributes = largeTileXML.getElementsByTagName("text");
            largeTileTextAttributes[0].appendChild(largeTileXML.createTextNode("Current price of Bitcoin: $" + spotRate + " USD"));
            largeTileTextAttributes[1].appendChild(largeTileXML.createTextNode("Balance: " + btcBalance + " BTC"));
            largeTileTextAttributes[2].appendChild(largeTileXML.createTextNode("≈ " + "$" + usdBalance + " USD"));
            largeTileTextAttributes[3].appendChild(largeTileXML.createTextNode("Last updated " + dateString));

            var tileNotification3 = new Windows.UI.Notifications.TileNotification(largeTileXML);
            tileUpdater.update(tileNotification3);
        }
    }

    function sendToasts() {
        for (var id in this.currentNotifications) {
            if (!this.currentNotifications[id].sentToast) {
                var toastXml = this.notificationManager.getTemplateContent(this.notifications.ToastTemplateType.toastImageAndText02);

                var textNodes = toastXml.getElementsByTagName("text");
                textNodes[0].appendChild(toastXml.createTextNode(this.currentNotifications[id].name));
                textNodes[1].appendChild(toastXml.createTextNode(this.currentNotifications[id].subtitle));

                var imgNodes = toastXml.getElementsByTagName("image");

                imgNodes[0].setAttribute("src", this.currentNotifications[id].image);
                imgNodes[0].setAttribute("alt", this.currentNotifications[id].name + " picture");

                var launchAttribute = toastXml.createAttribute("launch");
                var launchArgs = {
                    conversationID: id,
                    userName: this.currentNotifications[id].name,
                    labels: this.currentNotifications[id].labels
                };
                launchAttribute.value = JSON.stringify(launchArgs);
                var toastNode = toastXml.selectSingleNode("/toast");
                toastNode.attributes.setNamedItem(launchAttribute);

                var toast = new this.notifications.ToastNotification(toastXml);

                toast.addEventListener("failed", function (e) {
                    console.log(JSON.stringify(e));
                });

                this.notifier.show(toast);
                this.currentNotifications[id].sentToast = true;
            }
        }
    }

    function toNDecimalPlaces(num, n) {
        var rate = Math.pow(10, n);
        return Math.floor(Math.round(num * rate)) / rate
    }

    WinJS.Namespace.define("Notifications", {
        updateTile: updateTile
    });
})();