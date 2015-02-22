"use strict";

(function() {

    var sftp_fs_ = new SftpFS();

    chrome.app.runtime.onLaunched.addListener(function() {
        chrome.app.window.create("window.html", {
            outerBounds: {
                width: 800,
                height: 700
            },
            resizable: false
        });
    });

    var doMount = function(request, sendResponse) {
        sftp_fs_.checkAlreadyMounted(request.serverName, request.serverPort, request.username, function(exists) {
            if (exists) {
                sendResponse({
                    type: "error",
                    error: "Already mounted"
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
        console.log(request);
        switch(request.type) {
        case "mount":
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

})();
