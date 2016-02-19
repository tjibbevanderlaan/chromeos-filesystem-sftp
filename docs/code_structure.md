# Code Structure

This document describes you code structure of this software. Mainly, I write down about the directory structure and the purpose of each file.

# Directories

* [/](https://github.com/yoichiro/chromeos-filesystem-sftp) - Build files, Configuration files, and etc.
* [/app](https://github.com/yoichiro/chromeos-filesystem-sftp/tree/master/app) - This directory has one HTML file and the manifest.json file.
* [/app/_locales/en](https://github.com/yoichiro/chromeos-filesystem-sftp/tree/master/app/_locales/en) - There is one message resource file for English.
* [/app/images](https://github.com/yoichiro/chromeos-filesystem-sftp/tree/master/app/images) - This directory has some image files.
* [/app/scripts](https://github.com/yoichiro/chromeos-filesystem-sftp/tree/master/app/scripts) - There are some JavaScript files.
* [/app/styles](https://github.com/yoichiro/chromeos-filesystem-sftp/tree/master/app/styles) - There is one css style sheet definition file.
* [/app/nacl_src](https://github.com/yoichiro/chromeos-filesystem-sftp/tree/master/app/nacl_src) - This directory has some C++ code of NaCl module which is using libssh2 C library to communicator SSH2 Server with SFTP protocol.
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

This HTML file provides a screen to fill in a connection information. The connection information form consists of server host-name, the port number, user name, authentication type, user password and etc. When users pushes the "KEEP" button, the connection information the user filled in is stored the shared storage with chrome.storage.sync API. All stored information are displayed on the left pane.

This window.html file has two dialogs. One is to display and confirm fingerprints. This software has an ability to keep each fingerprints which a connected server was returned. Users always can know all fingerprints on this dialog. Another one is to configure a setting. If the user wants to store the entered password, the user can turn on the setting on this dialog.

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

When this event fired, the onClickedBtnMount() function is called. The window.js file doesn't have any process to mount the SFTP server. Instead, this event handler delegates the actual process to the background page represented by the background.js file. For instance, the onClickedBtnMount() function sends a message to the background page. The message has key/value pairs: type:"mount" and other information to log in which was filled in each field by the user.

Actually, the following interactions occurs:

1. The window.js sends the message which has type:"mount" and other information needed to log in to the background.js.
1. If this is the first time to connect to the server, or if the previous fingerprint is not same as the new fingerprint, the background.js returns type:"confirmFingerprint" message.
1. The window.js shows the dialog to display the new fingerprint to the user. The user has two options: "Accept" and "Decline". To continue to do the log in process, the user needs to choose the "Accept".
1. The window.js sends the message which has type:"accept".
1. The background.js do log in process. If it succeeded, the background.js returns the message which has "success".
1. If the user chooses the "Decline", the window.js sends the message which has type:"decline". The background.js does the post-cleaning.

The reason why the window.js shows the fingerprint to the user is a concern of security issues. That is, the user must confirm whether the server which the user is trying to connect is correct server or not by the fingerprint.

#### Keep button click event

When this event fired, the onClickedBtnKeep() function is called. This function has an ability to store the entered information to log in to the server to local storage with [chrome.storage.local](https://developer.chrome.com/apps/storage#property-local) API. If the same server name, port number and user name entry exists, it will be overwritten.

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

### [/app/nacl_src/sftp.h](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/sftp.h),[sftp.cc](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/sftp.cc)

The sftp.h and sftp.cc files have a responsibility to handle messages from JavaScript layer and to send the result to the JavaScript layer.

#### Handling messages from JavaScript layer

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

#### Sending a response to JavaScript layer

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

### [/app/nacl_src/sftp_thread.h](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/sftp_thread.h),[sftp_thread.cc](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/sftp_thread.cc)

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

### [/app/nacl_src/sftp_event_listener.h](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/sftp_event_listener.h)

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

### [/app/nacl_src/communication_exception.h](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/communication_exception.h),[communication_exception.cc](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/communication_exception.cc)

The communication_exception.h file defines the CommunicationException exception class. Mainly, this exception class is thrown in the case that some error occurs in each command class. In the most case, when this exception occurs, the OnErrorOccurred() function of the SftpEventListener interface is called to notify the error for the SftpInstance instance from each command instance.

### [/app/nacl_src/abstract_command.h](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/abstract_command.h),[abstract_command.cc](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/abstract_command.cc)

The abstract_command.h file defines the AbstractCommand class. This class is a super class for all concrete command classes. This AbstractCommand class provides some features below for sub-classes:

* WaitSocket() - Detect the direction of the SFTP session with [libssh2_session_block_directions()](http://www.libssh2.org/libssh2_session_block_directions.html), and do select() for the detected file descriptor.
* OpenFile() - Open the specified file, and return the SFTP_HANDLE value. For instance, [libssh2_sftp_open()](http://www.libssh2.org/libssh2_sftp_open.html) is used to open the file.
* CloseSftpHandle() - Close the SFTP_HANDLE value with [libssh2_sftp_close_handle()](http://www.libssh2.org/libssh2_sftp_close_handle.html).

Also, some values. For example, the session value, SftpEventListener pointer value and etc.

### Command classes

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

#### [/app/nacl_src/create_file_command.h](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/create_file_command.h),[create_file_command.cc](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/create_file_command.cc)

The create_file_command.h file defines CreateFileCommand class. This class has the following behavior:

* Open the specified file with [libssh2_sftp_open()](http://www.libssh2.org/libssh2_sftp_open.html). At this time, the used flags are: [LIBSSH2_FXF_CREAT, LIBSSH2_FXF_TRUNC, LIBSSH2_SFTP_S_IRUSR, LIBSSH2_SFTP_S_IWUSR, LIBSSH2_SFTP_S_IRGRP, LIBSSH2_SFTP_S_IROTH](http://www.libssh2.org/libssh2_sftp_open_ex.html). Actually, the file is created by this function call.
* Close the SFTP_HANDLE value with CloseSftpHandle() function().

#### [/app/nacl_src/delete_entry_command.h](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/delete_entry_command.h),[delete_entry_command.cc](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/delete_entry_command.cc)
     
The delete_entry_command.h file defines DeleteEntryCommand class. This class has the following behavior:

* Open the specified entry with OpenFile() function.
* Get the entry type. That is, judge whether it is file or directory. To do this, [libssh2_sftp_fstat()](http://www.libssh2.org/libssh2_sftp_fstat.html) is used. The result is set into the LIBSSH2_SFTP_ATTRIBUTES struct. When passing the result to the LIBSSH2_SFTP_S_ISDIR macro, if the result is true, its entry is directory, otherwise, it is file.
* If its entry is file, call the [libssh2_sftp_unlink()](http://www.libssh2.org/libssh2_sftp_unlink.html) function to delete the file.
* If its entry is directory, call the [libssh2_sftp_rmdir()](http://www.libssh2.org/libssh2_sftp_rmdir.html) function to delete the directory and its children.

#### [/app/nacl_src/get_metadata_command.h](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/get_metadata_command.h),[get_metadata_command.cc](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/get_metadata_command.cc)
     
The get_metadata_command.h file defines GetMetadataCommand class. This class has the following behavior:

* Open the specified file to get the SFTP_HANDLE value.
* Get the information of the file with [libssh2_sftp_fstat()](http://www.libssh2.org/libssh2_sftp_fstat.html) function.

Each attribute value is retrieved by:

| Attribute Name   | Method                                  |
| ---------------- | --------------------------------------- |
| isDirectory      | LIBSSH2_SFTP_S_ISDIR macro.             |
| size             | LIBSSH2_SFTP_ATTRIBUTES.fileSize value. |
| modificationTime | LIBSSH2_SFTP_ATTRIBUTES.mtime value.    |
| name             | The passed path string.                 |

#### [/app/nacl_src/make_directory_command.h](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/make_directory_command.h),[make_directory_command.cc](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/make_directory_command.cc)

The make_directory_command.h file defines MakeDirectoryCommand class. This class has the following behavior:

* Call the [libssh2_sftp_mkdir()](http://www.libssh2.org/libssh2_sftp_mkdir.html) function to create a new directory. At the time, these flags are specified: LIBSSH2_SFTP_S_IRWXU, LIBSSH2_SFTP_S_IRGRP, LIBSSH2_SFTP_S_IXGRP, LIBSSH2_SFTP_S_IROTH, LIBSSH2_SFTP_S_IXOTH.

#### [/app/nacl_src/read_directory_command.h](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/read_directory_command.h),[read_directory_command.cc](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/read_directory_command.cc)

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



## Other

### [/app/manifest.json](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/manifest.json)

This is a manifest file which is needed for Chrome Apps.
