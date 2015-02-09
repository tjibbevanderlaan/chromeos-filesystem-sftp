(function() {

  var onLoad = function() {
    assignEventHandlers();
  };

  var assignEventHandlers = function() {
    var btnMount = document.querySelector("#btnMount");
    btnMount.addEventListener("click", function(e) {
      onClickedBtnMount(e);
    });
    var btnDecline = document.querySelector("#btnDecline");
    btnDecline.addEventListener("click", function(e) {
      onClickedBtnDecline(e);
    });
    var btnAccept = document.querySelector("#btnAccept");
    btnAccept.addEventListener("click", function(e) {
      onClickedBtnAccept(e);
    });
    var password = document.querySelector("#authTypePassword");
    password.addEventListener("core-change", onChangeAuthType);
    var keyboardInteractive = document.querySelector("#authTypeKeyboardInteractive");
    keyboardInteractive.addEventListener("core-change", onChangeAuthType);
    var publickey = document.querySelector("#authTypePublickey");
    publickey.addEventListener("core-change", onChangeAuthType);
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
  }

  var onClickedBtnDecline = function(evt) {
    console.log("onClickedBtnDecline");
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
  }

  var setMessageResources = function() {
    var selector = "data-message";
    var elements = document.querySelectorAll("[" + selector + "]");

    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];

      var messageID = element.getAttribute(selector);
      var messageText = chrome.i18n.getMessage(messageID);

      switch(element.tagName.toLowerCase()) {
        case "paper-button":
          var textNode = document.createTextNode(messageText);
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
          var textNode = document.createTextNode(messageText);
          element.appendChild(textNode);
          break;
      }
    }
  };

  window.addEventListener("load", function(e) {
    onLoad();
  });

  setMessageResources();

})();