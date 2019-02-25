"use strict";

(function() {

    // Constructor

    var SftpFS = function() {
        this.sftpClientMap_ = {};
        this.taskQueue_ = {};
        this.opened_files_ = {};
        this.metadataCache_ = {};
        this.notifier = defaultNotification;
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
            options.password, options.privateKey,
            options.mountPath, options.displayName);
        this.sftpClientMap_[fileSystemId] = sftpClient;
        // createTaskQueue.call(this, fileSystemId);
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
                doMount.call(
                    this,
                    sftpClient.getServerName(), sftpClient.getServerPort(),
                    sftpClient.getAuthType(),
                    sftpClient.getUsername(), sftpClient.getPassword(), sftpClient.getPrivateKey(),
                    sftpClient.getMountPath(), sftpClient.getDisplayName(),
                    function() {
                        onSuccess();
                    }.bind(this));
            }.bind(this),
            onError: handleResultCode.call(this, sftpClient, requestId, fileSystemId, function(reason, resultCode) {
                onError(reason);
            }.bind(this))
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
        getMountedCredential.call(this, fileSystemId, function(credential) {
            if (credential) {
                this.mount({
                    serverName: credential.serverName,
                    serverPort: credential.serverPort,
                    authType: credential.authType,
                    username: credential.username,
                    password: credential.password,
                    privateKey: credential.privateKey,
                    mountPath: credential.mountPath,
                    displayName: credential.displayName,
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
                this.notifier("crash", "sftpThreadError_resumeConnectionFailed", sftpClient.getDisplayName());
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
                    var metadataCache = getMetadataCache.call(this, options.fileSystemId);
                    metadataCache.put(options.directoryPath, result.metadataList);
                    successCallback(result.metadataList, false);
                    closeCallback();
                }.bind(this),
                onError: handleResultCode.call(this, sftpClient, requestId, options.fileSystemId, function(reason, resultCode) {
                    console.log(reason, resultCode);
                    errorCallback("FAILED");
                    closeCallback();
                }.bind(this))
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
            var metadataCache = getMetadataCache.call(this, options.fileSystemId);
            var cache = metadataCache.get(options.entryPath);
            if (cache.directoryExists && cache.fileExists) {
                successCallback(cache.metadata);
                closeCallback();
            } else {
                sftpClient.getMetadata({
                    requestId: requestId,
                    path: options.entryPath,
                    onSuccess: function(result) {
                        console.log(result);
                        successCallback(result.metadata);
                        closeCallback();
                    }.bind(this),
                    onError: handleResultCode.call(this, sftpClient, requestId, options.fileSystemId, function(reason, resultCode) {
                        console.log(reason, resultCode);
                        if (reason === "NOT_FOUND") {
                            errorCallback("NOT_FOUND");
                        } else {
                            errorCallback("FAILED");
                        }
                        closeCallback();
                    }.bind(this))
                });
            }
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
                onError: handleResultCode.call(this, sftpClient, requestId, options.fileSystemId, function(reason, resultCode) {
                    console.log(reason, resultCode);
                    errorCallback("FAILED");
                    closeCallback();
                }.bind(this))
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
                onError: handleResultCode.call(this, sftpClient, requestId, options.fileSystemId, function(reason, resultCode) {
                    console.log(reason, resultCode);
                    errorCallback("FAILED");
                    closeCallback();
                }.bind(this))
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
                    var metadataCache = getMetadataCache.call(this, options.fileSystemId);
                    metadataCache.remove(options.entryPath);
                    successCallback();
                    closeCallback();
                }.bind(this),
                onError: handleResultCode.call(this, sftpClient, requestId, options.fileSystemId, function(reason, resultCode) {
                    console.log(reason, resultCode);
                    errorCallback("FAILED");
                    closeCallback();
                }.bind(this))
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
                    var metadataCache = getMetadataCache.call(this, options.fileSystemId);
                    metadataCache.remove(options.sourcePath);
                    metadataCache.remove(options.targetPath);
                    successCallback();
                    closeCallback();
                }.bind(this),
                onError: handleResultCode.call(this, sftpClient, requestId, options.fileSystemId, function(reason, resultCode) {
                    console.log(reason, resultCode);
                    errorCallback("FAILED");
                    closeCallback();
                }.bind(this))
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
                onError: handleResultCode.call(this, sftpClient, requestId, options.fileSystemId, function(reason, resultCode) {
                    console.log(reason, resultCode);
                    errorCallback("FAILED");
                    closeCallback();
                }.bind(this))
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
                onError: handleResultCode.call(this, sftpClient, requestId, options.fileSystemId, function(reason, resultCode) {
                    console.log(reason, resultCode);
                    errorCallback("FAILED");
                    closeCallback();
                }.bind(this))
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
                    var metadataCache = getMetadataCache.call(this, options.fileSystemId);
                    metadataCache.remove(options.filePath);
                    successCallback();
                    closeCallback();
                }.bind(this),
                onError: handleResultCode.call(this, sftpClient, requestId, options.fileSystemId, function(reason, resultCode) {
                    console.log(reason, resultCode);
                    errorCallback("FAILED");
                    closeCallback();
                }.bind(this))
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

    SftpFS.prototype.setCustomNotifier = function(notifyFunction) {
        this.notifier = notifyFunction;
    };

    // Private functions

    var doMount = function(serverName, serverPort, authType, username, password, privateKey, mountPath, displayName, callback) {
        this.checkAlreadyMounted(serverName, serverPort, username, function(exists) {
            if (!exists) {
                var fileSystemId = createFileSystemID.call(this, serverName, serverPort, username);
                if(displayName.length === 0) displayName = serverName;
                // var displayName = serverName;
                // if (Number(serverPort) !== 22) {
                //     displayName += ":" + serverPort;
                // }
                // displayName += " (" + username + ")";
                chrome.fileSystemProvider.mount({
                    fileSystemId: fileSystemId,
                    displayName: displayName,
                    writable: true
                }, function() {
                    registerMountedCredential(
                        serverName, serverPort, authType, username, password, privateKey, mountPath, displayName,
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
        _doUnmount.call(
            this,
            sftpClient.getServerName(),
            sftpClient.getServerPort(),
            sftpClient.getUsername(),
            function() {
                sftpClient.destroy(requestId);
                successCallback();
            }.bind(this));
    };

    var _doUnmount = function(serverName, serverPort, username, successCallback) {
        console.log("_doUnmount");
        unregisterMountedCredential.call(
            this, serverName, serverPort, username,
            function() {
                var fileSystemId = createFileSystemID.call(this, serverName, serverPort, username);
                console.log(fileSystemId);
                delete this.sftpClientMap_[fileSystemId];
                deleteTaskQueue.call(this, fileSystemId);
                deleteMetadataCache.call(this, fileSystemId);
                successCallback();
                chrome.fileSystemProvider.unmount({
                    fileSystemId: fileSystemId
                }, function() {
                    // N/A
                }.bind(this));
            }.bind(this));
    };

    var registerMountedCredential = function(
            serverName, serverPort, authType, username, password, privateKey, mountPath, displayName, callback) {
        var fileSystemId = createFileSystemID.call(this, serverName, serverPort, username);
        chrome.storage.local.get("mountedCredentials", function(items) {
            var mountedCredentials = items.mountedCredentials || {};
            mountedCredentials[fileSystemId] = {
                serverName: serverName,
                serverPort: serverPort,
                authType: authType,
                username: username,
                password: password,
                privateKey: privateKey,
                mountPath: mountPath,
                displayName: displayName
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

    var getMountedCredential = function(fileSystemId, callback) {
        chrome.storage.local.get("mountedCredentials", function(items) {
            var mountedCredentials = items.mountedCredentials || {};
            var credential = mountedCredentials[fileSystemId];
            callback(credential);
        }.bind(this));
    };

    var createFileSystemID = function(serverName, serverPort, username) {
        var id = "sftpfs://" + serverName + ":" + serverPort + "/" + username;
        return id;
    };

    var createEventHandler = function(callback) {
        return function(options, successCallback, errorCallback) {
            var fileSystemId = options.fileSystemId;
            addTaskQueue.call(this, fileSystemId, function() {
                var sftpClient = getSftpClient.call(this, fileSystemId);
                if (!sftpClient) {
                    this.resume(fileSystemId, function() {
                        callback(options, successCallback, errorCallback);
                    }.bind(this), function(reason) {
                        console.log("resume failed: " + reason);
                        this.notifier("connection_fail", "sftpThreadError_resumeConnectionFailed", sftpClient.getDisplayName());

                        getMountedCredential.call(this, fileSystemId, function(credential) {
                            if (credential) {
                                _doUnmount.call(
                                    this,
                                    credential.serverName,
                                    credential.serverPort,
                                    credential.username,
                                    function() {
                                        errorCallback("FAILED");
                                    }.bind(this));
                            } else {
                                console.log("Credential for [" + fileSystemId + "] not found.");
                                errorCallback("FAILED");
                            }
                        }.bind(this));
                    }.bind(this));
                } else {
                    callback(options, successCallback, errorCallback);
                }
            }.bind(this));
        }.bind(this);
    };

    var assignEventHandlers = function() {
        chrome.fileSystemProvider.onUnmountRequested.addListener(
            function(options, successCallback, errorCallback) { // Unmount immediately
                var fileSystemId = options.fileSystemId;
                var sftpClient = getSftpClient.call(this, fileSystemId);
                if (!sftpClient) {
                    this.resume(fileSystemId, function() {
                        this.onUnmountRequested(options, successCallback, errorCallback);
                    }.bind(this), function(reason) {
                        console.log("resume failed: " + reason);
                        errorCallback("FAILED");
                    }.bind(this));
                } else {
                    this.onUnmountRequested(options, successCallback, errorCallback);
                }
            }.bind(this));
        chrome.fileSystemProvider.onReadDirectoryRequested.addListener(
            createEventHandler.call(this, function(options, successCallback, errorCallback) {
                this.onReadDirectoryRequested(options, successCallback, errorCallback);
            }.bind(this)));
        chrome.fileSystemProvider.onGetMetadataRequested.addListener(
            function(options, successCallback, errorCallback) {
                var handler = createEventHandler.call(this, function(options, successCallback, errorCallback) {
                    this.onGetMetadataRequested(options, successCallback, errorCallback);
                }.bind(this));
                var fileSystemId = options.fileSystemId;
                var sftpClient = getSftpClient.call(this, fileSystemId);
                if (sftpClient) {
                    var metadataCache = getMetadataCache.call(this, fileSystemId);
                    var cache = metadataCache.get(options.entryPath);
                    if (cache.directoryExists && cache.fileExists) {
                        successCallback(cache.metadata);
                    } else {
                        handler(options, successCallback, errorCallback);
                    }
                } else {
                    handler(options, successCallback, errorCallback);
                }
            }.bind(this));
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
        var closeCallback = (function(self, sftpClient) {
            return function() {
                if (chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError);
                }
                var fileSystemId = createFileSystemID.call(self,
                    sftpClient.getServerName(), sftpClient.getServerPort(), sftpClient.getUsername());
                shiftAndConsumeQueue.call(self, fileSystemId);
            }.bind(self);
        })(this, sftpClient);
        onSuccess(closeCallback);
    };

    var handleResultCode = function(sftpClient, requestId, fileSystemId, callback) {
        return function(reason, resultCode) {
            if (resultCode === -43) { // LIBSSH2_ERROR_SOCKET_RECV
                this.resume(fileSystemId, function() {
                    this.notifier("reconnected", "sftpThreadError_reconnected");
                    callback(reason, resultCode);
                }.bind(this), function(reason) {
                    doUnmount.call(this, sftpClient, requestId, function() {
                        this.notifier("failed", "sftpThreadError_connectFailed");
                    }.bind(this));
                }.bind(this));
            } else {
                callback(reason, resultCode);
            }
        }.bind(this);
    };

    var getTaskQueue = function(fileSystemId) {
        var taskQueue = this.taskQueue_[fileSystemId];
        if (!taskQueue) {
            taskQueue = new TaskQueue();
            this.taskQueue_[fileSystemId] = taskQueue;
            console.log("getTaskQueue: Created. " + fileSystemId);
        }
        return taskQueue;
    };

    var deleteTaskQueue = function(fileSystemId) {
        console.log("deleteTaskQueue: " + fileSystemId);
        delete this.taskQueue_[fileSystemId];
    };

    var addTaskQueue = function(fileSystemId, task) {
        var taskQueue = getTaskQueue.call(this, fileSystemId);
        taskQueue.addTask(task);
    };

    var shiftAndConsumeQueue = function(fileSystemId) {
        var taskQueue = getTaskQueue.call(this, fileSystemId);
        taskQueue.shiftAndConsumeTask();
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

    var getMetadataCache = function(fileSystemId) {
        var metadataCache = this.metadataCache_[fileSystemId];
        if (!metadataCache) {
            metadataCache = new MetadataCache();
            this.metadataCache_[fileSystemId] = metadataCache;
            console.log("getMetadataCache: Created. " + fileSystemId);
        }
        return metadataCache;
    };

    var deleteMetadataCache = function(fileSystemId) {
        console.log("deleteMetadataCache: " + fileSystemId);
        delete this.metadataCache_[fileSystemId];
    };

    var defaultNotification = function(notificationId, message, type) {
        console.log("defaultNotification " + message);
        chrome.notifications.create(notificationId, {
            type: type || "basic",
            title: chrome.i18n.getMessage("appName"),
            message: message || "",
            iconUrl: "/icons/48.png"
        });
    };

    // Export

    window.SftpFS = SftpFS;

})();
