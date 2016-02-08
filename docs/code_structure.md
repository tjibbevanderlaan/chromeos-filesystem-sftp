# Code Structure

This document describes you code structure of this software. Mainly, I write down about the directory structure and the purpose of each file.

# Directories

* [/](https://github.com/yoichiro/chromeos-filesystem-sftp) - Build files, Configuration files, and etc.
* [/app](https://github.com/yoichiro/chromeos-filesystem-sftp/tree/master/app) - This directory has one HTML file and the manifest.json file.
* [/app/_locales/en](https://github.com/yoichiro/chromeos-filesystem-sftp/tree/master/app/_locales/en) - There is one message resource file for English.
* [/app/images](https://github.com/yoichiro/chromeos-filesystem-sftp/tree/master/app/images) - This directory has some image files.
* [/app/scripts](https://github.com/yoichiro/chromeos-filesystem-sftp/tree/master/app/scripts) - There are some JavaScript files.
* [/app/styles](https://github.com/yoichiro/chromeos-filesystem-sftp/tree/master/app/styles) - There is one css style sheet definition file.
* [/app/nacl_src](https://github.com/yoichiro/chromeos-filesystem-sftp/tree/master/app/nacl_src) - This directory has some C++ code of NaCl module which is using libssh2 C library to communcate SSH2 Server with SFTP protocol.
* [/test](https://github.com/yoichiro/chromeos-filesystem-sftp/tree/master/test) - Currently, all files are garbage...
* [/docs](https://github.com/yoichiro/chromeos-filesystem-sftp/tree/master/docs) - Currently, there is one image file which is referenced by the README.md file.
* [/psd](https://github.com/yoichiro/chromeos-filesystem-sftp/tree/master/psd) - There are some image files.

At least, if you are a programmer, first you should enter the /app/scripts directory and see each JavaScript files to understand this app's behaviors.

# Files

## For Building

### [/Gruntfile.js](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/Gruntfile.js)

This file defines all procedures to build this software with [grunt](http://gruntjs.com/).

### [/package.json](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/package.json)

The building procedures are using many sub tasks for the grunt. This file defines the used sub tasks.

### [/bower.js](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/bower.js)

This software is using [bower](http://bower.io/) to manage packages. This software is using [Polymer 0.5](https://www.polymer-project.org/0.5/), and this file defines each polymer components as depended packages.

### [/.jshintrc](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/.jshintrc)

[JSHint](http://jshint.com/) is a software to check the JavaScript Code as a static code analyzing. This file defines each check rule. That is, this file has many flags to turn on/off each checking process. JSHint is executed by the grunt tool automatically, because the Gruntfile.js has the task to execute the JSHint.

## HTML

### [/app/window.html](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/window.html)

This HTML file provides a screen to fill in a connection information. The connection information form consists of server hostname, the port number, user name, authentication type, user password and etc. When users pushes the "KEEP" button, the connection information the user filled in is stored the shared storage with chrome.storage.sync API. All stored information are dislayed on the left pane.

This window.html file has two dialogs. One is to dislay and confirm fingerprints. This software has an ability to keep each fingerprints which a connected server was returned. Users always can know all fingerprints on this dialog. Another one is to configure a setting. If the user wants to store the entered password, the user can turn on the setting on this dialog.

This HTML elements consists of Polymer components. Each click event is handled by the function defined by /app/scripts/window.js file.

## JavaScript

This software consists of some JavaScript files. The abstract structure is the following:

![code_structure_1.png](https://raw.githubusercontent.com/yoichiro/chromeos-filesystem-sftp/master/docs/code_structure_1.png)

### [/app/scripts/window.js](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/scripts/window.js)

This window.js file is in charge of handling each click event fired on the window.html. For instance, there are the events below:

* Mount button click event
* Keep button click event
* Setting button click event

Each event handler is assigned by the assignEventHandlers() function.

#### Mount button click event

When this event fired, the onClickedBtnMount() function is called. The window.js file doesn't have any process to mount the SFTP server. Instead, this event handler delegates the actual process to the background page represented by the background.js file. For instance, the onClickedBtnMount() function sends a message to the background page. The message has key/value pairs: type:"mount" and other information to login which was filled in each field by the user.

Actually, the following interactions occurs:

1. The window.js sends the message which has type:"mount" and other information needed to login to the background.js.
1. If this is the first time to connect to the server, or if the previous fingerprint is not same as the new fingerprint, the background.js returns type:"confirmFingerprint" message.
1. The window.js shows the dialog to display the new fingerprint to the user. The user has two options: "Accept" and "Decline". To continue to do the login process, the user needs to choose the "Accept".
1. The window.js sends the message which has type:"accept".
1. The background.js do login process. If it succeeded, the background.js returns the message which has "success".
1. If the user chooses the "Decline", the window.js sends the message which has type:"decline". The background.js does the post-cleaning.

The reason why the window.js shows the fingerprint to the user is a concern of security issues. That is, the user must confirm whether the server which the user is trying to connect is correct server or not by the fingerprint.

#### Keep button click event

When this event fired, the onClickedBtnKeep() function is called. This function has an ability to store the entered information to login to the server to local storage with [chrome.storage.local](https://developer.chrome.com/apps/storage#property-local) API. If the same server name, port number and user name entry exists, it will be overwritten.

#### Setting button click event

When this event fired, the onClickedBtnSettings() function is called. The function opens the dialog to configure some settings. Currently, there is one setting item whether the password is stored or not.

### [/app/scripts/background.js](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/scripts/background.js)

This is a background page script. Mainly, this script has a responsibility of launching the window when users want to mount the SFTP server. Also, this script has an ability to receive the message from the window.js script. When the message received, this script delegates the request of mounting the SFTP server to the [/app/scripts/sftp_fs.js](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/scripts/sftp_fs.js) script. Especially, this script has one SftpFS instance.

This script can know what users want to mount the SFTP server by handling [chrome.fileSystemProvider.onMountRequested](https://developer.chrome.com/extensions/fileSystemProvider#event-onMountRequested) event. When this event fired, this script opens the window.html.

### [/app/scripts/sftp_fs.js](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/scripts/sftp_fs.js)

This script file is an implementation for [chrome.fileSystemProvider](https://developer.chrome.com/apps/fileSystemProvider) API. That is, this script has a responsibility of the following:

* When this script receives the request of mounting/unmounting, do mounting/unmounting with the chrome.fileSystemProvider.mount()/unmount() API.
* Handling all events of the chrome.fileSystemProvider API. Each event has a name "on***Requested", and this script has functions which has the same name of each event.
* Caching fetched meta data. For instance, Each meta data fetched is stored into [/app/scripts/metadata_cache.js](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/scripts/metadata_cache.js). This script improves a performance using the cache mechanism.
* This software has an ability to mount multiple accounts of SFTP server at the same time. Each connection is represented by SftpClient class defined in [/app/scripts/sftp_client.js](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/scripts/sftp_client.js). This script manages multiple SftpClient instances in the sftpClientMap_ instance value. Each SftpClient instance has a file system ID, and is stored into the map object. The file system ID is generated by the createFIleSystemID() function.

This script defines a SftpFS class. The SftpFS instance is created by the background.js. This script never communicate to SFTP server. Instead, this script delegates them to the sftp_client.js script. That is, this script has a responsibility of handling FSP events and proxying them to the sftp_client.js script.

| SftpFS Function              | SftpClient Function                     |
| ---------------------------- | --------------------------------------- |
| mount()                      | setup(), connect()                      |
| allowToConnect()             | authenticate()                          |
| denyToConnect()              | destroy()                               |
| onUnmountRequested()         | destroy()                               |
| onNaClModuleCrashed()        | destroy()                               |
| onReadDirectoryRequested()   | readDirectory()                         |
| onGetMetadataRequested()     | getMetadata()                           |
| onOpenFileRequested()        | SftpClient not called.                  |
| onReadFileRequested()        | readFile()                              |
| onCloseFileRequested()       | SftpClient not called.                  |
| onCreateDirectoryRequested() | createDirectory()                       |
| onDeleteEntryRequested()     | deleteEntry()                           |
| onMoveEntryRequested()       | moveEntry()                             |
| onCopyEntryRequested()       | Currently, this event is not supported. |
| onWriteFileRequested()       | writeFile()                             |
| onTruncateRequested()        | truncate()                              |
| onCreateFileRequested()      | createFile()                            |

If users reboot ChromeOS and do such operations, the connection to the SFTP server will be disconnected. That is, after that, if the user starts the ChromeOS again, this software must reconnect to the SFTP server. First, the SftpClient instance is created after the connection is established. That is, if the SftpClient instance which has the information the user wants to connect to not exists in the sftpClientMap_, this software should connect to the SFTP server and should complete to do the mounting process. Each event handler checks this at first (See: createEventHandler() function). If sftpClient not found, the resume() function is called. The resume() function retrieve the client credential which was stored at the previous connecting, and reconnect to the SFTP server with the credential.

You may understand this behavior by the code like below:

```js
chrome.fileSystemProvider.on***Requested.addListener(function(options, successCallback, errorCallback) {
  var sftpClient = this.sftpClientMap_[options.fileSystemId];
  if (!sftpClient) {
    this.resume(options.fileSystemId, function(...) {
      // Do something...
    });
  } else {
    // Do something...
  }
});
```

### [/app/scripts/sftp_client.js](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/scripts/sftp_client.js)

This script provides an ability to communicate with NaCl module. That is, this script cannot communicate with SFTP server directly. Instead, this script delegates each request to the NaCl module via [Messaging System](https://developer.chrome.com/native-client/devguide/coding/message-system).

#### Creating NaCl module instance

When users request mounting, the SftpFS instance creates a new SftpClient instance and calls SftpClient#setup() function. Actually, the setup() function creates the element like the following:

```html
<div>
  <embed
      width="0"
      height="0"
      src="clang-newlib/Release/sftp.nmf"
      type="application/x-nacl">
  </embed>
</div>
```

When NaCl module returns some result, "message" event is fired from the embed element. In the setup() function, the "message" event handler is registered to the div element. Also, the "crash" event handler is registered to the embed element to handle if the NaCl module is crashed.

#### Sending request to the NaCl module and receiving the result

When some File System Provider event occurs, the SftpFS instance handles it and calls the related function of the SftpClient instance. Then, the SftpClient sends the request to the NaCl module. Especially, the function does the following process:

1. Add an event listener to handle the result from the NaCl module.
1. Send a request to the NaCl module.
1. The event listener called at receiving the result from the NaCl module.
1. Check whether the result has the expected contents or not.

The abstract code will be like the following:

```js
SftpClient.prototype.doSomething = function(options) {
  addNaClEventListener.call(this, options.requestId, function(event) {
    if (checkEventMessage.call(this, event, "valid_result_name", options.onError)) {
      var results = event.values;
      // Do something...
      options.onSuccess({...});
    }
  });
  postMessageToNaClmodule.call(this, "command_name", options.requestId, [args1, ...]);
};
```

The request parameter at senging a message to the NaCl module is JSON object like the following format:

```json
{
  "command": "command_name",
  "request": "request_id",
  "args: [
    args1, ...
  ]
}
```

Currently, the request_id value is always zero.

#### Function and Message mapping

Each function of the SftpClient and each command name sent to the NaCl module are mapped as like the following:

| Function          | Command Name   | Expected Result Name |
| ----------------- | -------------- | -------------------- |
| connect()         | "connect"      | "fingerprint"        |
| authenticate()    | "authenticate" | "authenticated"      |
| close()           | "close"        | "shutdown"           |
| getMetadata()     | "file"         | "metadataList"       |
| readDirectory()   | "dir"          | "metadataList"       |
| readFile()        | "read"         | "readFile"           |
| createDirectory() | "mkdir"        | "mkdirSuccessful"    |
| deleteFile()      | "delete"       | "deleteSuccessful"   |
| moveEntry()       | "rename"       | "renameSuccessful"   |
| createFile()      | "create"       | "createSuccessful"   |
| truncate()        | "truncate"     | "truncateSuccessful" |
| writeFile()       | "write"        | "writeSuccessful"    |
| destroy()         | "destroy"      | None.                |

### [/app/scripts/metadata_cache.js](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/scripts/metadata_cache.js)

This script provides an ability to keep metadata objects. As the result, whole performance is increased because of reducing a network communication. Each metadata object is stored per each directory. That is, the cache key is a directory path.

* put() - Store metadata object array to the cache storage mapped by the specified directory path.
* get() - Retrieve metadata object/array specified by the directory path/file path.
* remove() - Delete the metadata object/array specified by the directory path/file path.

### [/app/scripts/task_queue.js](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/scripts/task_queue.js)

This Class provides you an ability of a Queue Mechanism. You can register a new task, and the registered tasks will be executed sequentially.

Actually, this is not a completed queue. Because, you must call shiftAndConsumeTask() function to execute a next task like "non-preemptive multitasking".

* addTask() - Register a new task. If the queue size was empty at registering above, the registered task will be called after 10ms.
* shiftAndConsumeTask() - You must call shiftAndConsumeTask() function to shift the executed task and to execute the next task.

The standard usage is like the following:

```js
let taskQueue = new TaskQueue();
...
chrome.fileSystemProvider.on***Requested.addListener(
  (options, successCallback, errorCallback) => { <- createEventHandler()
    taskQueue.addTask(() => { <- prepare()
      ...
      taskQueue.shiftAndConsumeTask();
    });
  }
);
```

## Native Client Library Module

JavaScript files described above don't have an ability to communicate to the SFTP server. Instead, the NaCl module has the ability. Especially, the NaCl module uses libssh2 C library to communicate to the SFTP server via SFTP protocol.

![code_structure_2.png](https://raw.githubusercontent.com/yoichiro/chromeos-filesystem-sftp/master/docs/code_structure_2.png)

### [/app/nacl_src/Makefile](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/Makefile)

This Makefile file is the extended file from common.mk file included in the NaCl SDK.

### [/app/nacl_src/sftp.h](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/sftp.h),[sftp.cc](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/sftp.cc)

TBD

### [/app/nacl_src/sftp_thread.h](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/sftp_thread.h),[sftp_thread.cc](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/sftp_thread.cc)

TBD

### [/app/nacl_src/sftp_event_listener.h](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/sftp_event_listener.h)

TBD

### [/app/nacl_src/communication_exception.h](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/communication_exception.h),[communication_exception.cc](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/communication_exception.cc)

TBD

### [/app/nacl_src/abstract_command.h](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/abstract_command.h),[abstract_command.cc](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/abstract_command.cc)

TBD

### Command classes

TBD

## Other

### [/app/manifest.json](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/manifest.json)

This is a manifest file which is needed for Chrome Apps.
