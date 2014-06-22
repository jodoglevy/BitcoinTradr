// For an introduction to the Split template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=232447
(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var background = Windows.ApplicationModel.Background;
    var nav = WinJS.Navigation;

    var onHideSplashScreen = null;
    var splash = null;
    var cantHideSplash = false;

    var onActivatedFunc = null;
    var onStoppedFunc = null;

    WinJS.strictProcessing();
    WinJS.Binding.optimizeBindingReferences = true;

    app.addEventListener("activated", function (args) {
        if (onActivatedFunc) onActivatedFunc();

        if (args.detail.kind === activation.ActivationKind.launch
            || args.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.protocol
        ) {

            // Retrieve the bitcoin uri if activated through bitcoin link
            if (args.detail.uri) {
                if (args.detail.uri.schemeName == "bitcoin" || args.detail.uri.schemeName == "x-btc") {
                    onHideSplashScreen = function () {
                        setTimeout(function () {
                            data.setSend(args.detail.uri.path)
                        }, 500);
                    };
                }
            }

            if (args.detail.arguments) {
                // Toast notification was clicked on
                onHideSplashScreen = function () {
                    var toastArgs = JSON.parse(args.detail.arguments);

                    if (toastArgs.conversationID && toastArgs.userName) {
                        var goToPage = "/DatingAppsShared/pages/conversationView/conversationView.html"

                        if (!(nav.history.current.location == goToPage && nav.history.current.state.threadID == toastArgs.conversationID)) {
                            args.setPromise(WinJS.UI.processAll().then(function () {
                                nav.navigate(goToPage, {
                                    threadID: toastArgs.conversationID,
                                    title: toastArgs.userName
                                });
                            }));
                        }
                    }
                }
            }

            // if app was already open, no need to wait for splash screen to close cuz its already closed
            if (splash && onHideSplashScreen) onHideSplashScreen();

            if (args.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.launch) {
                Review.appWasOpenedByUser();
            }

            // if the app was already open, don't do the init stuff (below this line)
            if (splash) return;

            // initialize the MarkedUp client
            MK.initialize(AppInfo.markedUpId);

            // Retrieve splash screen object
            splash = args.detail.splashScreen;

            // Create and display the extended splash screen using the splash screen object and the same image specified for the system splash screen.
            ExtendedSplash.show(splash, onHideSplashScreen, cantHideSplash);

            // Listen for window resize events to reposition the extended splash screen image accordingly.
            // This is important to ensure that the extended splash screen is formatted properly in response to snapping, unsnapping, rotation, etc...
            window.addEventListener("resize", onResize, false);

            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // This application has been newly launched. Initialize
                // your application here.
            } else {
                // This application has been reactivated from suspension.
                // Restore application state here.
            }

            if (app.sessionState.history) {
                nav.history = app.sessionState.history;
            }

            args.setPromise(WinJS.UI.processAll().then(function () {
                if (nav.location) {
                    nav.history.current.initialPlaceholder = true;
                    return nav.navigate(nav.location, nav.state);
                } else {
                    return nav.navigate(Application.navigator.home);
                }
            }));

            args.setPromise(WinJS.UI.processAll().then(function () {
                data.connect();
            }));
        }
    });

    app.onunload = function (args) {
        if (onStoppedFunc) onStoppedFunc();
    }

    app.oncheckpoint = function (args) {
        // This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. If you need to 
        // complete an asynchronous operation before your application is 
        // suspended, call args.setPromise().
        app.sessionState.history = nav.history;

        if (onStoppedFunc) onStoppedFunc();
    };

    app.onerror = function (error) {
        //Log the last-chance exception (as a crash)
        MK.logLastChanceException(error);
    };

    addSettings();
    app.start();

    function addSettings() {
        WinJS.Application.onsettings = function (e) {
            e.detail.applicationcommands = {
                "privacy": { title: "Privacy Policy", href: "/pages/privacy/privacy.html" },
                "account": { title: "Account", href: "/pages/login/login.html" },
                "support": { title: "Support", href: "/pages/support/support.html" },
                "apps": { title: "Apps From Apptastic", href: "/pages/apps/apps.html" }
            };

            WinJS.UI.SettingsFlyout.populateSettings(e);
        };
    }

    function requestBackgroundAccess() {
        if (background.BackgroundExecutionManager.getAccessStatus() == background.BackgroundAccessStatus.unspecified) {
            background.BackgroundExecutionManager.requestAccessAsync().done(function(result) {
                registerBackgroundTasks();
            });
        }
        else registerBackgroundTasks();
    }

    function registerBackgroundTasks() {
        if (background.BackgroundTaskRegistration.allTasks.size == 3) return;
        else if (background.BackgroundTaskRegistration.allTasks.size > 0) removeAllBackgroundTasks();

        registerBackgroundTask(
            "js\\controller\\backgroundtask.js",
            "Query " + AppInfo.title,
            new background.SystemTrigger(background.SystemTriggerType.internetAvailable, false),
            null
        );

        registerBackgroundTask(
            "js\\controller\\backgroundtask.js",
            "Query " + AppInfo.title,
            new background.SystemTrigger(background.SystemTriggerType.userPresent, false),
            null
        );

        registerBackgroundTask(
            "js\\controller\\backgroundtask.js",
            "Query " + AppInfo.title,
            new background.TimeTrigger(15, false),
            null
        );
    }

    // Register a background task with the specified taskEntryPoint, taskName, trigger, and condition (optional).
    function registerBackgroundTask(taskEntryPoint, taskName, trigger, condition) {
        var builder = new background.BackgroundTaskBuilder();

        builder.name = taskName;
        builder.taskEntryPoint = taskEntryPoint;
        builder.setTrigger(trigger);

        if (condition !== null) {
            builder.addCondition(condition);
        }

        var task = builder.register();
    }

    function removeAllBackgroundTasks() {
        var iter = background.BackgroundTaskRegistration.allTasks.first();
        var hascur = iter.hasCurrent;
        while (hascur) {
            var cur = iter.current.value;
            cur.unregister(true);
            hascur = iter.moveNext();
        }
    }

    function onResize() {
        // Safely update the extended splash screen image coordinates. This function will be fired in response to snapping, unsnapping, rotation, etc...
        if (splash) {
            // Update the coordinates of the splash screen image.
            ExtendedSplash.updateImageLocation(splash);
        }
    }

    WinJS.Namespace.define("Overlord", {
        showMainWindow: function () {
            if (ExtendedSplash.isVisible()) $("#extendedSplashScreen").focus();
            else $("#contenthost").focus();
        },
        requestBackgroundAccess: requestBackgroundAccess,
        getActivatedURI: function () {
            return activatedURI;
        },
        onActivated: function (func) {
            onActivatedFunc = func;
        },
        onStopped: function (func) {
            onStoppedFunc = func;
        }
    });
})();
