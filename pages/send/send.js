(function () {
    "use strict";

    var ui = WinJS.UI;

    ui.Pages.define("/pages/send/send.html", {
    
        getInfo: function() {
            var sendDetails = {
                toAddress: null,
                toPerson: {},
                amount: "",
                currency: "",
                note: "",
                error: null
            };

            var address = $("#contactSelector").val();

            if (address == "!win8contact") {
                var peopleElement = $(".peopleContact");

                sendDetails.toPerson = {
                    email: $(peopleElement).attr("email"),
                    title: $(peopleElement).find("a").html(),
                    imageUrlFilePath: $(peopleElement).find("img").attr("src")
                };
            }
            else if (address == "!manual") {
                sendDetails.toAddress = $("#to").val();
            }
            else if (address != "!none") {
                sendDetails.toAddress = address;
            }

            sendDetails.amount = parseFloat($("#amount").val());
            sendDetails.currency = $("#currency").val();
            sendDetails.note = $("#note").val();

            return sendDetails;
        },

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            var me = this;
            var sendDetails = data.grabNewSendDetails();

            $("#sendFlyoutInner").css("background-color", AppInfo.color);
            $("#resetButton").css("background-color", AppInfo.color);
            $("#sendButton").css("background-color", AppInfo.color);

            $("#manualAddress").hide();

            if (sendDetails.toAddress == AppInfo.appBitcoinAddress) $("#donateMessage").show()
            else $("#donateMessage").hide();

            var currencySelectBox = document.querySelector("#currency");
            var currency = data.getUserNativeCurrency();
            var option = document.createElement("OPTION");
            option.text = currency;
            option.value = currency;
            currencySelectBox.add(option);

            if (sendDetails.currency) $("#currency").val(sendDetails.currency);
            if (sendDetails.amount) $("#amount").val(sendDetails.amount);
            if (sendDetails.note) $("#note").val(sendDetails.note);

            if (sendDetails.error) me.sayError(sendDetails.error);

            data.getContacts(function (err, response) {
                if (!err) {
                    var address = [];

                    response.contacts.forEach(function (contact) {
                        address.push(contact.contact.email);
                    });

                    address.sort();

                    var selectBox = document.querySelector("#contactSelector");
                    var max = Math.min(address.length, 500);

                    for (var i = 0; i < max; i++) {
                        var option = document.createElement("OPTION");
                        option.text = address[i];
                        option.value = address[i];
                        selectBox.add(option);
                    }
                }

                if (sendDetails.toAddress) {
                    if ($("#contactSelector option[value='" + sendDetails.toAddress + "']").length > 0) {
                        $("#contactSelector").val(sendDetails.toAddress);
                    }
                    else {
                        $("#to").val(sendDetails.toAddress);
                        $("#manualAddress").show();
                        $("#contactSelector").val("!manual");
                    }
                }
                else if (sendDetails.toPerson && sendDetails.toPerson.email) {
                    $("#contactSelector").val("!win8contact");
                    me.addContact(sendDetails.toPerson);
                }
            });

            this.convertCurrency();

            $('#sendForm').submit(function () {
                return false;
            });

            $("#resetButton").click(function () {
                $("#to").val("");
                $("#amount").val("");
                $("#note").val("");
                $("#currency").val("BTC");
                $("#contactSelector").val("!none");

                $("#signupError").hide();
                $("#manualAddress").hide();

                $(".peopleContact").remove();

                me.convertCurrency();
            });

            var sendIt = function () {
                var sendDetails = me.getInfo();
                var toAddress = sendDetails.toAddress || sendDetails.toPerson.email;

                if (!toAddress) me.sayError("Please specify a bitcoin or email address")
                else if (!sendDetails.amount || isNaN(sendDetails.amount) || sendDetails.amount <= 0) me.sayError("Please enter a valid amount to send");
                else {
                    data.sendBitcoin(sendDetails.toAddress, sendDetails.amount, sendDetails.currency, sendDetails.note, sendDetails.toPerson, false, function (err, response) {
                        if (err || response.errors) {
                            var error = err ? err.response : response.errors[0];
                            data.setSend(sendDetails.toAddress, sendDetails.toPerson, sendDetails.amount, sendDetails.currency, sendDetails.note, error);
                        }
                        else {
                            data.refresh();
                        }
                    });
                }
            };

            $("#sendButton").click(function () {
                sendIt();
            });

            $("#backbutton").click(function () {
                Overlord.showMainWindow();
            });
            
            $("#currency").change(me.convertCurrency);
            $("#amount").keyup(me.convertCurrency);

            $("#contactSelector").change(function () {
                $(".peopleContact").remove();
                $("#to").val("");
                $("#manualAddress").hide();

                var address = $("#contactSelector option:selected").val();

                if (address == "!win8contact") {
                    me.getContact();
                }
                else if (address == "!manual") {
                    $("#manualAddress").show();
                }
            });
        },

        convertCurrency: function() {
            var currency = $("#currency").val();
            var amount = parseFloat($("#amount").val());

            if (isNaN(amount)) amount = 0;

            data.getCurrencyExchangeRates(function (err, response) {
                if (currency == "BTC") {
                    var rate = response.btc_to_usd;
                    var usdAmount = rate * amount;
                    var msg = "$" + usdAmount + " USD";
                }
                else {
                    var rate = response.usd_to_btc;
                    var btcAmount = rate * amount;
                    var msg = btcAmount + " BTC";
                }

                $("#convertedCurrency").html(msg);
            });
        },

        getContact: function() {
            var me = this;
            
            var sendDetails = me.getInfo();

            // Verify that we are unsnapped or can unsnap to open the picker 
            var viewState = Windows.UI.ViewManagement.ApplicationView.value;
            if (viewState === Windows.UI.ViewManagement.ApplicationViewState.snapped &&
                !Windows.UI.ViewManagement.ApplicationView.tryUnsnap()) {
                // Fail silently if we can't unsnap 
                return;
            };

            // Create the picker 
            var picker = new Windows.ApplicationModel.Contacts.ContactPicker();
            picker.commitButtonText = "Select";
            picker.desiredFields.append(Windows.ApplicationModel.Contacts.KnownContactField.email);

            // Open the picker for the user to select contacts 
            picker.pickSingleContactAsync().done(function (contact) {
                if (contact) {
                    me.getContactInfo(contact, function (err, person) {
                        sendDetails.toPerson = person;
                        data.setSend(sendDetails.toAddress, sendDetails.toPerson, sendDetails.amount, sendDetails.currency, sendDetails.note);
                    });
                }
                else {
                    data.setSend(sendDetails.toAddress, sendDetails.toPerson, sendDetails.amount, sendDetails.currency, sendDetails.note);
                }
            });
        },

        getContactInfo: function (contact, callback) {
            contact.getThumbnailAsync().done(function (thumbnail) {

                var afterKnowEmail = function (email, emailType) {
                    var person = {
                        contactID: true,
                        email: email,
                        title: contact.name,
                    };

                    if (thumbnail.size > 0) {
                        person.imageUrlFilePath = window.URL.createObjectURL(thumbnail);
                    }
                    else {
                        person.imageUrlFilePath = "/images/blank_face_small.png";
                    }

                    callback(null, person);
                }

                if (contact.emails.length > 1) {
                    var msg = new Windows.UI.Popups.MessageDialog(contact.name + " has multiple email addresses. Please select the one you wish to use.");

                    // Add commands and set their CommandIds 
                    contact.emails.forEach(function (email, i) {
                        if (i < 3) {
                            msg.commands.append(new Windows.UI.Popups.UICommand(email.value, null, i));
                        }
                    });

                    // Set the command that will be invoked by default 
                    msg.defaultCommandIndex = 0;

                    // Show the message dialog 
                    msg.showAsync().done(function (command) {
                        if (command) {
                            afterKnowEmail(contact.emails[command.id].value, contact.emails[command.id].category);
                        }
                        else {
                            afterKnowEmail(contact.emails[0].value, contact.emails[0].category);
                        }
                    });
                }
                else {
                    afterKnowEmail(contact.emails[0].value, contact.emails[0].category);
                }
            });
        },

        sayError: function(error) {
            $("#signupError").html(error);
            $("#signupError").show();
        },

        addContact: function (person) {
            var $contactTemplate = $("#peopleContactTemplate").clone();

            $contactTemplate.attr("style", "");
            $contactTemplate.attr("id", "");
            $contactTemplate.attr("class", "peopleContact");
            $contactTemplate.attr("email", person.email);

            $contactTemplate.find("a").html(person.title);

            if (person.imageUrlFilePath == "/images/blank_face.png") person.imageUrlFilePath = "/images/blank_face_small.png";
            $contactTemplate.find("img").attr("src", person.imageUrlFilePath);

            $("#peopleHolder").append($contactTemplate);
        }
    });
})();