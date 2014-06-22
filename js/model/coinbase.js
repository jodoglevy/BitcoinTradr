function Coinbase(apiKey, apiSecret) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;

    this.baseURL = "https://coinbase.com/api/v1/";
    this.loginFailedMessage = "Sorry, your credentials were incorrect.";
}

Coinbase.prototype._calculateRequestSignature = function (url, body, nonce, secret) {
    var message = nonce + url + (body != null ? body : "");
    var shaObj = new jsSHA(message, "TEXT");

    return shaObj.getHMAC(secret, "TEXT", "SHA-256", "HEX");
};

Coinbase.prototype.getBuyPrice = function (numberOfBitcoinsToBuy, callback) {
    this._getFromCoinbase("prices/buy?qty=" + encodeURIComponent(numberOfBitcoinsToBuy), callback);
};

Coinbase.prototype.getSellPrice = function (numberOfBitcoinsToSell, callback) {
    this._getFromCoinbase("prices/sell?qty=" + encodeURIComponent(numberOfBitcoinsToSell), callback);
};

Coinbase.prototype.getBalance = function (callback) {
    this._getFromCoinbase("account/balance", callback);
};

Coinbase.prototype.getSpotRate = function (currency, callback) {
    if (!currency) currency = "USD";

    this._getFromCoinbase("prices/spot_rate?currency=" + encodeURIComponent(currency), callback);
};

Coinbase.prototype.getReceiveAddress = function (callback) {
    this._getFromCoinbase("account/receive_address", callback);
};

Coinbase.prototype.listRecurringPayments = function (callback) {
    this._getFromCoinbase("recurring_payments", callback);
};

Coinbase.prototype.listTransfers = function (callback) {
    this._getFromCoinbase("transfers", callback);
};

Coinbase.prototype.getRecurringPayment = function (paymentId, callback) {
    this._getFromCoinbase("recurring_payments/" + paymentId, callback);
};

Coinbase.prototype.generateReceiveAddress = function (callbackUrl, callback) {
    if (callbackUrl) var postData = "address[callback_url]=" + encodeURIComponent(callbackUrl);
    else var postData = null;

    this._postToCoinbase("account/generate_receive_address", postData, callback);
};

Coinbase.prototype.sendBitcoin = function (toEmailOrBitcoinAddress, amount, currency, note, referrerId, callback) {
    if (!note) note = "";
    if (!referrerId) referrerId = "";
    
    var postData = "transaction[to]=" + encodeURIComponent(toEmailOrBitcoinAddress);
    postData += "&transaction[notes]=" + encodeURIComponent(note);
    postData += "&transaction[referrer_id]=" + encodeURIComponent(referrerId);

    if (currency == "BTC") {
        postData += "&transaction[amount]=" + encodeURIComponent(amount);
    }
    else if (currency == "USD") {
        postData += "&transaction[amount_string]=" + encodeURIComponent(amount);
        postData += "&transaction[amount_currency_iso]=" + encodeURIComponent(currency);
    }
    else {
        return callback("Currency invalid");
    }

    this._postToCoinbase("transactions/send_money", postData, callback);
};

Coinbase.prototype.listAccountChanges = function (callback) {
    this._getFromCoinbase("account_changes", callback);
};

Coinbase.prototype.getUser = function (callback) {
    this._getFromCoinbase("users", callback);
};

Coinbase.prototype.getTransaction = function (transactionId, callback) {
    this._getFromCoinbase("transactions/" + transactionId, callback);
};

Coinbase.prototype.createUser = function (email, password, referrerId, callback) {
    if (!referrerId) referrerId = "";

    var postData = "user[email]=" + encodeURIComponent(email) + "&user[password]=" + encodeURIComponent(password) + "&user[referrer_id]=" + encodeURIComponent(referrerId);
    this._postToCoinbase("users", postData, callback);
};

Coinbase.prototype.getAddresses = function (callback) {
    this._getFromCoinbase("addresses", callback);
};

Coinbase.prototype.getCurrencies = function (callback) {
    this._getFromCoinbase("currencies", callback);
};

Coinbase.prototype.getCurrencyExchangeRates = function (callback) {
    this._getFromCoinbase("currencies/exchange_rates", callback);
};

Coinbase.prototype.getContacts = function (limit, query, callback) {
    if (!limit) limit = 1000;

    var queryString = ""; //"?limit=" + encodeURIComponent(limit);

    if (query) queryString += "&query=" + encodeURIComponent(query);

    this._getFromCoinbase("contacts" + queryString, callback);
};

Coinbase.prototype.buyBitcoin = function (numberOfBitcoinsToBuy, agreeBitcoinAmountVaries, callback) {
    var postData = "qty=" + encodeURIComponent(numberOfBitcoinsToBuy) + "&agree_btc_amount_varies=" + encodeURIComponent(agreeBitcoinAmountVaries);
    this._postToCoinbase("buys", postData, callback);
};

Coinbase.prototype.sellBitcoin = function (numberOfBitcoinsToSell, callback) {
    var postData = "qty=" + encodeURIComponent(numberOfBitcoinsToSell);
    this._postToCoinbase("sells", postData, callback);
};

Coinbase.prototype._getFromCoinbase = function (page, callback) {
    var nonce = new Date().getTime();
    var url = this.baseURL + page;
    var signature = this._calculateRequestSignature(url, null, nonce, this.apiSecret);

    WinJS.xhr({
        type: "GET",
        headers: {
            "ACCESS_KEY": this.apiKey,
            "ACCESS_SIGNATURE": signature,
            "ACCESS_NONCE": nonce
        },
        url: url
    })
    .then(
        function (response) {
            var output = JSON.parse(response.responseText);
            callback(null, output);
        },
        function (err) {
            return callback(err);
        }
    );
};

Coinbase.prototype._postToCoinbase = function (page, postData, callback) {
    var nonce = new Date().getTime();
    var url = this.baseURL + page;
    var signature = this._calculateRequestSignature(url, postData, nonce, this.apiSecret);

    WinJS.xhr({
        type: "POST",
        headers: {
            "Content-type": "application/x-www-form-urlencoded",
            "ACCESS_KEY": this.apiKey,
            "ACCESS_SIGNATURE": signature,
            "ACCESS_NONCE": nonce
        },
        url: url,
        data: postData
    })
    .then(
        function (response) {
            var output = JSON.parse(response.responseText);
            callback(null, output)
        },
        function (err) {
            callback(err);
        }
    );
};