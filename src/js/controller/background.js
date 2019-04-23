"use strict";

(function() {

    var sftp_fs_ = new SftpFS();

    var openWindow = function() {
        chrome.app.window.create("window.html", {
            id: "window",
            outerBounds: {
                width: 800,
                height: 640,
                minWidth: 340
            },
            resizable: true,
            frame: {
                color: "#003c8f"
            }
        });
    };

    chrome.app.runtime.onLaunched.addListener(openWindow);

    if (chrome.fileSystemProvider.onMountRequested) {
        chrome.fileSystemProvider.onMountRequested.addListener(openWindow);
    }


    // Show only ChromeOS notifications in case the UI-window is closed.
    // Otherwise, the UI-window will dislay the notification
    sftp_fs_.setCustomNotifier(function(notificationId, message, details, type) {
        if (!chrome.app.window.get("window")) {
            var msg = markupErrorMessage(message, details);
            chrome.notifications.create(notificationId, {
                type: type || "basic",
                title: msg,
                message: msg,
                iconUrl: "/icons/48.png"
            });
        }
    });


    var doMount = function(request, sendResponse) {
        sftp_fs_.checkAlreadyMounted(request.serverName, request.serverPort, request.username, request.mountPath, function(exists) {
            if (exists) {
                sendResponse({
                    type: "error",
                    error: "mountFailAlreadyMounted"
                });
            } else {
                var options = {
                    serverName: request.serverName,
                    serverPort: request.serverPort,
                    authType: request.authType,
                    username: request.username,
                    password: request.password,
                    privateKey: request.privateKey,
                    mountPath: request.mountPath,
                    displayName: request.displayName,
                    onHandshake: function(algorithm, fingerprint, requestId, fileSystemId) {
                        sendResponse({
                            type: "confirmFingerprint",
                            algorithm: algorithm,
                            fingerprint: fingerprint,
                            requestId: requestId,
                            fileSystemId: fileSystemId
                        });
                    },
                    onError: function(reason) {
                        sendResponse({
                            type: "error",
                            error: reason
                        });
                    }
                };
                sftp_fs_.mount(options);
            }
        });
    };

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        switch (request.type) {
            case "mount":
                console.log("request:", request);
                doMount(request, sendResponse);
                break;
            case "accept":
                sftp_fs_.allowToConnect(
                    request.requestId,
                    request.fileSystemId,
                    function() {
                        sendResponse({
                            type: "mounted",
                            success: true
                        });
                    },
                    function(reason) {
                        sendResponse({
                            type: "error",
                            success: false,
                            error: reason
                        });
                    });
                break;
            case "decline":
                sftp_fs_.denyToConnect(
                    request.requestId,
                    request.fileSystemId,
                    function() {
                        sendResponse({
                            type: "declined"
                        });
                    });
                break;
            default:
                var message;
                if (request.type) {
                    message = "Invalid request type: " + request.type + ".";
                } else {
                    message = "No request type provided.";
                }
                sendResponse({
                    type: "error",
                    success: false,
                    message: message
                });
                break;
        }
        return true;
    });


    var markupErrorMessage = function(errmsg, details) {
        let res = /[^a-z]+\d$/i.exec(errmsg);
        if (res && res[0]) {
            let msg = getLocale(errmsg.substr(0, res.index)) + " ";
            let rcList = res[0].trim().split(/\s+/);
            for (var i = 0; i < rcList.length; i++) {
                msg += "[" + rcList[i] + "] ";
            }
            return msg;
        } else {
            return getLocale(errmsg);
        }

        function getLocale(msg) {
            const loc = chrome.i18n.getMessage(msg, details);
            if (loc !== "") return loc;
            return msg;
        }
    }

})();
