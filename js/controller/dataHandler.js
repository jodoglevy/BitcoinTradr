var _dataHandler;

function DataHandler(apiKey, apiSecret, isManualLogin) {
    this.setCredentials(apiKey, apiSecret, isManualLogin);
    
    this.saveFile = AppInfo.siteName + "DataHandler.json";
    
    _dataHandler = this;
    
    this.data = {
        nativeCurrency: null
    };
}

DataHandler.prototype.onStopped = function () {

}

DataHandler.prototype.onActivated = function () {

}

DataHandler.prototype.setCredentials = function (apiKey, apiSecret, isManualLogin) {
    this.model = new Coinbase(apiKey, apiSecret);
    this.needsCredentialsChange = false;
}

DataHandler.prototype.loginFailed = function () {
    return this.needsCredentialsChange;
}

DataHandler.prototype.getUserData = function (callback) {
    var me = this;

    me.model.getUser(function (err, userData) {
        if (err && err.status == 401) me.needsCredentialsChange = true;

        if (userData) {
            userData = userData.users[0].user;
            me.data.nativeCurrency = userData.native_currency;
        }

        callback(err, userData);
    });
}

DataHandler.prototype.getUserNativeCurrency = function () {
    return this.data.nativeCurrency;
};

DataHandler.prototype.getContacts = function (callback) {
    var me = this;

    me.model.getContacts(null, null, function (err, data) {
        if (err && err.status == 401) me.needsCredentialsChange = true;
        callback(err, data);
    });
};

DataHandler.prototype.listAccountChanges = function (callback) {
    var me = this;

    me.model.listAccountChanges(function (err, data) {
        if (err && err.status == 401) me.needsCredentialsChange = true;
        callback(err, data);
    });
}

DataHandler.prototype.signUp = function (username, password, callback) {
    this.model.createUser(username, password, AppInfo.appReferrerId, callback);
}

DataHandler.prototype.getSpotRate = function (callback) {
    var me = this;

    me.model.getSpotRate(me.data.nativeCurrency, function (err, data) {
        if (err && err.status == 401) me.needsCredentialsChange = true;
        callback(err, data);
    });
}

DataHandler.prototype.buyBitcoin = function (amount, callback, dataHandler) {
    var me = dataHandler || this;

    me.model.buyBitcoin(amount, false, function (err, data) {
        if (err && err.status == 401) me.needsCredentialsChange = true;
        callback(err, data);
    });
}

DataHandler.prototype.sellBitcoin = function (amount, callback, dataHandler) {
    var me = dataHandler || this;

    me.model.sellBitcoin(amount, function (err, data) {
        if (err && err.status == 401) me.needsCredentialsChange = true;
        callback(err, data);
    });
}

DataHandler.prototype.getBuyPrice = function (amount, callback) {
    var me = this;

    me.model.getBuyPrice(amount, function (err, data) {
        if (err && err.status == 401) me.needsCredentialsChange = true;
        callback(err, data);
    });
}

DataHandler.prototype.getSellPrice = function (amount, callback) {
    var me = this;

    me.model.getSellPrice(amount, function (err, data) {
        if (err && err.status == 401) me.needsCredentialsChange = true;
        callback(err, data);
    });
}

DataHandler.prototype.saveData = function () {
    WinJS.Application.local.writeText(this.saveFile, JSON.stringify({
        data: this.data
    }));
}


DataHandler.prototype.loadData = function (callback) {
    var me = _dataHandler;

    var localFolder = Windows.Storage.ApplicationData.current.localFolder;

    localFolder.getFileAsync(this.saveFile)
    .then(
        function (tempFile) {
            tempFile.openAsync(Windows.Storage.FileAccessMode.read)
            .then(
                function(stream) {
                    var reader = new Windows.Storage.Streams.DataReader(stream.getInputStreamAt(0));
                    reader.loadAsync(stream.size)
                    .then(
                        function () {
                            var str = reader.readString(stream.size);
                            stream.close();

                            try {
                                var dat = JSON.parse(str);
                                me.data = dat.data;

                                callback();
                            } catch (err) {
                                callback();
                            }
                        },
                        function (err) {
                            callback();
                        }
                    );
                },
                function (err) {
                    callback();
                }
            );
        },
        function (err) {
            callback();
        }
    );
};

DataHandler.prototype.getCurrencyExchangeRates = function (callback) {
    this.model.getCurrencyExchangeRates(callback);
};

DataHandler.prototype.sendBitcoin = function(toEmailOrBitcoinAddress, amount, currency, note, callback) {
    this.model.sendBitcoin(toEmailOrBitcoinAddress, amount, currency, note, AppInfo.appReferrerId, callback);
}