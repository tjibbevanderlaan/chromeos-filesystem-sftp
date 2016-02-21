[![Code Climate](https://codeclimate.com/github/yoichiro/chromeos-filesystem-sftp/badges/gpa.svg)](https://codeclimate.com/github/yoichiro/chromeos-filesystem-sftp)

# SFTP File System

SFTP File System provides you an ability to access to a SFTP server directly from the Files app.

<a target="_blank" href="https://chrome.google.com/webstore/detail/sftp-file-system/gbheifiifcfekkamhepkeogobihicgmn">
  <img src="https://raw.githubusercontent.com/yoichiro/chromeos-filesystem-sftp/master/docs/install-button.png">
</a>

<img src="https://raw.githubusercontent.com/yoichiro/chromeos-filesystem-sftp/master/docs/screenshot-1.png">

## How to build

Before building this, you have to install nacl-sdk and libssh2 from naclports.

### Installing node.js

Download and install node.js.

[Downloads - nodejs.org](https://nodejs.org/en/download/)

You need to confirm that the `npm` command has been included into your $PATH environment variable.

### Installing NaCl SDK

Download NaCl SDK from: [Download the Native Client SDK](https://developer.chrome.com/native-client/sdk/download)

You should get the archive file named `nack_sdk.zip`. Extract it to any directory, and add the path to your $PATH environment variable as like the following:

```bash
export $PATH=/YOUR/NACLSDK/PATH:$PATH
```

Then, install the stable bundle by the following:

```bash
$ cd $NACL_SDK_ROOT
$ ./naclsdk update
```

### Installing depot_tools

You need to install depot_tools to set up the naclports.

```bash
$ cd DIRECTORY_YOU_WANT_TO_INSTALL_DEPOT_TOOLS
$ git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
```

Add the cloned path to your $PATH environment variable.

```bash
export $PATH=/YOUR/DEPOT_TOOLS/PATH:$PATH
```

### Installing naclports

Install naclports with the glient command included in the depot_tools.

```bash
$ cd DIRECTORY_YOU_WANT_TO_INSTALL_NACLPORTS
$ mkdir naclports
$ cd naclports
$ gclient config --name=src  https://chromium.googlesource.com/external/naclports.git@pepper_43
$ gclient sync
```

### Making and installing libssh2

Make libssh2 C library in the naclports.

```bash
$ cd NACLPORTS_DIRECTORY
$ ./make_all.sh libssh2
```

### Getting this project

Clone this project to your local environment.

```bash
$ git clone https://github.com/yoichiro/chromeos-filesystem-sftp.git
$ cd chromeos-filesystem-sftp
$ npm install
```

### Building this project

It's simple!

```bash
$ grunt
```

If you want to build NaCl module only, then:

```bash
$ grunt make
```

## Dependent libraries

* [libssh2](http://www.libssh2.org/)
* [crypto-js](https://code.google.com/p/crypto-js/)
* [Polymer](https://www.polymer-project.org/)
* [jQuery](http://jquery.com/)

## License

All files are licensed under the BSD license. See the LICENSE file for details.
All original source code is Copyright 2015-2016 Yoichiro Tanaka.
