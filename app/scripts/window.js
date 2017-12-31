"use strict";

(function() {

    var onLoad = function() {
        loadKeptCredentials();
        assignEventHandlers();
        showSeasonImage();
    };

    var showSeasonImage = function() {
        var today = new Date();
        var month = today.getMonth() + 1;
        var date = today.getDate();
        // Xmas
        if (month === 12 && (1 <= date && date <= 25)) {
            var img = document.createElement("img");
            img.src = "images/xmas.png";
            img.classList.add("season");
            var logo = document.querySelector("#logo");
            img.style.top = logo.getBoundingClientRect().top + "px";
            img.style.left = (logo.getBoundingClientRect().left + 24) + "px";
            var body = document.querySelector("body");
            body.appendChild(img);
        }
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
        authTypePassword.addEventListener("click", onChangeAuthType);
        var authTypeKeyboardInteractive = document.querySelector("#authTypeKeyboardInteractive");
        authTypeKeyboardInteractive.addEventListener("click", onChangeAuthType);
        var authTypePublickey = document.querySelector("#authTypePublickey");
        authTypePublickey.addEventListener("click", onChangeAuthType);
        var password = document.querySelector("#password");
        password.addEventListener("change", function(e) {
            if (document.activeElement === this) {
                onClickedBtnMount(e);
            }
        });
        // Settings dialog
        var btnSettings = document.querySelector("#btnSettings");
        btnSettings.addEventListener("click", function(e) {
            onClickedBtnSettings(e);
        });
        var keepPasswordYes = document.querySelector("#keepPasswordYes");
        keepPasswordYes.addEventListener("click", onChangeKeepPassword);
        var keepPasswordNo = document.querySelector("#keepPasswordNo");
        keepPasswordNo.addEventListener("click", onChangeKeepPassword);
    };

    var onChangeAuthType = function(evt) {
        console.log("onChangeAuthType");
        var publickey = document.querySelector("#authTypePublickey").checked;
        var privatekey = document.querySelector("#privatekey");
        if (publickey) {
            privatekey.removeAttribute("disabled");
        } else {
            privatekey.setAttribute("disabled", "true");
        }
    };

    var onClickedBtnMount = function(evt) {
        console.log("onClickedBtnMount");
        var btnMount = document.querySelector("#btnMount");
        evt.preventDefault();
        btnMount.setAttribute("disabled", "true");
        $.toaster({message: chrome.i18n.getMessage("mountAttempt")});
        var authType = document.forms.mainForm.authType.value;
        var request = {
            type: "mount",
            serverName: document.querySelector("#serverName").value,
            serverPort: document.querySelector("#serverPort").value,
            authType: authType,
            username: document.querySelector("#username").value,
            password: document.querySelector("#password").value,
            privateKey: document.querySelector("#privatekey").value,
            mountPath: document.querySelector("#mountPath").value
        };
        chrome.runtime.sendMessage(request, function(response) {
            console.log(response);
            if (response && response.type === "confirmFingerprint") {
                var fingerprint = response.fingerprint;
                var serverName = document.querySelector("#serverName").value;
                var serverPort = document.querySelector("#serverPort").value;
                getFingerprint(serverName, serverPort, function(prevFingerprint) {
                    document.querySelector("#algorithm").textContent = response.algorithm;
                    document.querySelector("#fingerprint").textContent = response.fingerprint;
                    document.querySelector("#requestId").value = response.requestId;
                    document.querySelector("#fileSystemId").value = response.fileSystemId;
                    var prev = document.querySelector("#prev");
                    if (prevFingerprint) {
                        if (fingerprint === prevFingerprint.value) {
                            accept(response.requestId, response.fileSystemId);
                            return;
                        } else {
                            prev.style.display = "block";
                            document.querySelector("#prevAlgorithm").textContent = prevFingerprint.algorithm;
                            document.querySelector("#prevFingerprint").textContent = prevFingerprint.value;
                        }
                    } else {
                        prev.style.display = "none";
                    }
                    $("#confirmFingerprintDialog").modal("show");
                });
            } else {
                var msg = {
                  title: chrome.i18n.getMessage("mountFail"),
                  priority: "danger",
                  message: "Something wrong"
                };
                if (response && response.error) {
                  msg.message = response.error;
                }
                $.toaster(msg);
                btnMount.removeAttribute("disabled");
            }
        });
    };

    var accept = function(requestId, fileSystemId) {
        var request = {
            type: "accept",
            requestId: requestId,
            fileSystemId: fileSystemId
        };
        chrome.runtime.sendMessage(request, function(response) {
            if (response && response.success) {
                storeFingerprint(
                    document.querySelector("#serverName").value,
                    document.querySelector("#serverPort").value,
                    document.querySelector("#algorithm").textContent,
                    document.querySelector("#fingerprint").textContent,
                    function() {
                        $.toaster({message: chrome.i18n.getMessage("mountSuccess")});
                        window.setTimeout(function() {
                            window.close();
                        }, 2000);
                    });
            } else {
                var msg = {
                  title: chrome.i18n.getMessage("mountFail"),
                  priority: "danger",
                  message: "Something wrong"
                };
                if (response && response.error) {
                  msg.message = response.error;
                }
                $.toaster(msg);
                var btnMount = document.querySelector("#btnMount");
                btnMount.removeAttribute("disabled");
            }
        });
    };

    var onClickedBtnAccept = function(evt) {
        console.log("onClickedBtnAccept");
        var requestId = document.querySelector("#requestId").value;
        var fileSystemId = document.querySelector("#fileSystemId").value;
        accept(requestId, fileSystemId);
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
            case "button":
                textNode = document.createTextNode(messageText);
                element.appendChild(textNode);
                break;
            case "input":
            case "textarea":
                element.setAttribute("placeholder", messageText);
                break;
            case "h2":
            case "title":
            case "label":
                textNode = document.createTextNode(messageText);
                element.appendChild(textNode);
                break;
            }
        }
    };

    var onClickedBtnKeep = function(evt) {
        console.log("onClickedBtnKeep");
        evt.preventDefault();
        chrome.storage.local.get("settings", function(items) {
            var settings = items.settings || {};
            var keepPassword = settings.keepPassword || "keepPasswordNo";
            keepPassword = (keepPassword === "keepPasswordYes");
            var authType = document.forms.mainForm.authType.value;
            var serverName = document.querySelector("#serverName").value;
            var serverPort = document.querySelector("#serverPort").value;
            var username = document.querySelector("#username").value;
            var privateKey = document.querySelector("#privatekey").value;
            var mountPath = document.querySelector("#mountPath").value;
            var password = document.querySelector("#password").value;
            if (serverName && serverPort && username) {
                chrome.storage.local.get("keptCredentials", function(items) {
                    var credentials = items.keptCredentials || {};
                    var key = createKey(serverName, serverPort, username);
                    var credential = {
                        serverName: serverName,
                        serverPort: serverPort,
                        authType: authType,
                        username: username,
                        privateKey: privateKey,
                        mountPath: mountPath
                    };
                    if (keepPassword) {
                        credential.password = password;
                    }
                    credentials[key] = credential;
                    chrome.storage.local.set({
                        keptCredentials: credentials
                    }, function() {
                        loadKeptCredentials();
                    });
                });
            }
        });
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
        div.setAttribute("class", "credential");
        var credentialInfo = document.createElement("div");
        credentialInfo.setAttribute("class", "pull-left credential-info");
        credentialInfo.textContent = createKey(credential.serverName, credential.serverPort, credential.username);
        credentialInfo.addEventListener("click", (function(credential) {
          return function(evt) {
            setCredentialToForm(credential);
          };
        })(credential));
        div.appendChild(credentialInfo);
        var divBtn = document.createElement("div");
        divBtn.setAttribute("class", "pull-right");
        var btnClose = document.createElement("div");
        btnClose.setAttribute("class", "glyphicon glyphicon-remove btn-credential-remove");
        btnClose.setAttribute("aria-hidden", "true");
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
        divBtn.appendChild(btnClose);
        div.appendChild(divBtn);
        credentials.appendChild(div);
    };

    var setCredentialToForm = function(credential) {
        document.querySelector("#serverName").value = credential.serverName;
        document.querySelector("#serverPort").value = credential.serverPort;
        document.forms.mainForm.authType.value = credential.authType;
        document.querySelector("#username").value = credential.username;
        document.querySelector("#privatekey").value = credential.privateKey;
        document.querySelector("#mountPath").value = credential.mountPath;
        var password = credential.password;
        if (password) {
            document.querySelector("#password").value = password;
        } else {
            document.querySelector("#password").value = "";
        }
        onChangeAuthType();
        document.querySelector("#password").focus();
    };

    var createKey = function(serverName, serverPort, username) {
        return serverName + ":" + serverPort + " (" + username + ")";
    };

    var onClickedBtnSettings = function(evt) {
        chrome.storage.local.get("settings", function(items) {
            var settings = items.settings || {};
            var keepPassword = settings.keepPassword || "keepPasswordNo";
            if (keepPassword === "keepPasswordYes") {
              document.querySelector("#keepPasswordYes").checked = true;
            } else {
              document.querySelector("#keepPasswordNo").checked = true;
            }
            $("#settingsDialog").modal("show");
        });
    };

    var onChangeKeepPassword = function(evt) {
        chrome.storage.local.get("settings", function(items) {
            var settings = items.settings || {};
            if (document.querySelector("#keepPasswordYes").checked) {
              settings.keepPassword = "keepPasswordYes";
            } else {
              settings.keepPassword = "keepPasswordNo";
            }
            chrome.storage.local.set({settings: settings}, function() {
                console.log("Saving settings done.");
            });
        });
    };

    var loadFingerprints = function(callback) {
        chrome.storage.local.get("fingerprints", function(items) {
            var fingerprints = items.fingerprints || {};
            callback(fingerprints);
        });
    };

    var getFingerprint = function(serverName, serverPort, callback) {
        loadFingerprints(function(fingerprints) {
            var fingerprint = fingerprints[serverName + ":" + serverPort];
            callback(fingerprint);
        });
    };

    var storeFingerprint = function(serverName, serverPort, algorithm, fingerprint, callback) {
        loadFingerprints(function(fingerprints) {
            fingerprints[serverName + ":" + serverPort] = {
                value: fingerprint,
                algorithm: algorithm
            };
            chrome.storage.local.set({fingerprints: fingerprints}, function() {
                callback();
            });
        });
    };

    window.addEventListener("load", function(e) {
        onLoad();
    });

    setMessageResources();

})();
