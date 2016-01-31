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

TBD

### [/app/scripts/window.js](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/scripts/window.js)

TBD

### [/app/scripts/background.js](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/scripts/background.js)

TBD

### [/app/scripts/sftp_fs.js](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/scripts/sftp_fs.js)

TBD

### [/app/scripts/sftp_client.js](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/scripts/sftp_client.js)

TBD

### [/app/scripts/metadata_cache.js](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/scripts/metadata_cache.js)

This script provides an ability to keep metadata objects. As the result, whole performance is increased because of reducing a network communication. Each metadata object is stored per each directory. That is, the cache key is a directory path.

* put() - Store metadata object array to the cache storage mapped by the specified directory path.
* get() - Retrieve metadata object/array specified by the directory path/file path.
* remove() - Delete the metadata object/array specified by the directory path/file path.

### [/app/scripts/task_queue.js](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/scripts/task_queue.js)

TBD

## Native Client Library Module

TBD

### [/app/nacl_src/Makefile](https://github.com/yoichiro/chromeos-filesystem-sftp/blob/master/app/nacl_src/Makefile)

TBD

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
