define([
        "require",
        "jquerymobile",
        'realtime/realtime' + resourceSuffix,
        'channel' + resourceSuffix,
        "libs/jquery/jquery.throttle",
        "notify",
        'views/WallboardView' + resourceSuffix,
        'views/WallboardHeaderView' + resourceSuffix,
        'views/LeftPanelView' + resourceSuffix,
        'views/ServiceStatusView' + resourceSuffix,
        'views/ServiceUnavailbleView' + resourceSuffix,
], function(require, jqueryMobile, realtimeFramework, channel, throttle, notify, wallboardView, headerView, leftPanelView, serviceStatusView, serviceUnavailbleView) {
    var wallboardFXApp = function () {
        var app = this;
        var applicationRouter = Backbone.Router.extend({
            root: '/WallboardFX/',
            initialize: function () {
                this.route("", "initDisplay");
                //Default url route ->http://127.0.0.1:9100/wallboardfx/display
                //Restricted url to stop redirect route -> http://127.0.0.1:9100/wallboardfx/display/1
                this.route(/^display\/?(\d+)?$/, 'showDisplay');
                //Restricted url hide panels with restricted displayid-> http://127.0.0.1:9100/wallboardfx/#display/1/hideleft=y&hideadmin=y&hidefullscreen=y
                this.route("display/:displayID/:Value", "restrictDisplay");
                //Restricted url hide panels with default displayid-> http://127.0.0.1:9100/wallboardfx/#display/hideleft=y&hideadmin=y&hidefullscreen=y
                this.route(/^display\/(\D+)$/, 'restrictDisplay1');
                this.route("serviceUnavailble", "serviceUnavailble");
                $("#wfxExtension").load("../Content/wfxextension.html");
            },
            initDisplay: function () {
            },
            showDisplay: function (displayID) {
                clearSessionItems();
                if (displayID && displayID.match(/^\d+$/)) {  
                    stopThresholdAudioAlert();
                    sessionStorage.setItem('restrictedDisplayId', displayID);                    
                } else displayID = sessionStorage.getItem('displayID');

                if (!app.Realtime.initialised) {
                    app.Router.navigate('');
                    return null;
                }
                app.HeaderView.load('hideleft=n&hideadmin=n&hidefullscreen=n'); //remove policy
                app.AppView.load({ DisplayID: displayID });
                return app.RegionManager.show(app.AppView);
            },
            restrictDisplay: function (displayID, UrlParam) {
                clearSessionItems();
                if (displayID && displayID.match(/^\d+$/)) {      
                    stopThresholdAudioAlert();
                    sessionStorage.setItem('restrictedDisplayId', displayID);                    
                } else displayID = sessionStorage.getItem('restrictedDisplayId');

                var policyParameter = null;                
                if (UrlParam) {                    
                    sessionStorage.setItem('PolicyQueryString', UrlParam);
                    policyParameter = UrlParam.toLowerCase();                    
                }
                if (!app.Realtime.initialised) {
                    app.Router.navigate('');
                    return null;
                }
                app.AppView.load({ DisplayID: displayID });
                //reloading HeaderView based on policyParmeter
                if (policyParameter) app.HeaderView.load(policyParameter);
                else app.HeaderView.load('hideleft=n&hideadmin=n&hidefullscreen=n');//remove policy
                return app.RegionManager.show(app.AppView);
            },
            restrictDisplay1: function (UrlParam) {
                var policyParameter = null;
                clearSessionItems();
                if (UrlParam) {                    
                    sessionStorage.setItem('PolicyQueryString', UrlParam);
                    policyParameter = UrlParam.toLowerCase();                    
                }
                var displayID = sessionStorage.getItem("displayID");
                app.displayID = displayID;

                if (!app.Realtime.initialised) {
                    app.Router.navigate('');
                    return null;
                }
                app.AppView.load({ DisplayID: app.displayID });
                //reloading HeaderView based on policyParmeter
                if (policyParameter) app.HeaderView.load(policyParameter);
                else app.HeaderView.load('hideleft=n&hideadmin=n&hidefullscreen=n');//remove policy
                return app.RegionManager.show(app.AppView);
            },
            serviceUnavailble: function () {
                return app.RegionManager.show(app.ServiceUnavailbleView);
            }
        });
        var appRegionManager = function () {
            var currentView;
            var el = "#content";
            var region = {};

            var closeView = function (view) {
                if (view && view.close) {
                    view.close();
                }
            };

            var openView = function (view) {
                if (!view)
                    return;
                view
                    .render()
                    .then(function () {
                        $(el).html(view.el);
                        if (view.onShow) {
                            view.onShow();
                        }
                    });
            };

            region.show = function (view) {
                if (!view)
                    return;
                closeView(currentView);
                currentView = view;
                openView(currentView);
            };

            return region;
        };

        var realtimeClient = function () {
            var realtime = this;
            realtime.initialised = false;
            realtime.framework = realtimeFramework.getInstance();
            realtime.OnConnectionStateChanged = function (isConnected) {
                app.Realtime.initialised = true;
                if (isConnected) {
                    realtime.framework.InitialiseClient();
                } else {
                    app.reconnectTimer = window.setTimeout(realtime.framework.AttemptReconnect, 5000);
                }
            };
        };

        app.Router = new applicationRouter();
        app.RegionManager = new appRegionManager();
        app.Realtime = new realtimeClient();
        app.AppView = new wallboardView();
        app.ServiceUnavailbleView = new serviceUnavailbleView();
        app.ServiceStatusView = new serviceStatusView();
        app.HeaderView = new headerView();
        app.LeftPanelView = new leftPanelView();
        app.TrialBanner = null;
        app.NotificationBanner = null;
        app.Disconnected = false;

        function initialise() {
            if (navigator.userAgent.match(/IEMobile\/10\.0/)) {
                var msViewportStyle = document.createElement("style");
                msViewportStyle.appendChild(
                    document.createTextNode(
                        "@-ms-viewport{width:auto!important}"
                    )
                );
                document.getElementsByTagName("head")[0].appendChild(msViewportStyle);
            }
            $("body")
                .on('tap', function () {
                    channel.trigger(channel.events.user.userAwake);
                })
                .on('mousemove', function () {
                    channel.trigger(channel.events.user.userAwake);
                });
            $("body").on("swiperight", function () {
                if (app.rejected) {
                    return;
                }
                if (!app.LeftPanelView.shown) {
                    var policyParameter = sessionStorage.getItem('PolicyQueryString');
                    if (policyParameter) {
                        var items = policyParameter.split('&');
                        var collection = [];
                        $.each(items, function (i, item) {
                            var arr = item.split('=');
                            collection[arr[0]] = arr[1];
                        })
                        if (collection['hideleft'] != 'y')
                            channel.trigger(channel.events.display.Panels.Left.Open);
                    } else channel.trigger(channel.events.display.Panels.Left.Open);
                }

            });

            channel.on(channel.events.state.connected, function () {
                if (app.Disconnected) {
                    window.location.reload(true);
                    return;
                }
                app.Realtime.OnConnectionStateChanged(true);
            });
            channel.on(channel.events.admin.edit.grid, function (displayID) {
                channel.off(channel.events.state.disconnected);
                channel.off(channel.events.state.reconnecting);
                channel.off(channel.events.state.connecting);
                window.location = "/WallboardFX/Admin#display/" + displayID;
            });
            channel.on(channel.events.state.reconnecting, function () {
                closePanels();
                app.Router.navigate('', { trigger: true, replace: true });
            });
            channel.on(channel.events.state.connecting, function () {
                closePanels();
            });
            channel.on(channel.events.state.disconnected, function () {
                closePanels();
                app.rejected = false;
                app.Disconnected = true;
                app.Realtime.OnConnectionStateChanged(false);
                app.Router.navigate('', { trigger: true, replace: true });
            });
            channel.on(channel.events.client.state.authorised, function (displayProfile) { //triggered first time from signalr initialisation
                if (app.rejected) {
                    app.rejected = false;
                }
                var rdisplayId = sessionStorage.getItem('restrictedDisplayId');
                var policyParameter = sessionStorage.getItem('PolicyQueryString');
                var navUrl = "/display";
                if (rdisplayId) navUrl += "/" + rdisplayId;
                else {
                    sessionStorage.setItem('displayID', displayProfile.DisplayID);
                }
                if (policyParameter) navUrl += "/" + policyParameter;
                app.Router.navigate(navUrl, { trigger: true, replace: true });

            });
            channel.on(channel.events.display.navigate.DisplayProfile, function (displayProfileID) {//triggered when changing display from left navigation option                 
                if (app.rejected) {
                    return;
                }                
                var rdisplayId = sessionStorage.getItem('restrictedDisplayId');
                var policyParameter = sessionStorage.getItem('PolicyQueryString');
                stopThresholdAudioAlert();
                var navUrl = "/display";
                if (rdisplayId) navUrl += "/" + displayProfileID;
                else {//default case so updated displayid so insync between display switch from left navigation
                    validNavigate(displayProfileID);
                    sessionStorage.setItem('displayID', displayProfileID);
                }
                if (policyParameter) navUrl += "/" + policyParameter;
                app.Router.navigate(navUrl, { trigger: true, replace: true });
            });
            channel.on(channel.events.display.update, function (displayProfile) {     //triggered from admin section when display updated          
                if (app.rejected) {
                    return;
                }
                app.Router.navigate('', { trigger: true, replace: true });
                var rdisplayId = sessionStorage.getItem('restrictedDisplayId');
                var policyParameter = sessionStorage.getItem('PolicyQueryString');
                var navUrl = "/display";
                if (rdisplayId) navUrl += "/" + rdisplayId;                
                if (policyParameter) navUrl += "/" + policyParameter;
                app.Router.navigate(navUrl, true);
            });
            channel.on(channel.events.client.configuration.updated, function () {
                if (app.rejected) {
                    return;
                }
                app.Router.navigate('', { trigger: true, replace: true });
                app.Realtime.framework.InitialiseClient();
            });
            channel.on(channel.events.client.state.rejected, function () {
                app.rejected = true;
                app.Router.navigate('serviceUnavailble', { trigger: true, replace: true });
            });
            channel.on(channel.events.system.licensing.licenseUpdated, function (licenseInfo) {
                onLicenseUpdate(licenseInfo);
            });

            // Notification Message Listening Event
            channel.on(channel.events.display.viewNotification, function (notificationData) {
                if (notificationData.NotifyEnabled) {
                    if (app.TrialBanner)
                        app.TrialBanner.close();
                    if (notificationData.NotifyMessage != null && notificationData.NotifyMessage.length > 0) {
                        try
                        {
                            var messageObj = JSON.parse(notificationData.NotifyMessage);
                            var notifyMsg = messageObj.notifyMessage;
                            if (notifyMsg != null && notifyMsg.length > 0)
                                onNotification(notifyMsg);
                        } catch (e) {
                            console.log('Error Parsing NotifyMessage data' + e.message);
                        }
                    }
                } else {
                    if (app.NotificationBanner)
                        app.NotificationBanner.close();
                }
            });

            app.ServiceStatusView.hide();
            Backbone.history.start({
                root: '/WallboardFX/',
                pushState: false
            });
        }

        function validNavigate(displayId) {
            var oldDisplayId = sessionStorage.getItem('displayID');
            if (oldDisplayId != displayId) {
                app.Router.navigate('');
            }
        }

        function clearSessionItems() {
            sessionStorage.removeItem('restrictedDisplayId');
            sessionStorage.removeItem('PolicyQueryString');
        }

        function closePanels() {
            channel.trigger(channel.events.display.Panels.Left.Close);
            channel.trigger(channel.events.display.Panels.Right.Close);
            stopThresholdAudioAlert();
        }

        function stopThresholdAudioAlert() {
            var thresholdAudio = document.getElementById('ThresholdAudioTag');
            if (thresholdAudio) {
                if (thresholdAudio.duration > 0 && !thresholdAudio.paused) {
                    thresholdAudio.pause(); thresholdAudio.currentTime = 0;                    
                }
            }
        }

        function onNotification(notifyMessage) {

            require(["views/NotificationBanner" + window.resourceSuffix], function (notificationBanner) {
                if (app.NotificationBanner)
                    app.NotificationBanner.close();
                app.NotificationBanner = new notificationBanner({
                    model: new Backbone.Model({
                        NotifyMessage: notifyMessage
                    })

                });
                app.NotificationBanner.render();
            });
        }

        function onLicenseUpdate(licenseInfo) {
            if (!licenseInfo)
                top.location.replace("/WallBoardFX/Disabled");
                if (licenseInfo.IsTrial) {
                    if (app.NotificationBanner)
                        app.NotificationBanner.close();
                    require(["views/TrialBanner" + window.resourceSuffix], function (trialBanner) {
                        if (app.TrialBanner)
                            app.TrialBanner.close();
                        app.TrialBanner = new trialBanner({
                            model: new Backbone.Model({
                                TrialDaysRemaining: licenseInfo.TrialDaysRemaining
                            })

                        });
                        app.TrialBanner.render();
                    });
                }           
        }

        initialise();
    };
    wallboardFXApp.prototype = {

    };
    return wallboardFXApp;
});