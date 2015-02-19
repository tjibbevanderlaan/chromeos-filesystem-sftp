"use strict";

(function() {

    // Constructor

    var SftpFS = function() {
        this.sftpClientMap_ = {};
        this.taskQueue_ = [];
        this.opened_files_ = {};
        assignEventHandlers.call(this);
    };

    // Public functions

    SftpFS.prototype.mount = function(options) {
        var fileSystemId = createFileSystemID.call(
            this, options.serverName, options.serverPort, options.username);
        var sftpClient = new SftpClient(
            this,
            options.serverName, options.serverPort,
            options.authType, options.username,
            options.password, options.privateKey);
        this.sftpClientMap_[fileSystemId] = sftpClient;
        sftpClient.setup();
        // var requestId = new Date().getTime() % 2147483647;
        var requestId = createRequestId.call(this);
        sftpClient.connect({
            requestId: requestId,
            onSuccess: function(result) {
                console.log(result);
                options.onHandshake(
                    result.algorithm, result.fingerprint,
                    requestId, fileSystemId);
            }.bind(this),
            onError: options.onError
        });
    };

    SftpFS.prototype.allowToConnect = function(requestId, fileSystemId, onSuccess, onError) {
        console.log("allowToConnect");
        var sftpClient = this.sftpClientMap_[fileSystemId];
        sftpClient.authenticate({
            requestId: requestId,
            onSuccess: function(result) {
                /*
                sftpClient.close({
                    requestId: requestId,
                    onSuccess: function()
                */
                doMount.call(
                    this,
                    sftpClient.getServerName(), sftpClient.getServerPort(),
                    sftpClient.getAuthType(),
                    sftpClient.getUsername(), sftpClient.getPassword(), sftpClient.getPrivateKey(),
                    function() {
                        onSuccess();
                    }.bind(this));
                /*
                    }.bind(this),
                    onError: function(reason) {
                        onError(reason);
                    }.bind(this)
                });
                */
            }.bind(this),
            onError: function(reason) {
                onError(reason);
            }.bind(this)
        });
    };

    SftpFS.prototype.denyToConnect = function(requestId, fileSystemId, onSuccess) {
        var sftpClient = this.sftpClientMap_[fileSystemId];
        sftpClient.destroy();
        delete this.sftpClientMap_[fileSystemId];
        onSuccess();
    };

    SftpFS.prototype.resume = function(fileSystemId, onSuccess, onError) {
        console.log("resume - start");
        chrome.storage.local.get("mountedCredentials", function(items) {
            var mountedCredentials = items.mountedCredentials || {};
            var credential = mountedCredentials[fileSystemId];
            if (credential) {
                this.mount({
                    serverName: credential.serverName,
                    serverPort: credential.serverPort,
                    authType: credential.authType,
                    username: credential.username,
                    password: credential.password,
                    privateKey: credential.privateKey,
                    onHandshake: function(algorithm, fingerprint, requestId, fileSystemId) {
                        // TODO Check the fingerprint.
                        this.allowToConnect(
                            requestId,
                            fileSystemId,
                            function() {
                                console.log("Resumed file system: " + fileSystemId);
                                onSuccess();
                            }.bind(this),
                            function(reason) {
                                console.log("Resuming failed: " + reason);
                                onError(reason);
                            }.bind(this));
                    }.bind(this),
                    onError: function(reason) {
                        console.log(reason);
                        onError(reason);
                    }.bind(this)
                });
            } else {
                onError("Credential[" + fileSystemId + "] not found");
            }
        }.bind(this));
    };

    SftpFS.prototype.onUnmountRequested = function(options, successCallback, errorCallback) {
        console.log("onUnmountRequested");
        console.log(options);
        var sftpClient = getSftpClient.call(this, options.fileSystemId);
        doUnmount.call(this, sftpClient, options.requestId, successCallback);
    };

    SftpFS.prototype.onNaClModuleCrashed = function(sftpClient, exitStatus) {
        console.log("onNaClModuleCrashed - " + exitStatus);
        if (Number(exitStatus) !== 0) {
            // doUnmount.call(this, sftpClient, 999999, function() {
            doUnmount.call(this, sftpClient, 0, function() {
                chrome.notifications.create("", {
                    type: "basic",
                    title: "SFTP File System",
                    message: "The NaCl module crashed. Unmounted.",
                    iconUrl: "images/48.png"
                }, function(notificationId) {
                }.bind(this));
            }.bind(this));
        }
    };

    SftpFS.prototype.onReadDirectoryRequested = function(options, successCallback, errorCallback) {
        console.log("onReadDirectoryRequested");
        console.log(options);
        var sftpClient = getSftpClient.call(this, options.fileSystemId);
        var requestId = createRequestId.call(this);
        prepare.call(this, sftpClient, requestId, function(closeCallback) {
            sftpClient.readDirectory({
                requestId: requestId,
                path: options.directoryPath,
                onSuccess: function(result) {
                    console.log(result);
                    successCallback(result.metadataList, false);
                    closeCallback();
                }.bind(this),
                onError: function(reason) {
                    console.log(reason);
                    errorCallback("FAILED");
                    closeCallback();
                }
            });
        }.bind(this), function(reason) {
            console.log(reason);
            errorCallback("FAILED");
        }.bind(this));
    };

    SftpFS.prototype.onGetMetadataRequested = function(options, successCallback, errorCallback) {
        console.log("onGetMetadataRequested: thumbnail=" + options.thumbnail);
        console.log(options);
        var sftpClient = getSftpClient.call(this, options.fileSystemId);
        var requestId = createRequestId.call(this);
        prepare.call(this, sftpClient, requestId, function(closeCallback) {
            sftpClient.getMetadata({
                requestId: requestId,
                path: options.entryPath,
                onSuccess: function(result) {
                    console.log(result);
                    successCallback(result.metadata);
                    closeCallback();
                }.bind(this),
                onError: function(reason) {
                    console.log(reason);
                    if (reason === "NOT_FOUND") {
                        errorCallback("NOT_FOUND");
                    } else {
                        errorCallback("FAILED");
                    }
                    closeCallback();
                }.bind(this)
            });
        }.bind(this), function(reason) {
            console.log(reason);
            errorCallback("FAILED");
        }.bind(this));
    };

    SftpFS.prototype.onOpenFileRequested = function(options, successCallback, errorCallback) {
        console.log("onOpenFileRequested");
        console.log(options);
        var sftpClient = getSftpClient.call(this, options.fileSystemId);
        var requestId = createRequestId.call(this);
        prepare.call(this, sftpClient, requestId, function(closeCallback) {
            var openedFiles = getOpenedFiles.call(this, options.fileSystemId);
            openedFiles[options.requestId] = options.filePath;
            successCallback();
            closeCallback();
        }.bind(this), function(reason) {
            console.log(reason);
            errorCallback("FAILED");
        }.bind(this));
    };

    SftpFS.prototype.onReadFileRequested = function(options, successCallback, errorCallback) {
        console.log("onReadFileRequested - start");
        console.log(options);
        var filePath = getOpenedFiles.call(this, options.fileSystemId)[options.openRequestId];
        var sftpClient = getSftpClient.call(this, options.fileSystemId);
        var requestId = createRequestId.call(this);
        prepare.call(this, sftpClient, requestId, function(closeCallback) {
            sftpClient.readFile({
                requestId: requestId,
                path: filePath,
                offset: options.offset,
                length: options.length,
                onSuccess: function(result) {
                    console.log(result);
                    successCallback(result.data, result.hasMore);
                    if (!result.hasMore) {
                        closeCallback();
                    }
                }.bind(this),
                onError: function(reason) {
                    console.log(reason);
                    errorCallback("FAILED");
                    closeCallback();
                }
            });
        }.bind(this), function(reason) {
            console.log(reason);
            errorCallback("FAILED");
        }.bind(this));
    };

    SftpFS.prototype.onCloseFileRequested = function(options, successCallback, errorCallback) {
        console.log("onCloseFileRequested");
        var sftpClient = getSftpClient.call(this, options.fileSystemId);
        var requestId = createRequestId.call(this);
        prepare.call(this, sftpClient, requestId, function(closeCallback) {
            var openedFiles = getOpenedFiles.call(this, options.fileSystemId);
            delete openedFiles[options.openRequestId];
            successCallback();
            closeCallback();
        }.bind(this), function(reason) {
            console.log(reason);
            errorCallback("FAILED");
        }.bind(this));
    };

    SftpFS.prototype.onCreateDirectoryRequested = function(options, successCallback, errorCallback) {
        console.log("onCreateDirectoryRequested");
        console.log(options);
        var sftpClient = getSftpClient.call(this, options.fileSystemId);
        var requestId = createRequestId.call(this);
        prepare.call(this, sftpClient, requestId, function(closeCallback) {
            sftpClient.createDirectory({
                requestId: requestId,
                path: options.directoryPath,
                onSuccess: function() {
                    successCallback();
                    closeCallback();
                }.bind(this),
                onError: function(reason) {
                    console.log(reason);
                    errorCallback("FAILED");
                    closeCallback();
                }
            });
        }.bind(this), function(reason) {
            console.log(reason);
            errorCallback("FAILED");
        }.bind(this));
    };

    SftpFS.prototype.onDeleteEntryRequested = function(options, successCallback, errorCallback) {
        console.log("onDeleteEntryRequested");
        console.log(options);
        var sftpClient = getSftpClient.call(this, options.fileSystemId);
        var requestId = createRequestId.call(this);
        prepare.call(this, sftpClient, requestId, function(closeCallback) {
            sftpClient.deleteEntry({
                requestId: requestId,
                path: options.entryPath,
                onSuccess: function() {
                    successCallback();
                    closeCallback();
                }.bind(this),
                onError: function(reason) {
                    console.log(reason);
                    errorCallback("FAILED");
                    closeCallback();
                }
            });
        }.bind(this), function(reason) {
            console.log(reason);
            errorCallback("FAILED");
        }.bind(this));
    };

    SftpFS.prototype.onMoveEntryRequested = function(options, successCallback, errorCallback) {
        console.log("onMoveEntryRequested");
        console.log(options);
        var sftpClient = getSftpClient.call(this, options.fileSystemId);
        var requestId = createRequestId.call(this);
        prepare.call(this, sftpClient, requestId, function(closeCallback) {
            sftpClient.moveEntry({
                requestId: requestId,
                sourcePath: options.sourcePath,
                targetPath: options.targetPath,
                onSuccess: function() {
                    successCallback();
                    closeCallback();
                }.bind(this),
                onError: function(reason) {
                    console.log(reason);
                    errorCallback("FAILED");
                    closeCallback();
                }
            });
        }.bind(this), function(reason) {
            console.log(reason);
            errorCallback("FAILED");
        }.bind(this));
    };

    SftpFS.prototype.onCopyEntryRequested = function(options, successCallback, errorCallback) {
        console.log("onCopyEntryRequested");
        console.log(options);
        // TODO Implement copy operation.
        errorCallback("INVALID_OPERATION");
    };

    SftpFS.prototype.onWriteFileRequested = function(options, successCallback, errorCallback) {
        console.log("onWriteFileRequested");
        console.log(options);
        var filePath = getOpenedFiles.call(this, options.fileSystemId)[options.openRequestId];
        var sftpClient = getSftpClient.call(this, options.fileSystemId);
        var requestId = createRequestId.call(this);
        prepare.call(this, sftpClient, requestId, function(closeCallback) {
            sftpClient.writeFile({
                requestId: requestId,
                path: filePath,
                offset: options.offset,
                data: options.data,
                onSuccess: function() {
                    successCallback();
                    closeCallback();
                }.bind(this),
                onError: function(reason) {
                    console.log(reason);
                    errorCallback("FAILED");
                    closeCallback();
                }
            });
        }.bind(this), function(reason) {
            console.log(reason);
            errorCallback("FAILED");
        }.bind(this));
    };

    SftpFS.prototype.onTruncateRequested = function(options, successCallback, errorCallback) {
        console.log("onTruncateRequested");
        console.log(options);
        var sftpClient = getSftpClient.call(this, options.fileSystemId);
        var requestId = createRequestId.call(this);
        prepare.call(this, sftpClient, requestId, function(closeCallback) {
            sftpClient.truncate({
                requestId: requestId,
                path: options.filePath,
                length: options.length,
                onSuccess: function() {
                    successCallback(false);
                    closeCallback();
                }.bind(this),
                onError: function(reason) {
                    console.log(reason);
                    errorCallback("FAILED");
                    closeCallback();
                }
            });
        }.bind(this), function(reason) {
            console.log(reason);
            errorCallback("FAILED");
        }.bind(this));
    };

    SftpFS.prototype.onCreateFileRequested = function(options, successCallback, errorCallback) {
        console.log("onCreateFileRequested");
        console.log(options);
        var sftpClient = getSftpClient.call(this, options.fileSystemId);
        var requestId = createRequestId.call(this);
        prepare.call(this, sftpClient, requestId, function(closeCallback) {
            sftpClient.createFile({
                requestId: requestId,
                path: options.filePath,
                onSuccess: function() {
                    successCallback();
                    closeCallback();
                }.bind(this),
                onError: function(reason) {
                    console.log(reason);
                    errorCallback("FAILED");
                    closeCallback();
                }
            });
        }.bind(this), function(reason) {
            console.log(reason);
            errorCallback("FAILED");
        }.bind(this));
    };

    SftpFS.prototype.checkAlreadyMounted = function(serverName, serverPort, username, callback) {
        var fileSystemId = createFileSystemID.call(this, serverName, serverPort, username);
        chrome.fileSystemProvider.getAll(function(fileSystems) {
            for (var i = 0; i < fileSystems.length; i++) {
                if (fileSystems[i].fileSystemId === fileSystemId) {
                    callback(true);
                    return;
                }
            }
            callback(false);
        }.bind(this));
    };

    // Private functions

    var doMount = function(serverName, serverPort, authType, username, password, privateKey, callback) {
        this.checkAlreadyMounted(serverName, serverPort, username, function(exists) {
            if (!exists) {
                var fileSystemId = createFileSystemID.call(this, serverName, serverPort, username);
                var displayName = serverName;
                if (Number(serverPort) !== 22) {
                    displayName += ":" + serverPort;
                }
                displayName += " (" + username + ")";
                chrome.fileSystemProvider.mount({
                    fileSystemId: fileSystemId,
                    displayName: displayName,
                    writable: true
                }, function() {
                    registerMountedCredential(
                        serverName, serverPort, authType, username, password, privateKey,
                        function() {
                            callback();
                        }.bind(this));
                }.bind(this));
            } else {
                callback();
            }
        }.bind(this));
    };

    var doUnmount = function(sftpClient, requestId, successCallback) {
        console.log("doUnmount");
        var serverName = sftpClient.getServerName();
        var serverPort = sftpClient.getServerPort();
        var username = sftpClient.getUsername();
        unregisterMountedCredential.call(
            this, serverName, serverPort, username,
            function() {
                var fileSystemId = createFileSystemID.call(this, serverName, serverPort, username);
                console.log(fileSystemId);
                chrome.fileSystemProvider.unmount({
                    fileSystemId: fileSystemId
                }, function() {
                    delete this.sftpClientMap_[fileSystemId];
                    successCallback();
                    sftpClient.destroy(requestId);
                }.bind(this));
            }.bind(this));
    };

    var registerMountedCredential = function(serverName, serverPort, authType, username, password, privateKey, callback) {
        var fileSystemId = createFileSystemID.call(this, serverName, serverPort, username);
        chrome.storage.local.get("mountedCredentials", function(items) {
            var mountedCredentials = items.mountedCredentials || {};
            mountedCredentials[fileSystemId] = {
                serverName: serverName,
                serverPort: serverPort,
                authType: authType,
                username: username,
                password: password,
                privateKey: privateKey
            };
            chrome.storage.local.set({
                mountedCredentials: mountedCredentials
            }, function() {
                callback();
            }.bind(this));
        }.bind(this));
    };

    var unregisterMountedCredential = function(serverName, serverPort, username, callback) {
        var fileSystemId = createFileSystemID.call(this, serverName, serverPort, username);
        chrome.storage.local.get("mountedCredentials", function(items) {
            var mountedCredentials = items.mountedCredentials || {};
            delete mountedCredentials[fileSystemId];
            chrome.storage.local.set({
                mountedCredentials: mountedCredentials
            }, function() {
                callback();
            }.bind(this));
        }.bind(this));
    };

    var createFileSystemID = function(serverName, serverPort, username) {
        var id = "sftpfs://" + serverName + ":" + serverPort + "/" + username;
        return id;
    };

    var createEventHandler = function(callback) {
        return function(options, successCallback, errorCallback) {
            var sftpClient = getSftpClient.call(this, options.fileSystemId);
            if (!sftpClient) {
                this.resume(options.fileSystemId, function() {
                    addTaskQueue.call(this, function() {
                        callback(options, successCallback, errorCallback);
                    }.bind(this));
                }.bind(this), function(reason) {
                    console.log("resume failed: " + reason);
                    errorCallback("FAILED");
                }.bind(this));
            } else {
                addTaskQueue.call(this, function() {
                    callback(options, successCallback, errorCallback);
                }.bind(this));
            }
        }.bind(this);
    };


    var assignEventHandlers = function() {
        chrome.fileSystemProvider.onUnmountRequested.addListener(
            createEventHandler.call(this, function(options, successCallback, errorCallback) {
                this.onUnmountRequested(options, successCallback, errorCallback);
            }.bind(this)));
        chrome.fileSystemProvider.onReadDirectoryRequested.addListener(
            createEventHandler.call(this, function(options, successCallback, errorCallback) {
                this.onReadDirectoryRequested(options, successCallback, errorCallback);
            }.bind(this)));
        chrome.fileSystemProvider.onGetMetadataRequested.addListener(
            createEventHandler.call(this, function(options, successCallback, errorCallback) {
                this.onGetMetadataRequested(options, successCallback, errorCallback);
            }.bind(this)));
        chrome.fileSystemProvider.onOpenFileRequested.addListener(
            createEventHandler.call(this, function(options, successCallback, errorCallback) {
                this.onOpenFileRequested(options, successCallback, errorCallback);
            }.bind(this)));
        chrome.fileSystemProvider.onReadFileRequested.addListener(
            createEventHandler.call(this, function(options, successCallback, errorCallback) {
                this.onReadFileRequested(options, successCallback, errorCallback);
            }.bind(this)));
        chrome.fileSystemProvider.onCloseFileRequested.addListener(
            createEventHandler.call(this, function(options, successCallback, errorCallback) {
                this.onCloseFileRequested(options, successCallback, errorCallback);
            }.bind(this)));
        chrome.fileSystemProvider.onCreateDirectoryRequested.addListener(
            createEventHandler.call(this, function(options, successCallback, errorCallback) {
                this.onCreateDirectoryRequested(options, successCallback, errorCallback);
            }.bind(this)));
        chrome.fileSystemProvider.onDeleteEntryRequested.addListener(
            createEventHandler.call(this, function(options, successCallback, errorCallback) {
                this.onDeleteEntryRequested(options, successCallback, errorCallback);
            }.bind(this)));
        chrome.fileSystemProvider.onMoveEntryRequested.addListener(
            createEventHandler.call(this, function(options, successCallback, errorCallback) {
                this.onMoveEntryRequested(options, successCallback, errorCallback);
            }.bind(this)));
        chrome.fileSystemProvider.onCopyEntryRequested.addListener(
            createEventHandler.call(this, function(options, successCallback, errorCallback) {
                this.onCopyEntryRequested(options, successCallback, errorCallback);
            }.bind(this)));
        chrome.fileSystemProvider.onWriteFileRequested.addListener(
            createEventHandler.call(this, function(options, successCallback, errorCallback) {
                this.onWriteFileRequested(options, successCallback, errorCallback);
            }.bind(this)));
        chrome.fileSystemProvider.onTruncateRequested.addListener(
            createEventHandler.call(this, function(options, successCallback, errorCallback) {
                this.onTruncateRequested(options, successCallback, errorCallback);
            }.bind(this)));
        chrome.fileSystemProvider.onCreateFileRequested.addListener(
            createEventHandler.call(this, function(options, successCallback, errorCallback) {
                this.onCreateFileRequested(options, successCallback, errorCallback);
            }.bind(this)));
    };

    var getSftpClient = function(fileSystemID) {
        var sftpClient = this.sftpClientMap_[fileSystemID];
        return sftpClient;
    };

    var prepare = function(sftpClient, requestId, onSuccess, onError) {
        /*
        sftpClient.connect({
            requestId: requestId,
            onSuccess: function(result) {
                // TODO Check fingerprint.
                sftpClient.authenticate({
                    requestId: result.requestId,
                    onSuccess: function(result) {
                        var closeCallback = function() {
                            sftpClient.close({
                                requestId: result.requestId,
                                onSuccess: function() {
                                    shiftAndConsumeQueue.call(this);
                                }.bind(this),
                                onError: onError
                            });
                        }.bind(this);
                        onSuccess(closeCallback);
                    }.bind(this),
                    onError: onError
                });
            }.bind(this),
            onError: onError
        });
        */
        var closeCallback = function() {
            if (chrome.runtime.lastError) {
                console.log(chrome.runtime.lastError);
            }
            shiftAndConsumeQueue.call(this);
        }.bind(this);
        onSuccess(closeCallback);
    };

    var addTaskQueue = function(task) {
        console.log("addTaskQueue: length=" + this.taskQueue_.length);
        this.taskQueue_.push(task);
        console.log("added task: length=" + this.taskQueue_.length);
        if (this.taskQueue_.length === 1) {
            setTimeout(function() {
                console.log("call consume task: length=" + this.taskQueue_.length);
                consumeQueue.call(this);
            }.bind(this), 10);
        }
        // task();
    };

    var consumeQueue = function() {
        console.log("consumeQueue: length=" + this.taskQueue_.length);
        if (this.taskQueue_.length > 0) {
            var task = this.taskQueue_[0];
            // var task = this.taskQueue_.shift();
            if (task) {
                console.log("execute task: length=" + this.taskQueue_.length);
                task();
            } else {
                this.taskQueue_.shift();
                console.log("dequeue task(1): length=" + this.taskQueue_.length);
                consumeQueue.call(this);
            }
        } else {
            console.log("queue: empty");
        }
    };

    var shiftAndConsumeQueue = function() {
        this.taskQueue_.shift();
        console.log("dequeue task(2): length=" + this.taskQueue_.length);
        consumeQueue.call(this);
    };

    var getOpenedFiles = function(fileSystemId) {
        var openedFiles = this.opened_files_[fileSystemId];
        if (!openedFiles) {
            openedFiles = {};
            this.opened_files_[fileSystemId] = openedFiles;
        }
        return openedFiles;
    };

    var createRequestId = function() {
        // var requestId = options.requestId;
        var requestId = 0;
        return requestId;
    };

    // Export

    window.SftpFS = SftpFS;

})();
