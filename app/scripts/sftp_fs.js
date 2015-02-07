(function() {

  // Constructor

  var SftpFS = function() {
    this.sftpClientMap_ = {};
    this.taskQueue_ = [];
    this.opened_files_ = {};
    assignEventHandlers.call(this);
  };

  // Public functions

  /**
   * options:
   *   serverName: The server name you want to connect.
   *   serverPort: The server port number you want to connect.
   *   authType: The authentication type.
   *   username: Your username.
   *   password: Your password.
   *   privateKey: Your key.
   *   onHandshake: The callback function to confirm that the algorithm and fingerprint are valid.
   *   onError: The callback called when an error occurs.
   */
  SftpFS.prototype.mount = function(options) {
    var sftpClient = new SftpClient(this,
      options.serverName, options.serverPort,
      options.authType, options.username, options.password, options.privateKey);
    var fileSystemId = createFileSystemID.call(
      this, options.serverName, options.serverPort, options.username);
    this.sftpClientMap_[fileSystemId] = sftpClient;
    sftpClient.setup();
    var requestId = new Date().getTime() % 2147483647;
    sftpClient.connect({
      requestId: requestId,
      onSuccess: function(result) {
        console.log(result);
        options.onHandshake(result.algorithm, result.fingerprint, requestId, fileSystemId);
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
        sftpClient.close({
          requestId: requestId,
          onSuccess: function() {
            doMount.call(this,
              sftpClient.getServerName(), sftpClient.getServerPort(),
              sftpClient.getAuthType(),
              sftpClient.getUsername(), sftpClient.getPassword(), sftpClient.getPrivateKey(),
              function() {
                onSuccess();
              }.bind(this));
          }.bind(this),
          onError: function(reason) {
            onError(reason);
          }.bind(this)
        });
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

  SftpFS.prototype.resume = function() {
    console.log("resume");
    chrome.storage.local.get("mountedCredentials", function(items) {
      var mountedCredentials = items.mountedCredentials || {};
      for (var fileSystemId in mountedCredentials) {
        var credential = mountedCredentials[fileSystemId];
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
              }.bind(this),
              function(reason) {
                console.log(reason);
              }.bind(this))
          }.bind(this),
          onError: function(reason) {
            // TODO Implement error process.
            console.log(reason);
          }.bind(this)
        });
      }
    }.bind(this));
  };

  SftpFS.prototype.onUnmountRequested = function(options, successCallback, errorCallback) {
    console.log("onUnmountRequested");
    console.log(options);
    var sftpClient = getSftpClient.call(this, options.fileSystemId);
    var serverName = sftpClient.getServerName();
    var serverPort = sftpClient.getServerPort();
    var username = sftpClient.getUsername();
    unregisterMountedCredential.call(
      this, serverName, serverPort, username,
      function() {
        var fileSystemId = createFileSystemID.call(this, serverName, serverPort, username);
        chrome.fileSystemProvider.unmount({
          fileSystemId: fileSystemId
        }, function() {
          delete this.sftpClientMap_[fileSystemId];
          successCallback();
          sftpClient.destroy(options.requestId);
        }.bind(this));
      }.bind(this));
  };

  SftpFS.prototype.onNaClModuleCrashed = function(sftpClient, exitStatus) {
    console.log("onNaClModuleCrashed");
  };

  SftpFS.prototype.onReadDirectoryRequested = function(options, successCallback, errorCallback) {
    console.log("onReadDirectoryRequested");
    console.log(options);
    var sftpClient = getSftpClient.call(this, options.fileSystemId);
    prepare.call(this, sftpClient, options.requestId, function(closeCallback) {
      sftpClient.readDirectory({
        requestId: options.requestId,
        path: options.directoryPath,
        onSuccess: function(result) {
          console.log(result);
          successCallback(result.metadataList, false);
          closeCallback();
        }.bind(this),
        onError: function(reason) {
          console.log(reason);
          errorCallback("FAILED");
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
    prepare.call(this, sftpClient, options.requestId, function(closeCallback) {
      sftpClient.getMetadata({
        requestId: options.requestId,
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
    var openedFiles = getOpenedFiles.call(this, options.fileSystemId);
    openedFiles[options.requestId] = options.filePath;
    successCallback();
  };

  SftpFS.prototype.onReadFileRequested = function(options, successCallback, errorCallback) {
    console.log("onReadFileRequested - start");
    console.log(options);
    var filePath = getOpenedFiles.call(this, options.fileSystemId)[options.openRequestId];
    var sftpClient = getSftpClient.call(this, options.fileSystemId);
    prepare.call(this, sftpClient, options.requestId, function(closeCallback) {
      sftpClient.readFile({
        requestId: options.requestId,
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
    var openedFiles = getOpenedFiles.call(this, options.fileSystemId);
    delete openedFiles[options.openRequestId];
    successCallback();
  };

  SftpFS.prototype.onCreateDirectoryRequested = function(options, successCallback, errorCallback) {
    console.log("onCreateDirectoryRequested");
    console.log(options);
    var sftpClient = getSftpClient.call(this, options.fileSystemId);
    prepare.call(this, sftpClient, options.requestId, function(closeCallback) {
      sftpClient.createDirectory({
        requestId: options.requestId,
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
    prepare.call(this, sftpClient, options.requestId, function(closeCallback) {
      sftpClient.deleteEntry({
        requestId: options.requestId,
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
    prepare.call(this, sftpClient, options.requestId, function(closeCallback) {
      sftpClient.moveEntry({
        requestId: options.requestId,
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
    prepare.call(this, sftpClient, options.requestId, function(closeCallback) {
      sftpClient.writeFile({
        requestId: options.requestId,
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
    prepare.call(this, sftpClient, options.requestId, function(closeCallback) {
      sftpClient.truncate({
        requestId: options.requestId,
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
    prepare.call(this, sftpClient, options.requestId, function(closeCallback) {
      sftpClient.createFile({
        requestId: options.requestId,
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

  // Private functions

  var doMount = function(serverName, serverPort, authType, username, password, privateKey, callback) {
    var fileSystemId = createFileSystemID.call(this, serverName, serverPort, username);
    var displayName = "SFTP(" + serverName + ")";
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

  var assignEventHandlers = function() {
    chrome.fileSystemProvider.onUnmountRequested.addListener(
      function(options, successCallback, errorCallback) {
        addTaskQueue.call(this, function() {
          this.onUnmountRequested(options, successCallback, errorCallback);
        }.bind(this));
      }.bind(this));
    chrome.fileSystemProvider.onReadDirectoryRequested.addListener(
      function(options, successCallback, errorCallback) {
        addTaskQueue.call(this, function() {
          this.onReadDirectoryRequested(options, successCallback, errorCallback);
        }.bind(this));
      }.bind(this));
    chrome.fileSystemProvider.onGetMetadataRequested.addListener(
      function(options, successCallback, errorCallback) {
        addTaskQueue.call(this, function() {
          this.onGetMetadataRequested(options, successCallback, errorCallback);
        }.bind(this));
      }.bind(this));
    chrome.fileSystemProvider.onOpenFileRequested.addListener(
      function(options, successCallback, errorCallback) {
        addTaskQueue.call(this, function() {
          this.onOpenFileRequested(options, successCallback, errorCallback);
        }.bind(this));
      }.bind(this));
    chrome.fileSystemProvider.onReadFileRequested.addListener(
      function(options, successCallback, errorCallback) {
        this.onReadFileRequested(options, successCallback, errorCallback);
      }.bind(this));
    chrome.fileSystemProvider.onCloseFileRequested.addListener(
      function(options, successCallback, errorCallback) {
        this.onCloseFileRequested(options, successCallback, errorCallback);
      }.bind(this));
    chrome.fileSystemProvider.onCreateDirectoryRequested.addListener(
      function(options, successCallback, errorCallback) {
        this.onCreateDirectoryRequested(options, successCallback, errorCallback);
      }.bind(this));
    chrome.fileSystemProvider.onDeleteEntryRequested.addListener(
      function(options, successCallback, errorCallback) {
        this.onDeleteEntryRequested(options, successCallback, errorCallback);
      }.bind(this));
    chrome.fileSystemProvider.onMoveEntryRequested.addListener(
      function(options, successCallback, errorCallback) {
        this.onMoveEntryRequested(options, successCallback, errorCallback);
      }.bind(this));
    chrome.fileSystemProvider.onCopyEntryRequested.addListener(
      function(options, successCallback, errorCallback) {
        this.onCopyEntryRequested(options, successCallback, errorCallback);
      }.bind(this));
    chrome.fileSystemProvider.onWriteFileRequested.addListener(
      function(options, successCallback, errorCallback) {
        this.onWriteFileRequested(options, successCallback, errorCallback);
      }.bind(this));
    chrome.fileSystemProvider.onTruncateRequested.addListener(
      function(options, successCallback, errorCallback) {
        this.onTruncateRequested(options, successCallback, errorCallback);
      }.bind(this));
    chrome.fileSystemProvider.onCreateFileRequested.addListener(
      function(options, successCallback, errorCallback) {
        this.onCreateFileRequested(options, successCallback, errorCallback);
      }.bind(this));
  };

  var getSftpClient = function(fileSystemID) {
    var sftpClient = this.sftpClientMap_[fileSystemID];
    return sftpClient;
  };

  var prepare = function(sftpClient, requestId, onSuccess, onError) {
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
  };

  var addTaskQueue = function(task) {
    console.log("addTaskQueue: length=" + this.taskQueue_.length);
    this.taskQueue_.push(task);
    if (this.taskQueue_.length <= 5) {
      setTimeout(function() {
        consumeQueue.call(this);
      }.bind(this), 10);
    }
    // task();
  };

  var consumeQueue = function() {
    console.log("consumeQueue: length=" + this.taskQueue_.length);
    if (this.taskQueue_.length > 0) {
      // var task = this.taskQueue_[0];
      var task = this.taskQueue_.shift();
      if (task) {
        task();
      } else {
        // this.taskQueue_.shift();
        consumeQueue.call(this);
      }
    }
  };

  var shiftAndConsumeQueue = function() {
    // this.taskQueue_.shift();
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

  // Export

  window.SftpFS = SftpFS;

})();
