(function () {
    "use strict";

    var ui = WinJS.UI;
    var passwordVault = new Windows.Security.Credentials.PasswordVault();
    var apiKey = "";
    var apiSecret = "";

    ui.Pages.define("/pages/login/login.html", {

        login: function (apiKey, apiSecret, saveLoginInfo) {
            if (apiKey.length == 0) return;

            data.connect(apiKey, apiSecret, saveLoginInfo);

            $('#loginForm')[0].reset();
            Overlord.showMainWindow();
        },

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            $("#loginFlyoutInner").css("background-color", AppInfo.color);
            $("#changeAccountButton").css("background-color", AppInfo.color);
            $("#loginButton").css("background-color", AppInfo.color);
            $("#signupButton").css("background-color", AppInfo.color);
            $(".tip").css("color", AppInfo.color);

            $(".replaceAppTitle").html(AppInfo.title);
            $(".replaceSiteName").html(AppInfo.siteName);

            $("#apiKey").val(apiKey);
            $("#apiSecret").val(apiSecret);

            $("#signupButton").click(function () {
                WinJS.UI.SettingsFlyout.showSettings("signup", "/pages/signup/signup.html");
            });

            var me = this;

            if (data.loginFailed()) {
                $("#loginError").html("We couldn't connect to Coinbase using those credentials.");
            }

            if (!data.hasInternet()) {
                $("#loginError").html("Please connect to the Internet to log in.");
            }

            if ($("#loginError").html().length > 0) $("#loginError").show();

            if(data.loggedIn()) $("#loginForm").hide();
            else $("#changeAccountButton").hide();

            $("#loginForm").submit(function () {
                var apiKey = $("#apiKey").val();
                var apiSecret = $("#apiSecret").val();
                var saveLoginInfo = true;
                
                me.login(apiKey, apiSecret, saveLoginInfo);
                return false;
            });

            $("#changeAccountButton").click(function () {
                $("#changeAccountButton").fadeOut(400, function () {
                    $("#loginForm").fadeIn();
                });
            });

            $("#apiKey").on('input', function () {
                apiKey = $(this).val();
            });

            $("#apiSecret").on('input', function () {
                apiSecret = $(this).val();
            });
        }
    });
})();