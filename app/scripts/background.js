(function() {

  var sftp_fs_ = new SftpFS();

  chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create("index.html", {
      outerBounds: {
        minWidth: 800,
        minHeight: 700
      }
    });
  });

  window.addEventListener("load", function() {
    sftp_fs_.resume(function() {
      console.log("Resumed");
    }, function(reason) {
      console.log(reason);
    });
  });

  var mount = function(options) {
    var options = {
      serverName: serverName,
      serverPort: serverPort,
      authType: authType,
      username: username,
      password: password,
      privateKey: privateKey,
      onHandshake: function(algorithm, fingerprint, successCallback, errorCallback) {

      },
      onSuccess: function() {

      },
      onError: function(reason) {

      }
    };
    sftp_fs_.mount(options);
  };

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch(request.type) {
      case "mount":
        var options = {
          serverName: request.serverName,
          serverPort: request.serverPort,
          authType: request.authType,
          username: request.username,
          password: request.password,
          privateKey: request.privateKey,
          onHandshake: function(algorithm, fingerprint, successCallback, errorCallback) {

          },
          onSuccess: function() {

          },
          onError: function(reason) {

          }
        };
        mount(function() {
          sendResponse({
            type: "mount",
            success: true
          });
        }, function(reason) {
          sendResponse({
            type: "mount",
            success: false,
            error: reason
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
