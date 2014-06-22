(function () {
    "use strict";

    var ui = WinJS.UI;
    var passwordVault = new Windows.Security.Credentials.PasswordVault();

    ui.Pages.define("/pages/signup/signup.html", {

        signup: function (username, password, confirmpassword) {
            if (username.length == 0 || password.length == 0 || confirmpassword.length == 0) this.sayError("Please fill out all fields.");
            else if (password != confirmpassword) this.sayError("Password and Confirm Password do not match.");
            else {
                var me = this;
                
                data.signUp(username, password, function (err, response) {
                    if (response.errors) me.sayError(response.errors[0]);
                    else {
                        me.signedUp();
                    }
                });
            }
        },

        signedUp: function() {
            $("#signupForm").fadeOut(function () {
                $("#signedUpForm").fadeIn();
            });
        },

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            data.setShouldKeepShowingLoginPage(false);

            $("#signupFlyoutInner").css("background-color", AppInfo.color);
            $("#signupButton").css("background-color", AppInfo.color);
            
            $("#signedUpForm").hide();

            if (!data.hasInternet()) {
               this.sayError("Please connect to the Internet to sign up.");
            }

            var me = this;
            $("#signupForm").submit(function () {
                var email = $("#email").val();
                var password = $("#password").val();
                var confirmpassword = $("#confirmpassword").val();

                me.signup(email, password, confirmpassword);
                return false;
            });

            $("#signedUpForm").submit(function () {
                return false;
            });

            $("#goToCoinbaseButton").click(function () {
                data.setShouldKeepShowingLoginPage(true);
                
                var uri = new Windows.Foundation.Uri("https://coinbase.com/signin");
                Windows.System.Launcher.launchUriAsync(uri);

                data.askForLogin();
            });
        },

        sayError: function(error) {
            $("#signupError").html(error);
            $("#signupError").show();
        }
    });
})();