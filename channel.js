define(['backbone', 'common' + resourceSuffix], function (Backbone) {
    var channel = _.extend({}, Backbone.Events);
    channel.events = {
        navigation: {
            beforeNavigation: "navigation.before"
        },
        system: {
            licensing: {
                licenseUpdated: "system.license.licenseupdated"
            }
        },
        state: {
            changing: "realtime.changing",
            connecting: "realtime.connecting",
            connected: "realtime.connected",
            disconnected: "realtime.disconnected",
            reconnecting: "realtime.reconnecting",
            connectionslow: "realtime.connectionslow",
        },
        client: {
            connection: {
                                
            },
            state: {
                authorised: "realtime.connectionAllowed",
                rejected: "realtime.connectionRejected"
            },
            configuration: {
                updated: "Client.Configuration.Updated"
            }
        },
        display: {
            data: {
                update: "Display.Data.Update"
            },
            saved: "Display.Saved",
            update: "Display.Update",
            navigate: {
                DisplayProfile: "user.navigate.displayprofile",
            },
            viewChanged: "user.navigate.viewchanged",
            viewLoaded: "user.navigate.viewloaded",
            viewNotification: "user.navigate.viewNotification",
            Panels: {
                Left: {
                    Open: "user.display.panels.left.open",
                    Close: "user.display.panels.left.close"
                },
                Right: {
                    Open: "user.display.panels.right.open",
                    Close: "user.display.panels.right.close"
                }
            }
        },
        user: {
            userAwake: "user.action.awake"
        },
        admin: {
            contextID: "Admin.ContextID",
            client: {
                clientConnectionStatusChange: "Admin.Client.ConnectivityChanged",
                clientConfigurationChange: "Admin.Client.ConfigurationChanged",
                clientConnected: "Admin.Client.ClientConnected",
                clientDisconnected: "Admin.Client.ClientDisconnected"
            },
            edit: {
                grid: "Admin.Edit.Grid"
            },
            config: {
                servercomplete: 'Admin.Config.ServerComplete',
                synccomplete: "Admin.Config.SyncComplete"
            },
            data: {
                sync: "Admin.Data.Sync",
                synccomplete: "Admin.Data.SyncComplete",
            },
            ui: {
                pageloaded: "Admin.UI.PageLoaded",
                updatesidepanel: "Admin.UI.UpdateHeaderSidePanel",
            }
        }
    };
    return channel;
});