"use strict";

(function() {

    var onLoad = function() {
        loadKeptCredentials();
        assignEventHandlers();
    };

    var assignEventHandlers = function() {
        var btnMount = document.querySelector("#btnMount");
        btnMount.addEventListener("click", function(e) {
            onClickedBtnMount(e);
        });
        var btnKeep = document.querySelector("#btnKeep");
        btnKeep.addEventListener("click", function(e) {
            onClickedBtnKeep(e);
        });
        var btnDecline = document.querySelector("#btnDecline");
        btnDecline.addEventListener("click", function(e) {
            onClickedBtnDecline(e);
        });
        var btnAccept = document.querySelector("#btnAccept");
        btnAccept.addEventListener("click", function(e) {
            onClickedBtnAccept(e);
        });
        var authTypePassword = document.querySelector("#authTypePassword");
        authTypePassword.addEventListener("core-change", onChangeAuthType);
        var authTypeKeyboardInteractive = document.querySelector("#authTypeKeyboardInteractive");
        authTypeKeyboardInteractive.addEventListener("core-change", onChangeAuthType);
        var authTypePublickey = document.querySelector("#authTypePublickey");
        authTypePublickey.addEventListener("core-change", onChangeAuthType);
        var password = document.querySelector("#password");
        password.addEventListener("change", function(e) {
            if (document.activeElement == this) {
                onClickedBtnMount(e);
            }
        });
    };

    var onChangeAuthType = function(evt) {
        console.log("onChangeAuthType");
        evt.preventDefault();
        var publickey = document.querySelector("#authTypePublickey").checked;
        var privatekeyDecorator = document.querySelector("#privatekeyDecorator");
        var privatekey = document.querySelector("#privatekey");
        if (publickey) {
            privatekey.removeAttribute("disabled");
            privatekeyDecorator.removeAttribute("disabled");
        } else {
            privatekey.setAttribute("disabled", "true");
            privatekeyDecorator.setAttribute("disabled", "true");
        }
    };

    var onClickedBtnMount = function(evt) {
        console.log("onClickedBtnMount");
        var btnMount = document.querySelector("#btnMount");
        evt.preventDefault();
        btnMount.setAttribute("disabled", "true");
        document.getElementById("toast-mount-attempt").show();
        var request = {
            type: "mount",
            serverName: document.querySelector("#serverName").value,
            serverPort: document.querySelector("#serverPort").value,
            authType: document.querySelector("#authType").selected,
            username: document.querySelector("#username").value,
            password: document.querySelector("#password").value,
            privateKey: document.querySelector("#privatekey").value
        };
        chrome.runtime.sendMessage(request, function(response) {
            console.log(response);
            if (response.type === "confirmFingerprint") {
                document.querySelector("#algorithm").textContent = response.algorithm;
                document.querySelector("#fingerprint").textContent = response.fingerprint;
                document.querySelector("#requestId").value = response.requestId;
                document.querySelector("#fileSystemId").value = response.fileSystemId;
                document.querySelector("#confirmFingerprintDialog").toggle();
            } else {
                var toast = document.getElementById("toast-mount-fail");
                if (response.error) {
                    toast.setAttribute("text", response.error);
                }
                toast.show();
                btnMount.removeAttribute("disabled");
            }
        });
    };

    var onClickedBtnAccept = function(evt) {
        console.log("onClickedBtnAccept");
        var btnMount = document.querySelector("#btnMount");
        var requestId = document.querySelector("#requestId").value;
        var fileSystemId = document.querySelector("#fileSystemId").value;
        var request = {
            type: "accept",
            requestId: requestId,
            fileSystemId: fileSystemId
        };
        chrome.runtime.sendMessage(request, function(response) {
            if (response.success) {
                document.getElementById("toast-mount-success").show();
                window.setTimeout(function() {
                    window.close();
                }, 2000);
            } else {
                var toast = document.getElementById("toast-mount-fail");
                if (response.error) {
                    toast.setAttribute("text", response.error);
                }
                toast.show();
                btnMount.removeAttribute("disabled");
            }
        });
    };

    var onClickedBtnDecline = function(evt) {
        console.log("onClickedBtnDecline");
        var btnMount = document.querySelector("#btnMount");
        var requestId = document.querySelector("#requestId").value;
        var fileSystemId = document.querySelector("#fileSystemId").value;
        var request = {
            type: "decline",
            requestId: requestId,
            fileSystemId: fileSystemId
        };
        chrome.runtime.sendMessage(request, function(response) {
            btnMount.removeAttribute("disabled");
        });
    };

    var setMessageResources = function() {
        var selector = "data-message";
        var elements = document.querySelectorAll("[" + selector + "]");

        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];

            var messageID = element.getAttribute(selector);
            var messageText = chrome.i18n.getMessage(messageID);

            var textNode = null;

            switch(element.tagName.toLowerCase()) {
            case "paper-button":
                textNode = document.createTextNode(messageText);
                element.appendChild(textNode);
                break;
            case "paper-input":
            case "paper-input-decorator":
            case "paper-radio-button":
                element.setAttribute("label", messageText);
                break;
            case "paper-toast":
                element.setAttribute("text", messageText);
                break;
            case "h1":
            case "title":
                textNode = document.createTextNode(messageText);
                element.appendChild(textNode);
                break;
            }
        }
    };

    var onClickedBtnKeep = function(evt) {
        console.log("onClickedBtnKeep");
        var serverName = document.querySelector("#serverName").value;
        var serverPort = document.querySelector("#serverPort").value;
        var authType = document.querySelector("#authType").selected;
        var username = document.querySelector("#username").value;
        var privateKey = document.querySelector("#privatekey").value;
        if (serverName && serverPort && username) {
            chrome.storage.local.get("keptCredentials", function(items) {
                var credentials = items.keptCredentials || {};
                var key = createKey(serverName, serverPort, username);
                var credential = {
                    serverName: serverName,
                    serverPort: serverPort,
                    authType: authType,
                    username: username,
                    privateKey: privateKey
                };
                credentials[key] = credential;
                chrome.storage.local.set({
                    keptCredentials: credentials
                }, function() {
                    loadKeptCredentials();
                });
            });
        }
    };

    var loadKeptCredentials = function() {
        chrome.storage.local.get("keptCredentials", function(items) {
            document.querySelector("#credentials").innerHTML = "";
            var credentials = items.keptCredentials || {};
            for (var key in credentials) {
                appendCredentialToScreen(credentials[key]);
            }
        });
    };

    var appendCredentialToScreen = function(credential) {
        var credentials = document.querySelector("#credentials");
        var div = document.createElement("div");
        div.setAttribute("horizontal", "true");
        div.setAttribute("layout", "true");
        div.setAttribute("center", "true");
        var item = document.createElement("paper-item");
        item.textContent = createKey(credential.serverName, credential.serverPort, credential.username);
        item.addEventListener("click", (function(credential) {
            return function(evt) {
                setCredentialToForm(credential);
            };
        })(credential));
        div.appendChild(item);
        var btnClose = document.createElement("paper-icon-button");
        btnClose.setAttribute("icon", "close");
        btnClose.setAttribute("title", "Delete");
        btnClose.addEventListener("click", (function(credential) {
            return function(evt) {
                setCredentialToForm(credential);
                chrome.storage.local.get("keptCredentials", function(items) {
                    var credentials = items.keptCredentials || {};
                    var key = createKey(credential.serverName, credential.serverPort, credential.username);
                    delete credentials[key];
                    chrome.storage.local.set({
                        keptCredentials: credentials
                    }, function() {
                        loadKeptCredentials();
                    });
                });
            };
        })(credential));
        div.appendChild(btnClose);
        credentials.appendChild(div);
    };

    var setCredentialToForm = function(credential) {
        document.querySelector("#serverName").value = credential.serverName;
        document.querySelector("#serverPort").value = credential.serverPort;
        document.querySelector("#authType").selected = credential.authType;
        document.querySelector("#username").value = credential.username;
        document.querySelector("#privatekey").value = credential.privateKey;
        document.querySelector("#password").focus();
    };

    var createKey = function(serverName, serverPort, username) {
        return serverName + ":" + serverPort + " (" + username + ")";
    };

    window.addEventListener("load", function(e) {
        onLoad();
    });

    setMessageResources();

})();
