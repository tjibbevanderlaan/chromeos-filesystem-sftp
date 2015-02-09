"use strict";

(function() {

    // Constructor

    var SftpClient = function(sftpFS, serverName, serverPort, authType, username, password, privateKey) {
        this.serverName_ = serverName;
        this.serverPort_ = serverPort;
        this.authType_ = authType;
        this.username_ = username;
        this.password_ = password;
        this.privateKey_ = privateKey;

        this.sftpFS_ = sftpFS;

        this.naclListener_ = null;
        this.naclEmbed_ = null;

        this.naclEventListenerMap_ = {};
    };

    // Public functions

    SftpClient.prototype.getServerName = function() {
        return this.serverName_;
    };

    SftpClient.prototype.getServerPort = function() {
        return this.serverPort_;
    };

    SftpClient.prototype.getUsername = function() {
        return this.username_;
    };

    SftpClient.prototype.getAuthType = function() {
        return this.authType_;
    };

    SftpClient.prototype.getPassword = function() {
        return this.password_;
    };

    SftpClient.prototype.getPrivateKey = function() {
        return this.privateKey_;
    };

    SftpClient.prototype.setup = function() {
        var elements = loadNaClModule.call(this);
        this.naclListener_ = elements.listener;
        this.naclEmbed_ = elements.embed;
        this.naclListener_.addEventListener("message", function(e) {
            var event = JSON.parse(e.data);
            console.log(event);
            var requestId = event.request;
            var listener = this.naclEventListenerMap_[requestId];
            if (listener) {
                listener(event);
            } else {
                console.log("Listener[" + requestId + "] not found");
            }
        }.bind(this), true);
        this.naclListener_.addEventListener("crash", function(e) {
            console.log(this.naclEmbed_.exitStatus);
            this.sftpFS_.onNaClModuleCrashed(this, this.naclEmbed_.exitStatus);
        }.bind(this), true);
    };

    SftpClient.prototype.connect = function(options) {
        addNaClEventListener.call(this, options.requestId, function(event) {
            if (checkEventMessage.call(this, event, "fingerprint", options.onError)) {
                options.onSuccess({
                    requestId: event.request,
                    fingerprint: event.values[0],
                    algorithm: event.values[1]
                });
            }
        }.bind(this));
        postMessageToNaClModule.call(this, "connect", options.requestId, [this.serverName_, this.serverPort_]);
    };

    SftpClient.prototype.authenticate = function(options) {
        addNaClEventListener.call(this, options.requestId, function(event) {
            if (checkEventMessage.call(this, event, "authenticated", options.onError)) {
                options.onSuccess({
                    requestId: event.request
                });
            }
        }.bind(this));
        postMessageToNaClModule.call(this, "authenticate", options.requestId, [
            this.authType_, this.username_, this.password_, this.privateKey_
        ]);
    };

    SftpClient.prototype.close = function(options) {
        addNaClEventListener.call(this, options.requestId, function(event) {
            if (checkEventMessage.call(this, event, "shutdown", options.onError)) {
                options.onSuccess();
            }
        }.bind(this));
        postMessageToNaClModule.call(this, "close", options.requestId, []);
    };

    SftpClient.prototype.getMetadata = function(options) {
        addNaClEventListener.call(this, options.requestId, function(event) {
            if (checkEventMessage.call(this, event, "metadataList")) {
                var data = event.values[0];
                var metadata = {
                    isDirectory: data.isDirectory,
                    name: getNameFromPath.call(this, data.name),
                    size: data.size,
                    modificationTime: new Date(data.modificationTime * 1000)
                };
                options.onSuccess({
                    metadata: metadata
                });
            } else {
                options.onError("NOT_FOUND");
            }
        }.bind(this));
        postMessageToNaClModule.call(this, "file", options.requestId, [options.path]);
    };

    SftpClient.prototype.readDirectory = function(options) {
        addNaClEventListener.call(this, options.requestId, function(event) {
            if (checkEventMessage.call(this, event, "metadataList", options.onError)) {
                var metadataList = [];
                for (var i = 0; i < event.values.length; i++) {
                    var data = event.values[i];
                    var metadata = {
                        isDirectory: data.isDirectory,
                        name: getNameFromPath.call(this, data.name),
                        size: data.size,
                        modificationTime: new Date(data.modificationTime * 1000)
                    };
                    metadataList.push(metadata);
                }
                options.onSuccess({
                    metadataList: metadataList
                });
            }
        }.bind(this));
        postMessageToNaClModule.call(this, "dir", options.requestId, [options.path]);
    };

    SftpClient.prototype.readFile = function(options) {
        addNaClEventListener.call(this, options.requestId, function(event) {
            if (checkEventMessage.call(this, event, "readFile", options.onError)) {
                var base64 = event.value.b64Data;
                var length = event.value.length;
                var hasMore = event.value.hasMore;
                var decodedWordArray = CryptoJS.enc.Base64.parse(base64);
                console.log(decodedWordArray);
                var decodedTypedArray = wordArrayToUint8Array.call(this, decodedWordArray);
                options.onSuccess({
                    data: decodedTypedArray.buffer,
                    hasMore: hasMore
                });
            }
        }.bind(this));
        postMessageToNaClModule.call(this, "read", options.requestId, [options.path, options.offset, options.length]);
    };

    SftpClient.prototype.createDirectory = function(options) {
        addNaClEventListener.call(this, options.requestId, function(event) {
            if (checkEventMessage.call(this, event, "mkdirSuccessful", options.onError)) {
                options.onSuccess();
            }
        }.bind(this));
        postMessageToNaClModule.call(this, "mkdir", options.requestId, [options.path]);
    };

    SftpClient.prototype.deleteEntry = function(options) {
        addNaClEventListener.call(this, options.requestId, function(event) {
            if (checkEventMessage.call(this, event, "deleteSuccessful", options.onError)) {
                options.onSuccess();
            }
        }.bind(this));
        postMessageToNaClModule.call(this, "delete", options.requestId, [options.path]);
    };

    SftpClient.prototype.moveEntry = function(options) {
        addNaClEventListener.call(this, options.requestId, function(event) {
            if (checkEventMessage.call(this, event, "renameSuccessful", options.onError)) {
                options.onSuccess();
            }
        }.bind(this));
        postMessageToNaClModule.call(this, "rename", options.requestId, [options.sourcePath, options.targetPath]);
    };

    SftpClient.prototype.createFile = function(options) {
        addNaClEventListener.call(this, options.requestId, function(event) {
            if (checkEventMessage.call(this, event, "createSuccessful", options.onError)) {
                options.onSuccess();
            }
        }.bind(this));
        postMessageToNaClModule.call(this, "create", options.requestId, [options.path]);
    };

    SftpClient.prototype.truncate = function(options) {
        addNaClEventListener.call(this, options.requestId, function(event) {
            if (checkEventMessage.call(this, event, "truncateSuccessful", options.onError)) {
                options.onSuccess();
            }
        }.bind(this));
        postMessageToNaClModule.call(this, "truncate", options.requestId, [options.path, options.length]);
    };

    SftpClient.prototype.writeFile = function(options) {
        var data = options.data;
        var offset = options.offset;
        var length = data.byteLength;
        var path = options.path;
        var start = 0;
        var doWriteFileData = function() {
            var available = Math.min(32 * 1024, length - start);
            var view = new Uint8Array(data, start, available);
            var buffer = new ArrayBuffer(available);
            var bufferView = new Uint8Array(buffer);
            bufferView.set(view);
            var wordArray = CryptoJS.lib.WordArray.create(buffer);
            var b64Data = CryptoJS.enc.Base64.stringify(wordArray);
            postMessageToNaClModule.call(
                this, "write", options.requestId,
                [path, offset + start, available, b64Data]);
            start += available;
        }.bind(this);
        addNaClEventListener.call(this, options.requestId, function(event) {
            if (checkEventMessage.call(this, event, "writeSuccessful", options.onError)) {
                if (length <= start) {
                    options.onSuccess();
                } else {
                    doWriteFileData();
                }
            }
        }.bind(this));
        doWriteFileData();
    };

    SftpClient.prototype.destroy = function(requestId) {
        postMessageToNaClModule.call(this, "destroy", requestId, []);
    };

    // Private functions

    var loadNaClModule = function() {
        var listener = document.createElement("div");
        var embed = document.createElement("embed");
        embed.width = 0;
        embed.height = 0;
        embed.src = "newlib/Release/sftp.nmf";
        embed.type = "application/x-nacl";
        listener.appendChild(embed);
        document.body.appendChild(listener);
        return {
            listener: listener,
            embed: embed
        };
    };

    var addNaClEventListener = function(requestId, listener) {
        this.naclEventListenerMap_[requestId] = listener;
    };

    var postMessageToNaClModule = function(command, requestId, args) {
        this.naclEmbed_.postMessage(JSON.stringify({
            command: command,
            request: requestId,
            args: args
        }));
    };

    var checkEventMessage = function(event, message, onError) {
        if (event.message === message) {
            return true;
        } else {
            if (onError) {
                if (event.message === "error") {
                    onError(event.values[0]);
                } else {
                    onError("Unexpected message received(expect:" + message + " actual:" + event.message + ")");
                }
            }
            return false;
        }
    };

    var getNameFromPath = function(path) {
        var names = path.split("/");
        var name = names[names.length - 1];
        return name;
    };

    var wordArrayToUint8Array = function(wordArray) {
        var words = wordArray.words;
        var sigBytes = wordArray.sigBytes;
        var arrayBuffer = new ArrayBuffer(sigBytes);
        var uint8View = new Uint8Array(arrayBuffer);
        for (var i = 0; i < sigBytes; i++) {
            /* jshint bitwise: false */
            uint8View[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        }
        return uint8View;
    };

    // Export

    window.SftpClient = SftpClient;

})();
