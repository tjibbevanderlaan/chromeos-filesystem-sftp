'use strict';
(function() {
    var wordArrayToUnit8Array = function(wordArray) {
        var buffer = new ArrayBuffer(wordArray.sigBytes);
        var view = new DataView(buffer, 0, buffer.byteLength);
        for (var i = 0; i < wordArray.words.length; i++) {
            view.setInt32(i * 4, wordArray.words[i], false);
        }
        return new Uint8Array(buffer);
    };
    var uint8ArrayToWordArray = function(typedArray) {
        var typedArrayByteLength = typedArray.length;
        var words = [];
        for (var i = 0; i < typedArrayByteLength; i++) {
            words[i >>> 2] |= typedArray[i] << (24 - (i % 4) * 8);
        }
        return words;
    };

    window.addEventListener("DOMContentLoaded", function() {
        var handshake = document.querySelector("#handshake");
        handshake.addEventListener("click", function(evt) {
            var sftpModule = document.querySelector("#sftp");
            var obj = {
                command: "connect",
                request: document.querySelector("#request_id").value,
                args: [
                    document.querySelector("#ssh2_server").value,
                    document.querySelector("#ssh2_port").value
                ]
            };
            sftpModule.postMessage(JSON.stringify(obj));
            console.log("sent");
        });
        var authenticate = document.querySelector("#authenticate");
        authenticate.addEventListener("click", function(evt) {
            var sftpModule = document.querySelector("#sftp");
            var obj = {
                command: "authenticate",
                request: document.querySelector("#request_id").value,
                args: [
                    document.querySelector("#ssh2_method").value,
                    document.querySelector("#ssh2_username").value,
                    document.querySelector("#ssh2_password").value,
                    ""
                ]
            };
            sftpModule.postMessage(JSON.stringify(obj));
            console.log("sent");
        });
        var dir = document.querySelector("#dir");
        dir.addEventListener("click", function(evt) {
            var sftpModule = document.querySelector("#sftp");
            var obj = {
                command: "dir",
                request: document.querySelector("#request_id").value,
                args: [
                    document.querySelector("#path").value
                ]
            };
            sftpModule.postMessage(JSON.stringify(obj));
            console.log("sent");
        });
        var file = document.querySelector("#file");
        file.addEventListener("click", function(evt) {
            var sftpModule = document.querySelector("#sftp");
            var obj = {
                command: "file",
                request: document.querySelector("#request_id").value,
                args: [
                    document.querySelector("#path").value
                ]
            };
            sftpModule.postMessage(JSON.stringify(obj));
            console.log("sent");
        });
        var read = document.querySelector("#read");
        read.addEventListener("click", function(evt) {
            var sftpModule = document.querySelector("#sftp");
            var obj = {
                command: "read",
                request: document.querySelector("#request_id").value,
                args: [
                    document.querySelector("#path").value,
                    document.querySelector("#read_offset").value,
                    document.querySelector("#read_length").value
                ]
            };
            sftpModule.postMessage(JSON.stringify(obj));
            console.log("sent");
        });
        var mkdir = document.querySelector("#mkdir");
        mkdir.addEventListener("click", function(evt) {
            var sftpModule = document.querySelector("#sftp");
            var obj = {
                command: "mkdir",
                request: document.querySelector("#request_id").value,
                args: [
                    document.querySelector("#path").value
                ]
            };
            sftpModule.postMessage(JSON.stringify(obj));
            console.log("sent");
        });
        var deleteFile = document.querySelector("#delete");
        deleteFile.addEventListener("click", function(evt) {
            var sftpModule = document.querySelector("#sftp");
            var obj = {
                command: "delete",
                request: document.querySelector("#request_id").value,
                args: [
                    document.querySelector("#path").value
                ]
            };
            sftpModule.postMessage(JSON.stringify(obj));
            console.log("sent");
        });
        var rename = document.querySelector("#rename");
        rename.addEventListener("click", function(evt) {
            var sftpModule = document.querySelector("#sftp");
            var obj = {
                command: "rename",
                request: document.querySelector("#request_id").value,
                args: [
                    document.querySelector("#path").value,
                    document.querySelector("#target").value
                ]
            };
            sftpModule.postMessage(JSON.stringify(obj));
            console.log("sent");
        });
        var create = document.querySelector("#create");
        create.addEventListener("click", function(evt) {
            var sftpModule = document.querySelector("#sftp");
            var obj = {
                command: "create",
                request: document.querySelector("#request_id").value,
                args: [
                    document.querySelector("#path").value
                ]
            };
            sftpModule.postMessage(JSON.stringify(obj));
            console.log("sent");
        });
        var write = document.querySelector("#write");
        write.addEventListener("click", function(evt) {
            var buffer = new ArrayBuffer(8);
            var typedArray = new Uint8Array(buffer);
            typedArray[0] = 0x61;
            typedArray[1] = 0x62;
            typedArray[2] = 0x63;
            typedArray[3] = 0x0a;
            typedArray[4] = 0x64;
            typedArray[5] = 0x65;
            typedArray[6] = 0x66;
            typedArray[7] = 0x0a;
            var wordArray = CryptoJS.lib.WordArray.create(buffer);
            console.log(wordArray);
            var b64Data = CryptoJS.enc.Base64.stringify(wordArray);
            console.log(b64Data);
            var sftpModule = document.querySelector("#sftp");
            var obj = {
                command: "write",
                request: document.querySelector("#request_id").value,
                args: [
                    document.querySelector("#path").value,
                    Number(document.querySelector("#write_offset").value),
                    Number(document.querySelector("#write_length").value),
                    b64Data
                ]
            };
            sftpModule.postMessage(JSON.stringify(obj));
            console.log("sent");
        });
        var truncate = document.querySelector("#truncate");
        truncate.addEventListener("click", function(evt) {
            var sftpModule = document.querySelector("#sftp");
            var obj = {
                command: "truncate",
                request: document.querySelector("#request_id").value,
                args: [
                    document.querySelector("#path").value,
                    Number(document.querySelector("#write_length").value)
                ]
            };
            sftpModule.postMessage(JSON.stringify(obj));
            console.log("sent");
        });
        var close = document.querySelector("#close");
        close.addEventListener("click", function(evt) {
            var sftpModule = document.querySelector("#sftp");
            var obj = {
                command: "close",
                request: document.querySelector("#request_id").value,
                args: []
            };
            sftpModule.postMessage(JSON.stringify(obj));
            console.log("sent");
        });
        var listener = document.querySelector("#listener");
        listener.addEventListener("message", function(evt) {
            console.log(evt);
            var output = document.querySelector("#output");
            output.textContent = evt.data;
            var result = JSON.parse(evt.data);
            console.log(result);
            if (result.message === "readFile") {
                var wordArray  = CryptoJS.enc.Base64.parse(result.value.b64Data);
                console.log(wordArray);
                var typedArray = wordArrayToUnit8Array(wordArray);
                console.log(typedArray);
            }
        }, true);
    });
})();
