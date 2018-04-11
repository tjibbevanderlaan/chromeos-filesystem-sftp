# Documentation

This document is originally written by Yoichiro Tanaka and adapted to the modifications of the fork. 

## Content

* [Directories overview](#directories-overview)
* [Building system files](#building-system-files)
* [Basic app files](#basic-app-files)
* [App logic files](#app-logic-files)
  * [Model](#model)
  * [Controller](#controller)
  * [View](#view)

## Directories overview

* [/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp) - Build files, Configuration files, and etc.
* [/src](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/tree/react/src) - The source directory of the app. The directory contains the HTML-page of the Chrome App window (`window.html`) and the `manifest.json` required for Chrome apps and extensions.
* [/src/_locales/en](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/tree/react/src/_locales/en) - A message resource file for English.
* [/src/_locales/nl](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/tree/react/src/_locales/nl) - A message resource file for Dutch.
* [/src/icons](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/tree/react/src/images) - This directory contains app icons.
* [/src/js/controller](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/tree/react/src/js/controller) - Two JavaScript files which controls the user-interface -[window.js](#windowjs)- and which controls the filesystem - [background.js](#backgroundjs). The two controllers communicate with each other by [Message Passing](https://developer.chrome.com/apps/messaging) (part of the Chrome App environment). 
* [/src/js/model](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/tree/react/src/js/model) - Multiple JavaScript files which facilitate all filesystem handlings between the Chrome Filesystem API and the Native Client libssh2 sandbox.
* [/src/js/view](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/tree/react/src/js/view) - Multiple ES6-JavaScript files which describe React Components. These React Componentes are building blocks of the user-interface. The file [AppContent.js](#appcontentjs) combines all components.
* [/src/js/utils](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/tree/react/src/js/utils) - JavaScript files, used in the original source code, but no longer used in this fork.
* [/src/nacl_src](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/tree/react/src/nacl_src) - This directory has some C++ code of NaCl module which is using libssh2 C library to communicator SSH2 Server with SFTP protocol.
* [/test](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/tree/react/test) - Currently, all files are garbage...
* [/docs](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/tree/react/docs) - Currently, there is one image file which is referenced by the README.md file.
* [/svg](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/tree/react/svg) - The original vector icons.

At least, if you are a programmer, first you should enter the /src/js directory and see each JavaScript files to understand this app's behaviors.

## Building system files

#### [/package.json](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/package.json)

The package.json gives a description of the project. The description complies to the node package manager (NPM) definition. The description lists also all building and app dependencies.

#### [/webpack.config.js](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/webpack.config.js)

Webpack is a building system which bundles all dependencies. The configuration file determines all building instructions. 

Find more information on <https://webpack.js.org/>.


#### [/.eslintrc](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/.eslintrc)

The configuration file `.eslintrc` configurates the [ESLint](https://eslint.org/) JavaScript linter, which analyses the code for potential errors. This linter can handle both JavaScript and JSX and is therefore suitable to check React Components. ESLint is a building dependency of the project, and will be installed locally when you run `npm install`. 

Get more information on <https://eslint.org/>.

#### [/.babelrc](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/.babelrc)

While all `model`-JavaScript files (see `/src/js/model/`) are written in browser-JavaScript, the `view`-JavaScript files are written in JSX (the ES6-based language, customized for React). To translate JSX to plain browser-JavaScript, the babel-loader is used. Babel is a JavaScript compiler; it translates modern JavaScript-styles to good-old browser-JavaScript. The `.babelrc`-file configurates how Babel should do this.

Get more information on <https://babeljs.io/>.


### Basic app files

#### [/src/window.html](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/window.html)

The HTML-file provides the user-interface window of the application. The window provides an interface to fill in connection information. The connection information form consists of server host-name, the port number, user name, authentication type, user password and etc. For more information on authentication types, you can visit the libssh2 documentation.

When users pushes the 'Mark as favorite' button, the connection information the user filled in is stored the shared storage with chrome.storage.sync API. All stored information are displayed on the Drawer pane. Furthermore, the Drawer pane list the setting to store entered passwords. The Drawer pane can be opened by clicking on the three vertical dots, in the top right corner of the window.

Additionally, to verify or confirm the fingerprint of the to-be-connected server, `window.html` displays a dialog.

The React JavaScript library provides the UI-component in `window.html` and are based on the several JSX-files listed in `src/js/view/`. The [AppContent.js](#AppContentjs) file integrates all components and creates event handlers between components. Furthermore, [AppContent.js](#appcontentjs) (part of [window.js](#windowjs)) communicates with [background.js](#backgroundjs) and the local `chrome.storage` to retrieve settings and favorites.

#### [/src/manifest.json](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/manifest.json)

This is a manifest file which is needed for Chrome Apps. More details can be found on the [Manifest File Format](https://developer.chrome.com/apps/manifest) page on the Chrome App developer site.

## App logic files
The app logic is split into a [model](#Model), [view](#View), and [controller](#Controller) group, to improve code readability. In this section, the purpose of each file for each group is highlighted. In the table below, the structure of the section is given. Click on the name of an item, to get a description of the file. 

|  **Name** | **Category name** | **Group** | **Type** | **Source location** | **Bundle location** |
|  ------ | ------ | ------ | ------ | ------ | ------ |
|  [sftp_fs.js](#sftp_fsjs) | SftpFS | Model | Browser JavaScript | [/src/js/model/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/model/) | /dist/background.js |
|  [sftp_client.js](#sftp_clientjs) | SftpClient | Model | Browser JavaScript | [/src/js/model/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/model/) | /dist/background.js |
|  [metadata_cache.js](#metadata_cachejs) | MetadataCache | Model | Browser JavaScript | [/src/js/model/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/model/) | /dist/background.js |
|  [task_queue.js](#task_queuejs) | TaskQueue | Model | Browser JavaScript | [/src/js/model/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/model/) | /dist/background.js |
|  [Makefile](#makefile) | NaCl module | Model | Bash | [/src/nacl_src/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/) | - |
|  [sftp.h, sftp.cc](#sftph-sftpcc) | NaCl module | Model | C++11 | [/src/nacl_src/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/) | /dist/clang-newlib/Release/sftp.nmf |
|  [sftp_thread.h, sftp_thread.cc](#sftp_threadh-sftp_threadcc) | NaCl module | Model | C++11 | [/src/nacl_src/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/) | /dist/clang-newlib/Release/sftp.nmf |
|  [sftp_event_listener.h](#sftp_event_listenerh) | NaCl module | Model | C++11 | [/src/nacl_src/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/) | /dist/clang-newlib/Release/sftp.nmf |
|  [communication_exception.h, communication_exception.cc](#communication_exceptionh-communication_exceptioncc) | NaCl module | Model | C++11 | [/src/nacl_src/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/) | /dist/clang-newlib/Release/sftp.nmf |
|  [abstract_command.h, abstract_command.cc](#abstract_commandh-abstract_commandcc) | NaCl module | Model | C++11 | [/src/nacl_src/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/) | /dist/clang-newlib/Release/sftp.nmf |
|  [create_file_command.h, create_file_command.cc](#create_file_commandh-create_file_commandcc) | NaCl module | Model | C++11 | [/src/nacl_src/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/) | /dist/clang-newlib/Release/sftp.nmf |
|  [delete_entry_command.h, delete_entry_command.cc](#delete_entry_commandh-delete_entry_commandcc) | NaCl module | Model | C++11 | [/src/nacl_src/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/) | /dist/clang-newlib/Release/sftp.nmf |
|  [get_metadata_command.h, get_metadata_command.cc](#get_metadata_commandh-get_metadata_commandcc) | NaCl module | Model | C++11 | [/src/nacl_src/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/) | /dist/clang-newlib/Release/sftp.nmf |
|  [make_directory_command.h, make_directory_command.cc](#make_directory_commandh-make_directory_commandcc) | NaCl module | Model | C++11 | [/src/nacl_src/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/) | /dist/clang-newlib/Release/sftp.nmf |
|  [read_directory_command.h, read_directory_command.cc](#read_directory_commandh-read_directory_commandcc) | NaCl module | Model | C++11 | [/src/nacl_src/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/) | /dist/clang-newlib/Release/sftp.nmf |
|  [read_file_command.h, read_file_command.cc](#read_file_commandh-read_file_commandcc) | NaCl module | Model | C++11 | [/src/nacl_src/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/) | /dist/clang-newlib/Release/sftp.nmf |
|  [rename_entry_command.h, rename_entry_command.cc](#rename_entry_commandh-rename_entry_commandcc) | NaCl module | Model | C++11 | [/src/nacl_src/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/) | /dist/clang-newlib/Release/sftp.nmf |
|  [truncate_file_command.h, truncate_file_command.cc](#truncate_file_commandh-truncate_file_commandcc) | NaCl module | Model | C++11 | [/src/nacl_src/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/) | /dist/clang-newlib/Release/sftp.nmf |
|  [write_file_command.h, write_file_command.cc](#write_file_commandh-write_file_commandcc) | NaCl module | Model | C++11 | [/src/nacl_src/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/) | /dist/clang-newlib/Release/sftp.nmf |
|  [background.js](#backgroundjs) | Background | Controller | Browser JavaScript | [/src/js/controller/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/controller/) | /dist/background.js |
|  [window.js](#windowjs) | Window | Controller | React JavaScript (JSX) | [/src/js/controller/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/controller/) | /dist/window.js |
|  [AppContent.js](#appcontentjs) | AppContent | View | React JavaScript (JSX) | [/src/js/view/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/view/) | /dist/window.js |
|  [AppIcon.js](#appiconjs) | AppIcon | View | React JavaScript (JSX) | [/src/js/view/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/view/) | /dist/window.js |
|  [AuthForm.js](#authformjs) | AuthForm | View | React JavaScript (JSX) | [/src/js/view/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/view/) | /dist/window.js |
|  [ConfirmDialog.js](#confirmdialogjs) | ConfirmDialog | View | React JavaScript (JSX) | [/src/js/view/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/view/) | /dist/window.js |
|  [ConfirmForm.js](#confirmformjs) | ConfirmForm | View | React JavaScript (JSX) | [/src/js/view/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/view/) | /dist/window.js |
|  [DrawerLists.js](#drawerlistsjs) | DrawerLists | View | React JavaScript (JSX) | [/src/js/view/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/view/) | /dist/window.js |
|  [FavoritesItem.js](#favoritesitemjs) | FavoritesItem | View | React JavaScript (JSX) | [/src/js/view/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/view/) | /dist/window.js |
|  [ServerForm.js](#serverformjs) | ServerForm | View | React JavaScript (JSX) | [/src/js/view/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/view/) | /dist/window.js |
|  [SnackbarInformer.js](#snackbarinformerjs) | SnackbarInformer | View | React JavaScript (JSX) | [/src/js/view/](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/view/) | /dist/window.js |



### Model

The model is responsible for the server connection and integrates the connection with the `chrome.fileSystemProvider` API. The abstract relations between these scripts are visualized below. The SftpFS class communicates with the controller [background.js](#backgroundjs).

![code_structure_1.pngCreating NaCl module instance
](https://raw.githubusercontent.com/tjibbevanderlaan/chromeos-filesystem-sftp/react/docs/code_structure_1.png)

#### [sftp_fs.js](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/model/sftp_fs.js)

This script file is an implementation for [chrome.fileSystemProvider](https://developer.chrome.com/srcs/fileSystemProvider) API. That is, this script has a responsibility of the following:

* When this script receives the request of mounting/unmounting, do mounting/unmounting with the chrome.fileSystemProvider.mount()/unmount() API.
* Handling all events of the chrome.fileSystemProvider API. Each event has a name "on***Requested", and this script has functions which has the same name of each event.
* Caching fetched meta data. For instance, Each meta data fetched is stored into [/src/js/model/metadata_cache.js](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/model/metadata_cache.js). This script improves a performance using the cache mechanism.
* This software has an ability to mount multiple accounts of SFTP server at the same time. Each connection is represented by SftpClient class defined in [/src/js/model/sftp_client.js](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/model/sftp_client.js). This script manages multiple SftpClient instances in the sftpClientMap_ instance value. Each SftpClient instance has a file system ID, and is stored into the map object. The file system ID is generated by the createFIleSystemID() function.

This script defines a SftpFS class. The SftpFS instance is created by the [background.js](#backgroundjs). This script never communicate to SFTP server. Instead, this script delegates them to the sftp_client.js script. That is, this script has a responsibility of handling FSP events and proxying them to the sftp_client.js script.

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

#### [sftp_client.js](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/model/sftp_client.js)

This script provides an ability to communicate with NaCl module. That is, this script cannot communicate with SFTP server directly. Instead, this script delegates each request to the NaCl module via [Messaging System](https://developer.chrome.com/native-client/devguide/coding/message-system).

##### Creating NaCl module instance

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

##### Sending request to the NaCl module and receiving the result

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

The request parameter at sending a message to the NaCl module is JSON object like the following format:

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

##### Function and Message mapping

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

#### [metadata_cache.js](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/model/metadata_cache.js)

This script provides an ability to keep metadata objects. As the result, whole performance is increased because of reducing a network communication. Each metadata object is stored per each directory. That is, the cache key is a directory path.

* put() - Store metadata object array to the cache storage mapped by the specified directory path.
* get() - Retrieve metadata object/array specified by the directory path/file path.
* remove() - Delete the metadata object/array specified by the directory path/file path.

#### [task_queue.js](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/model/task_queue.js)

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

### Native Client Library Module

JavaScript files described above don't have an ability to communicate to the SFTP server. Instead, the NaCl module has the ability. Especially, the NaCl module uses libssh2 C library to communicate to the SFTP server via SFTP protocol.

![code_structure_2.png](https://raw.githubusercontent.com/tjibbevanderlaan/chromeos-filesystem-sftp/react/docs/code_structure_2.png)

#### [Makefile](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/Makefile)

This Makefile file is the extended file from common.mk file included in the NaCl SDK. Currently, this NaCl module is built with clang-newlib only. Therefore, this Makefile defines the VALID_TOOLCHAINS variable as like the following:

```Makefile
VALID_TOOLCHAINS := clang-newlib
```

This NaCl module was written by C++. Especially, C++11 was applied. That is, CFLAGS variable is:

```Makefile
CFLAGS = -Wall -std=gnu++11
```

Also, this software is using "libssh2", "NaCl IO", "Pepper API" and "Pthread". Therefore, This Makefile defines the LIBS variable as the following:

```Makefile
LIBS = ssh2 crypto nacl_io ppapi_cpp ppapi pthread
```

When compiling for x86_32 binary, the NaCl SDK previous version had a bug. Thus, this Makefile specifies the LDFLAGS variable at the x86_32.

#### [sftp.h](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/sftp.h), [sftp.cc](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/sftp.cc)

The sftp.h and sftp.cc files have a responsibility to handle messages from JavaScript layer and to send the result to the JavaScript layer.

##### Handling messages from JavaScript layer

The sftp.h and sftp.cc files define two classes: "SftpModule" and "SftpInstance" required by the NaCl class library. The SftpModule class inherits [pp::Module](https://developer.chrome.com/native-client/pepper_stable/cpp/classpp_1_1_module) class. This class have an ability to create SftpInstance instance. This is simple.

The SftpInstance class inherits [pp::Instance](https://developer.chrome.com/native-client/pepper_stable/cpp/classpp_1_1_instance) class. In this constructor, there are tow initializing processes:

* To use [nacl_io](https://developer.chrome.com/native-client/devguide/coding/nacl_io), calls nacl_io_init_ppapi() function.
* To authenticate with Private Key via libssh2, mounts "/sftp" memory filesystem. Because, libssh2 tries to load the private key from a file.

This class really has an ability to treat Pepper API. Especially, this class provides [HandleMessage()](https://developer.chrome.com/native-client/pepper_stable/cpp/classpp_1_1_instance#a5dce8c8b36b1df7cfcc12e42397a35e8) function to handle messages from JavaScript layer. When the JavaScript layer sends a message to NaCl module, the HandleMessage() function called, and the message is passed as the argument.

```cpp
void SftpInstance::HandleMessage(const pp::Var &var_message)
{
  pp::VarDictionary dict(var_message);
  std::string command = dtct.Get("command").AsString();
  int request_id = GetIntegerValueFromString(dict.Get("request").AsString());
  pp::VarArray args(dict.Get("args"));

  SftpThread *sftp_thread = ...;

  if (command == "connect") {
    std::string server_hostname = args.Get(0).AsString();
    int server_port = GetIntegerValueFromString(args.Get(1).AsString());
    sftp_thread->ConnectAndHandshake(server_hostname, server_port);
  } else if ... {
    ...
}
```

Actually, the message is [pp::VarDictionary](https://developer.chrome.com/native-client/pepper_stable/cpp/classpp_1_1_var_dictionary). Each message has "command", "request" and "args" values. The args value is [pp::VarArray](https://developer.chrome.com/native-client/pepper_stable/cpp/classpp_1_1_var_array). In the HandleMessage() function, this SftpInstance instance calls the related function of the SftpThread instance. That is, this HandleMessage() function is a message router.

##### Sending a response to JavaScript layer

The NaCl module has to send the response to the JavaScript layer. This SftpInstance class implements SftpEventListener interface class defined by sftp_event_listener.h file. Each request is sent to each command class. The command class sends the response to the SftpInstance instance via the SftpEventListener interface.

```cpp
void FooCommand::Execute()
{
  std::string response = ... // Do something
  SftpEventListener *listener = GetListener();
  listener->OnFooFinished(GetRequestID(), response);
}
```

The listener above is the SftpInstance instance. Actually, each command is executed on a thread which is not the main thread. Basically, the response should be sent from the main thread. Therefore, each function of the SftpEventListener calls the function of the main thread to send the response to the JavaScript layer.

```cpp
void SftpInstance::OnFooFinished(const int request_id,
                                 const std::string &response)
{
  SendResponse(request_id,
               std::string("result_name"),
               std::vector<std::string>{response});
}

void SftpInstance::SendResponse(const int request_id,
                                const std::string &message,
                                const std::vector<std::string> &values)
{
  pp::CompletionCallback callback =
    factory_.NewCallback(&SftpInstance::SendResponseAsStringArray,
                         request_id,
                         message,
                         values);
  pp_core_->CallOnMainThread(0, callback);
}

void SftpInstance::SendResponseAsStringArray(int32_t result,
                                             const int request_id,
                                             const std::string &message,
                                             const std::vector<std::string> &values)
{
  pp::VarDictionary dict;
  dict.Set(pp::Var("request"), ...);
  dict.Set(pp::Var("message"), ...);
  dict.Set(pp::Var("values"), ...);
  PostMessage(dict);
}
```

Especially, to call the function on the main thread, [pp::Core#CallOnMainThread](https://developer.chrome.com/native-client/pepper_stable/cpp/classpp_1_1_core#af20d1f92600f588bc74115fcbd17a1c7) is used.

#### [sftp_thread.h](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/sftp_thread.h), [sftp_thread.cc](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/sftp_thread.cc)

The sftp_thread.h and sftp_thread.cc files have a responsibility of the following:

* Creating a new thread.
* Establishing a connection and handshaking to the SFTP server.
* Authenticating a user.
* Delegating each request to each command class.

As one important thing, we cannot use a socket communication with the nacl_io in the main thread. Therefore, another thread is necessary to use the nacl_io. The new thread is created by like the following:

```cpp
void SftpThread::DoSomething(const std::string message)
{
  FooCommand *command = new FooCommand(listener_,
                                       server_sock_,
                                       session_,
                                       sftp_session_,
                                       request_id_,
                                       message);
  pthread_t thread;
  pthread_create(&thread,
                 NULL,
                 &FooCommand::Start,
                 command);
}
```

When we want to create a new thread to call the function in the SftpThread class, do like the following:

```cpp
void SftpThread::DoSomething(const std::string message)
{
  message_ = message; // Set it to the member field.
  pthread_t thread;
  pthread_create(&thread,
                 NULL,
                 &SftpThread::StartSomething,
                 this);
}
```

When users request mounting, the ConnectAndHandshakeImpl() function is called. In the function, handshaking is done. For instance, there are the following processes:
 
* If the session already exists, close the session.
* Initialize libssh2 with calling [libssh2_init()](http://www.libssh2.org/libssh2_init.html).
* Connect to the SFTP server with POSIX socket() and connect() functions.
* Create libssh2 Session with [libssh2_session_init_ex()](http://www.libssh2.org/libssh2_session_init_ex.html).
* Handshake the session with [libssh2_session_handshake()](http://www.libssh2.org/libssh2_session_handshake.html).
* Get the fingerprint with [libssh2_hostkey_hash()](http://www.libssh2.org/libssh2_hostkey_hash.html).
* Get the fingerprint algorithm with [libssh2_session_methods](http://www.libssh2.org/libssh2_session_methods.html).

Then, the OnHandshakeFinished() of the SftpEventListener interface is called from the ConnectAndHandshakeImpl() function with the fingerprint and the algorithm. After confirming the fingerprint by the user, this script starts the following authentication process (for instance, the AuthenticateImpl() function has the processes):

* Get the authentication type list from the SFTP server with [libssh2_userauth_list()](http://www.libssh2.org/libssh2_userauth_list.html).
* Check whether the authentication type which the user specified is included in the server's authentication type list. If not exists, an exception is thrown.
* When the user specified "password" as the authentication type, authenticate the user with [libssh2_userauth_password()](http://www.libssh2.org/libssh2_userauth_password.html).
* When the user specified "keyboard-interactive" as the authentication type, authenticate the user with [libssh2_userauth_keyboard_interactive()](http://www.libssh2.org/libssh2_userauth_keyboard_interactive.html).
* When the user specified "publickey" as the authentication type, authenticate the user with [libssh2_userauth_publickey_fromfile()](http://www.libssh2.org/libssh2_userauth_publickey_fromfile.html). The private key file is read from the file system mounted at the SftpInstance initialization.
* After the authentication, turn on the non-blocking mode for the libssh2 with [libssh2_session_set_blocking()](http://www.libssh2.org/libssh2_session_set_blocking.html).
* Create the libssh2 SFTP Session with [libssh2_sftp_init()](http://www.libssh2.org/libssh2_sftp_init.html).

After the processes above, the OnAuthenticationFinished() function of the SftpEventListener interface is called from the AuthenticateImpl() function.

#### [sftp_event_listener.h](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/sftp_event_listener.h)

The sftp_event_listener.h file defines the SftpEventListener class. Actually, this SftpEventListener class is an abstract class. Therefore, all functions don't have any implementations. Instead, each function is implemented by the SftpInstance class.

Each function is called by each command class. These mappings are:

| Command class        | SftpEventListener function |
| -------------------- | -------------------------- |
| CreateFileCommand    | OnCreateFileFinished()     |
| DeleteEntryCommand   | OnDeleteEntryFinished()    |
| GetMetadataCommand   | OnMetadataListFetched()    |
| MakeDirectoryCommand | OnMakeDirectoryFinished()  |
| ReadDirectoryCommand | OnMetadataListFetched()    |
| ReadFileCommand      | OnReadFile()               |
| RenameEntryCommand   | OnRenameEntryFinished()    |
| TruncateFileCommand  | OnTruncateFileFinished()   |
| WriteFileCommand     | OnWriteFileFinished        |

Please see the SftpInstance section to know more detail for each function's behavior.

#### [communication_exception.h](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/communication_exception.h), [communication_exception.cc](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/communication_exception.cc)

The communication_exception.h file defines the CommunicationException exception class. Mainly, this exception class is thrown in the case that some error occurs in each command class. In the most case, when this exception occurs, the OnErrorOccurred() function of the SftpEventListener interface is called to notify the error for the SftpInstance instance from each command instance.

#### [abstract_command.h](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/abstract_command.h), [abstract_command.cc](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/abstract_command.cc)

The abstract_command.h file defines the AbstractCommand class. This class is a super class for all concrete command classes. This AbstractCommand class provides some features below for sub-classes:

* WaitSocket() - Detect the direction of the SFTP session with [libssh2_session_block_directions()](http://www.libssh2.org/libssh2_session_block_directions.html), and do select() for the detected file descriptor.
* OpenFile() - Open the specified file, and return the SFTP_HANDLE value. For instance, [libssh2_sftp_open()](http://www.libssh2.org/libssh2_sftp_open.html) is used to open the file.
* CloseSftpHandle() - Close the SFTP_HANDLE value with [libssh2_sftp_close_handle()](http://www.libssh2.org/libssh2_sftp_close_handle.html).

Also, some values. For example, the session value, SftpEventListener pointer value and etc.

#### Command classes

Each behavior defines each command class. Their command instances are created by the SftpThread instance. The mapping of the command name sent from the JavaScript layer and the command class is:

| Command Name   | SftpThread Function | Command Class        |
| -------------- | ------------------- | -------------------- |
| "file"         | GetMetadata()       | GetMetadataCommand   |
| "dir"          | ReadDirectory()     | ReadDirectoryCommand |
| "read"         | ReadFile()          | ReadFileCommand      |
| "mkdir"        | MakeDirectory()     | MakeDirectoryCommand |
| "delete"       | DeleteEntry()       | DeleteEntryCommand   |
| "rename"       | RenameEntry()       | RenameEntryCommand   |
| "create"       | CreateFile()        | CreateFileCommand    |
| "truncate"     | TruncateFile()      | TruncateFileCommand  |
| "write"        | WriteFile()         | WriteFileCommand     |

All command classes inherit the AbstractCommand class. Also, All command classes have Start() and Execute() functions. That is, an entry point of each command is the Start() function, and the Execute() function is called from the new thread.

Basically, command classes have some responsibilities like the following:

* Do required task with libssh2 functions.
* Create a response.
* Pass the response to the SftpEventListener function.

An instance of each command class is created per receiving a request from the JavaScript layer. Therefore, needed parameters are passed to each constructor.

##### [create_file_command.h](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/create_file_command.h), [create_file_command.cc](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/create_file_command.cc)

The create_file_command.h file defines CreateFileCommand class. This class has the following behavior:

* Open the specified file with [libssh2_sftp_open()](http://www.libssh2.org/libssh2_sftp_open.html). At this time, the used flags are: [LIBSSH2_FXF_CREAT, LIBSSH2_FXF_TRUNC, LIBSSH2_SFTP_S_IRUSR, LIBSSH2_SFTP_S_IWUSR, LIBSSH2_SFTP_S_IRGRP, LIBSSH2_SFTP_S_IROTH](http://www.libssh2.org/libssh2_sftp_open_ex.html). Actually, the file is created by this function call.
* Close the SFTP_HANDLE value with CloseSftpHandle() function().

##### [delete_entry_command.h](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/delete_entry_command.h), [delete_entry_command.cc](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/delete_entry_command.cc)
     
The delete_entry_command.h file defines DeleteEntryCommand class. This class has the following behavior:

* Open the specified entry with OpenFile() function.
* Get the entry type. That is, judge whether it is file or directory. To do this, [libssh2_sftp_fstat()](http://www.libssh2.org/libssh2_sftp_fstat.html) is used. The result is set into the LIBSSH2_SFTP_ATTRIBUTES struct. When passing the result to the LIBSSH2_SFTP_S_ISDIR macro, if the result is true, its entry is directory, otherwise, it is file.
* If its entry is file, call the [libssh2_sftp_unlink()](http://www.libssh2.org/libssh2_sftp_unlink.html) function to delete the file.
* If its entry is directory, call the [libssh2_sftp_rmdir()](http://www.libssh2.org/libssh2_sftp_rmdir.html) function to delete the directory and its children.

##### [get_metadata_command.h](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/get_metadata_command.h), [get_metadata_command.cc](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/get_metadata_command.cc)
     
The get_metadata_command.h file defines GetMetadataCommand class. This class has the following behavior:

* Open the specified file to get the SFTP_HANDLE value with OpenFile() function.
* Get the information of the file with [libssh2_sftp_fstat()](http://www.libssh2.org/libssh2_sftp_fstat.html) function.

Each attribute value is retrieved by:

| Attribute Name   | Method                                  |
| ---------------- | --------------------------------------- |
| isDirectory      | LIBSSH2_SFTP_S_ISDIR macro.             |
| size             | LIBSSH2_SFTP_ATTRIBUTES.fileSize value. |
| modificationTime | LIBSSH2_SFTP_ATTRIBUTES.mtime value.    |
| name             | The passed path string.                 |

##### [make_directory_command.h](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/make_directory_command.h), [make_directory_command.cc](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/make_directory_command.cc)

The make_directory_command.h file defines MakeDirectoryCommand class. This class has the following behavior:

* Call the [libssh2_sftp_mkdir()](http://www.libssh2.org/libssh2_sftp_mkdir.html) function to create a new directory. At the time, these flags are specified: LIBSSH2_SFTP_S_IRWXU, LIBSSH2_SFTP_S_IRGRP, LIBSSH2_SFTP_S_IXGRP, LIBSSH2_SFTP_S_IROTH, LIBSSH2_SFTP_S_IXOTH.

##### [read_directory_command.h](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/read_directory_command.h), [read_directory_command.cc](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/read_directory_command.cc)

The read_directory_command.h file defines ReadDirectoryCommand class. This class has the following behavior:

* Open the specified directory with [libssh2_sftp_opendir()](http://www.libssh2.org/libssh2_sftp_opendir.html) function.
* Read one entry information from the directory with [libssh2_sftp_readdir()](http://www.libssh2.org/libssh2_sftp_readdir.html) function.
* Repeat calling the libsh2_sftp_readdir() function to get each entry information in the directory until the libssh2_sftp_readdir() function returns zero or negative value.

Attribute values of each entry are:

| Attribute Name   | Method                                                  |
| ---------------- | ------------------------------------------------------- |
| isDirectory      | LIBSSH2_SFTP_S_ISDIR and LIBSSH2_SFTP_S_ISREG macros.   |
| size             | LIBSSH2_SFTP_ATTRIBUTES.fileSize value.                 |
| modificationTime | LIBSSH2_SFTP_ATTRIBUTES.mtime value.                    |
| name             | The 2nd argument of the libsh2_sftp_readdir() function. |

##### [read_file_command.h](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/read_file_command.h), [read_file_command.cc](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/read_file_command.cc)

The read_file_command.h file defines ReadFileCommand class. This class has the following behavior:

* Open the specified file to get the SFTP_HANDLE value with OpenFile() function.
* Move the position to start reading the file with [libssh2_sftp_seek64()](http://www.libssh2.org/libssh2_sftp_seek64.html).
* Read bytes from the file with [libssh2_sftp_read()](http://www.libssh2.org/libssh2_sftp_read.html). Actually, the max read byte length is 32KB at one time. The read bytes is sent to the JavaScript layer by calling the OnReadFile() function of the SftpEventListener.
* Repeat reading the bytes from the file until the end of the file or reached to the specified read length. Last, close the SFTP_HANDLE_value with CloseSftpHandle() function.

##### [rename_entry_command.h](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/rename_entry_command.h), [rename_entry_command.cc](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/rename_entry_command.cc)

The rename_entry_command.h file defines RenameEntryCommand class. This class has the following behavior:

* Rename the specified entry with [libssh2_sftp_rename()](http://www.libssh2.org/libssh2_sftp_rename.html) function.

##### [truncate_file_command.h](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/truncate_file_command.h), [truncate_file_command.cc](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/truncate_file_command.cc)

The truncate_file_command.h file defines TruncateFileCommand class. This class has the following behavior:

* Open the specified file with the OpenFile() function.
* Get the size of the file with [libssh2_sftp_fstat()](http://www.libssh2.org/libssh2_sftp_fstat.html). Actually, it is the LIBSSH2_SFTP_ATTRIBUTES.fileSize value.
* Read the bytes of the file with [libssh2_sftp_read()](http://www.libssh2.org/libssh2_sftp_read.html) function. If the specified length is less than the actual file size, the read file size is the length. Otherwise, all bytes is read.
* Close the SFTP_HANDLE value with CloseSftpHandle() function.
* Reopen the file with OpenFile() function. At this time, these flasg are specified: LIBSSH2_FXF_WRITE, LIBSSH2_FXF_CREAT, LIBSSH2_FXF_TRUNC, LIBSSH2_SFTP_S_IRUSR, LIBSSH2_SFTP_S_IWUSR, LIBSSH2_SFTP_S_IRGRP, LIBSSH2_SFTP_S_IROTH.
* Write the bytes which was already read against the new opened SFTP_HANDLE value with [libssh2_sftp_write()](http://www.libssh2.org/libssh2_sftp_write.html) function.
* If the specified length is more than the original file size, srcend zero-values which the length is (the specified length - original size) with the libssh2_sftp_write() function.
* Close the SFTP_HANDLE value with CloseSftpHandle() function.

##### [write_file_command.h](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/write_file_command.h), [write_file_command.cc](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/nacl_src/write_file_command.cc)

The write_file_command.h file defines WriteFileCommand class. This class has the following behavior:

* Open the specified file with the OpenFile() function.
* Move to the start position with [libssh2_sftp_seek64()](http://www.libssh2.org/libssh2_sftp_seek64.html) function.
* Write the bytes with [libssh2_sftp_write()](http://www.libssh2.org/libssh2_sftp_write.html) function.
* Close the SFTP_HANDLE value with CloseSftpHandle() function.


### Controller

#### [background.js](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/controller/background.js)

This is a background page script. Mainly, this script has a responsibility of launching the window when users want to mount the SFTP server. Also, this script has an ability to receive the message from the [window.js](#windowjs) script. When the message received, this script delegates the request of mounting the SFTP server to the [/src/js/model/sftp_fs.js](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/model/sftp_fs.js) script. Especially, this script has one SftpFS instance.

This script can know what users want to mount the SFTP server by handling [chrome.fileSystemProvider.onMountRequested](https://developer.chrome.com/extensions/fileSystemProvider#event-onMountRequested) event. When this event fired, this script opens the window.html.

#### [window.js](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/controller/window.js)

The [window.js](#windowjs) file is the root of ReactJS-based UI, and specifies the document node of `window.html` in which the UI will be rendered. The file renders [AppContent.js](#appcontentjs) as the only component; in this file, the communication between [background.js](#backgroundjs) (with help of [Messaging Passing](https://developer.chrome.com/apps/messaging)) and the chrome API takes place.



### View

The view is the user-interface is build with [ReactJS](https://reactjs.org/). Furthermore, Google-styled React Components are used - the [Material-UI-next](https://material-ui-next.com/) library - to ensure a native look and feel.  Before reading more about the components itself, please make sure that you are familiar with the concepts of React [components](https://reactjs.org/docs/components-and-props.html), [states](https://reactjs.org/docs/state-and-lifecycle.html) and [props](https://reactjs.org/docs/components-and-props.html). The structure of the components is visualized in the image below:

<img src="https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/raw/react/docs/uistructure-1.png" title="Structure of React Components" width="500" />

#### [AppContent.js](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/blob/react/src/js/view/AppContent.js)

AppContent combines all React Components to one user-interface, communicates with the chrome API to load and store favorites and settings, and communicates with [background.js](#backgroundjs) to initiate new mount connections.

The AppContent manages a list of states, which defines various behaviours of the interface. A description of states and functions is given.

#### States
|  **Name** | **Type** | **Description** |
|  ------ | ------ | ------ |
|  `open` | `Boolean` | Whether the Drawer pane is shown or not |
|  `serverName` | `String` | Value of inputfield for the server name |
|  `serverPort` | `String` | Value of inputfield for the server port |
|  `mountPath` | `String` | URI, relative to the server root, where the mount is opened |
|  `customDisplayName` | `Boolean` | Whether a custom display name is used in the Files app |
|  `displayName` | `String` | Name of the connection, as shown in the Files app |
|  `serverNameWarning` | `Boolean` | Whether a warning is shown in the UI, in case the field contains invalid chars |
|  `type` | `String` | Authentication type, as determined by libssh2. Possible values can be 'password', 'publicKey' or 'keyboard' |
|  `username` | `String` | Value of inputfield for the username |
|  `password` | `String` | Value of inputfield for the password |
|  `privateKey` | `String` | Value of inputfield for the private key |
|  `showPassword` | `Boolean` | Whether the password is displayed as dots or chars (readible or not) |
|  `keepCredentials` | `Boolean` | Whether the credentials (pass,privateKey) or stored in `chrome.local.storage` |
|  `favorites` | `Array` | List of favorite-objects, which contains mount details (servername, port, mountpath, displayname, username, authtype, password, privateKey) |
|  `isReadyToMakeFavorite` | `Boolean` | Whether the button 'Mark as favorite' is enabled. This is only in the cases, when the current input fields are not already stored as favorite. |
|  `isTryingToMount` | `Boolean` | Is true when [background.js](#backgroundjs) is trying to mount, based on the current values of the fields |
|  `isMounted` | `Boolean` | Is true, when the current values of the fields have succesfully lead to a mount in the Files app |
|  `showStatus` | `Boolean` | Whether the statusbar is shown or not |
|  `statusMessage` | `String` | The message, displayed in the status bar |
|  `showDialog` | `Boolean` | Whether the dialog is showed or not |
|  `dialogTitle` | `String` | Title of the dialog |
|  `dialogMessage` | `String` | Message displayed in the dialog |
|  `dialogDetails` | `Array` | List of detail objects (each containing a key and value pair). When this optional array is not empty, the details are shown in the dialog to support the message. |
|  `responseCache` | `Object` | AppContent communicates with [background.js](#backgroundjs) with help of Messaging Passing. Responses are temporary stored in this field. |

#### Functions
Range Only

|  **Name** | **Arguments** | **Description** |
|  ------ | ------ | ------ |
|  ***Initializing React*** |  |  |
|  componentDidMount |  | componentDidMount is an event handler and invoked by React as soon the component is load. E.g. a React-type of 'onload'. The function invokes loadLocalStoredMountFavorites and loadLocalStoredSettings to get mount favorites and keepcredential-settings from the local storage of chrome. |
|  ***Changing input fields*** |  |  |
|  handleChange | name (string), value (string) | handleChange validates any value of any input element, and stores the value in the corresponding state. The function is triggered by all fields, when the field changes. |
|  handleBlur | name (string), value (string) | handleBlur validates serverPort and displayName as soon the user has selected outside these input fields. Portnumber may not be negative, may not be empty, and my not be not-a-number. The (custom) display name may not be empty; otherwise, default values will be used. |
|  isFormReadyTo | opts (object) | isFormReadyTo verifies whether all fields are filled to mount the share or make the share favorite |
|  setDefaultDisplayName |  | setDefaultDisplayName sets the display name to a newly created default display name, based on the latest (not yet updated) states, gives as the first argument. |
|  createDefaultDisplayName | opts (object) | createDefaultDisplayName creates a default display name. The display name is the reference to the SFTP mount, as shown in ChromeOS Files. |
|  ***Mounting a connection instance*** |  |  |
|  onMountButtonClick |  | onMountButtonClick is invoked when the user clicks on the mount button. The function creates a mount-request based on the input fields which will be send to [background.js](#backgroundjs)with help of Message Passing. Background.js will invoke SftpFs on his turn. |
|  handleInitialMountResponse | response (object) | handleInitialMountResponese handles the feedback received from 'background.js' by the Message Passing protocol, based on the initial mount request (created in onMountButtonClick). When 'background.js' could parse our request succesfully, a fingerprint of the host-server will be returned which need to be validated by the user (if not already trusted by the user). |
|  handleConfirmFingerprint |  | handleConfirmFingerprint is invoked by the confirmation given by the user in the dialog, and trusts the fingerprint of the server, which will continue the initiation of the connection. |
|  handleDeclineFingerprint |  | handleDeclineFingerprint is invoked by the decline-button of the dialog, and cancles the mount initiation. |
|  handleConnectionResponse | response (object) | handleConnectionResponse handles the response which is received, after the server's fingerprint of the server is confirmed (automatically or by the dialog confimration of the user). The response can be succesfull, and means a connected mount. When unsuccesfull, a failure will be shown as a status pop-up.  |
|  ***Save and load data from chrome.storage.local*** |  |  |
|  loadKeepCredentialSetting |  | loadKeepCredentialSetting loads the setting whether the user wants to save credentials are not |
|  loadTrustedFingerprints |  | loadTrustedFingerprints loads all locally stored fingerprints, which are trusted (by the user). When the user connected to a specific server, and its fingerprint is confirmed at that time, this fingerprint will be saved. The fingerprints are stored as an Object within the Chrome App environment (chrome.storage.local). |
|  getLocalStoredTrustedFingerprint | serverName (string), serverPort (string) | getLocalStoredTrustedFingerprint gets a specific fingerprint for a specific server and of serverport combination. The function derives all fingerprints with of help the function 'loadTrustedFingerprints'.  |
|  storeTrusedFingerprints | serverName (string), serverPort (string), algorithm (string), fingerprint (string) | storeTrustedFingerprint saves a specific fingerprint for a specific server-serverport combination , in the local storage of the Chrome App environment (chrome.storage.local). |
|  loadLocalStoredMountFavorites |  | loadLocalStoredMountFavorites loads all locally stored connection favorites. These favorites are stored in an Array, named 'mountFavorites', within the Chrome App environment (chrome.storage.local). The functions loads the Array within the favorites state of the app. |
|  storeAsFavorite |  | storeAsFavorite saves the current completed form fields as a 'favorite' within the favorites-state-array and the chrome.storage.local environment. These favorites can be shown and requested from the drawer. |
|  createKey | reference (string) | createKey generates a unique identifier. The function is used to add a unique id for each saved favorite. |
|  showFavorite | favorite (object) | showFavorite shows the data of the favorite mount in the according input fields |
|  removeFavorite | favorite (object) | removeFavorite removes an saved favorite from the list of favorites  |
|  ***Miscellaneous events*** |  |  |
|  onToggleDrawer |  | onToggleDrawer updates the state to open or close the drawer (the menu with favorites, invoked by the three dots button) |
|  onToggleCustomDisplayname |  | onToggleCustomDisplayname turns the use of a custom display name on or off. The function is invoked by the checkbox in the display name form field. |
|  onAddFavorite |  | Invoked by the favorite-button, which inits storeAsFavorite and open the drawer. |
|  onShowFavorite |  | onShowFavorite is invoked when the user clicks an favorite listitem, which triggers showFavorite subsequently. |
|  onRemoveFavorite |  | onRemoveFavorite is invoked when the user clicks the delete-button on a list-item |
|  onToggleKeepCredentials |  | onToggleKeepCredentials is invoked by the keep-credentials-setting switch in the Drawers list. The function toggles the keepCredentials state, and updates the state in `chrome.storage.local`. In case the user does not want to keep credentials, credentials from previous favorites are removed.  |
|  onShowStatus | message (string) | Shows the status bar with a given message |
|  onCloseStatus |  | onCloseStatus is invoked, when the users clicks on the close-button in the status bar. It will hide the status bar. |