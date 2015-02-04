(function() {

  // Constructor

  var SftpFS = function() {
    this.mountedSftpClientMap_ = {};
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
   *   onSuccess: The callback called when the connecting and handshaking are successfully.
   *   onError: The callback called when an error occurs.
   */
  SftpFS.prototype.mount = function(options) {
    var sftpClient = new SftpClient(
      options.serverName, options.serverPort,
      options.authType, options.username, options.password, options.privateKey);
    sftpClient.setup();
    sftpClient.connect({
      requestId: 0,
      onSuccess: function(result) {
        var successCallback = function() {
          sftpClient.authenticate({
            requestId: result.requestId,
            onSuccess: function(result) {
              sftpClient.close({
                requestId: result.requestId,
                onSuccess: function() {
                  var fileSystemId = createFileSystemID.call(
                    this, options.serverName, options.serverPort, options.username);
                  this.mountedSftpClientMap_[fileSystemId] = sftpClient;
                  doMount.call(this,
                      options.serverName, options.serverPort,
                      options.authType, options.username, options.password, options.privateKey,
                      function(fileSystemId) {
                        options.onSuccess();
                      }.bind(this));
                }.bind(this),
                onError: options.onError
              });
            }.bind(this),
            onError: options.onError
          });
        }.bind(this);
        var errorCallback = function() {
          // TODO Destroy SftpClient instance
          console.log("TODO Destroy SftpClient instance");
        }.bind(this);
        options.onHandshake(result.algorithm, result.filgerprint, successCallback, errorCallback);
      }.bind(this),
      onError: options.onError
    });
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
          onHandshake: function(algorithm, fingerprint, successCallback, errorCallback) {
            // TODO Check the fingerprint.
            successCallback();
          }.bind(this),
          onSuccess: function() {
            console.log("Resumed");
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
    /*
    this.dropbox_client_.unauthorize(function() {
      doUnmount.call(this, successCallback);
    }.bind(this), function(reason) {
      console.log(reason);
      doUnmount.call(this, successCallback);
    }.bind(this));
    */
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
          errorCallback("FAILED");
          closeCallback();
        }
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
    /*
    console.log("onCreateDirectoryRequested");
    console.log(options);
    this.dropbox_client_.createDirectory(options.directoryPath, function() {
      successCallback();
    }.bind(this), errorCallback);
    */
  };

  SftpFS.prototype.onDeleteEntryRequested = function(options, successCallback, errorCallback) {
    /*
    console.log("onDeleteEntryRequested");
    console.log(options);
    this.dropbox_client_.deleteEntry(options.entryPath, function() {
      successCallback();
    }.bind(this), errorCallback);
    */
  };

  SftpFS.prototype.onMoveEntryRequested = function(options, successCallback, errorCallback) {
    /*
    console.log("onMoveEntryRequested");
    console.log(options);
    this.dropbox_client_.moveEntry(options.sourcePath, options.targetPath, function() {
      successCallback();
    }.bind(this), errorCallback);
    */
  };

  SftpFS.prototype.onCopyEntryRequested = function(options, successCallback, errorCallback) {
    /*
    console.log("onCopyEntryRequested");
    console.log(options);
    this.dropbox_client_.copyEntry(options.sourcePath, options.targetPath, function() {
      successCallback();
    }.bind(this), errorCallback);
    */
  };

  SftpFS.prototype.onWriteFileRequested = function(options, successCallback, errorCallback) {
    /*
    console.log("onWriteFileRequested");
    console.log(options);
    var filePath = this.opened_files_[options.openRequestId];
    this.dropbox_client_.writeFile(filePath, options.data, options.offset, options.openRequestId, function() {
      successCallback();
    }.bind(this), errorCallback);
    */
  };

  SftpFS.prototype.onTruncateRequested = function(options, successCallback, errorCallback) {
    /*
    console.log("onTruncateRequested");
    console.log(options);
    this.dropbox_client_.truncate(options.filePath, options.length, function() {
      console.log("onTruncateRequested - done");
      console.log(successCallback);
      successCallback(false);
    }.bind(this), errorCallback);
    */
  };

  SftpFS.prototype.onCreateFileRequested = function(options, successCallback, errorCallback) {
    /*
    console.log("onCreateFileRequested");
    console.log(options);
    this.dropbox_client_.createFile(options.filePath, function() {
      successCallback();
    }.bind(this), errorCallback);
    */
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
          callback(fileSystemId);
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
    /*
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
    */
  };

  var getSftpClient = function(fileSystemID) {
    var sftpClient = this.mountedSftpClientMap_[fileSystemID];
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
