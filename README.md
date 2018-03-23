# File share (SFTP)

### A ChromeOS app which provides the ability to access a SFTP server, directly from the Files app

## Content
1. [Description](#description)
2. [Installation](#installation)
3. [Development](#development)
⋅⋅1. [Getting started](#getting-started)
⋅⋅2. [Compile Native Client code](#compile-native-client-code)
⋅⋅3. [Compile the project](#compile-the-project)
⋅⋅4. [Start the app](#start-the-app)
4. [Issues](#issues)
5. [License](#license)

## Description
*File share (SFTP)* is forked from [yoichiro/chromeos-filesystem-sftp](https://github.com/yoichiro/chromeos-filesystem-sftp/) and provides the ability to access a SFTP server directly from the ChromeOS Files app. The fork has improved the design of the user-interface, to provide a more native look-and-feel. To do so, the build systems have been moved from [bower](https://bower.io/), [grunt](https://gruntjs.com/) to [npm](https://www.npmjs.com), [webpack](https://webpack.js.org/) to make use of [React](https://reactjs.org/) and the [Material-UI components](https://material-ui-next.com/).

![alt text](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/docs/screenshot-1.png  "File share (SFTP) app preview")

## Development
*File share (SFTP)* is a [Chrome App](https://developer.chrome.com/apps/about_apps), therefore explicitly build for ChromeOS systems. Chrome Apps can be created with common web technologies such as  HTML5, CSS, and JavaScript to deliver an experience comparable of a native application. To extent the power of these technologies, Chrome delivers a [Native Client SDK](https://developer.chrome.com/native-client/sdk/download) to compile C and C++ code in the browser efficiently and securely, independent of the user’s operating system. *File share (SFTP)* makes use of [libssh2](https://www.libssh2.org/) which has been ported to the [Native Client](https://developer.chrome.com/native-client) environment to establish a file share connection over SSH (i.e. SFTP; SSH File Transfer Protocol). The compiled code is part of the app, and communicates with the web technologies back and forth.

Please visit [Code Structure](https://github.com/tjibbevanderlaaan/chromeos-filesystem-sftp/blob/react/docs/code_structure.md) document, to get more insights of the app structure.

### Getting started
To build the app, you need a 1) build system to compile the Native Client sourcecode, and a 2) front-end build system to build the app itself.

1. First of all, install NodeJS and the node package manager (NPM) - by default installed with NodeJS. You can download and install NodeJS from: <https://nodejs.org/>. Make sure that the `npm` command is included to your global `$PATH` environment variable. 
2. Download the repository! Clone the project with the following command:
	```bash
	cd ~/
	git clone https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp.git
	cd chromeos-filesystem-sftp
	```

### Compile Native Client code
To compile the Native Client code (i.e. [/src/nativeclient_src](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/tree/react/src/nacl_src)), you will need the [Native Client SDK](https://developer.chrome.com/native-client/sdk/download), [depot_tools](https://chromium.googlesource.com/chromium/tools/depot_tools.git) and the ported libssh2 library from [webports](https://chromium.googlesource.com/webports/). 

#### Install NaCL SDK

1. Download the Native Client from https://developer.chrome.com/native-client/sdk/download
2. You should get the archive file named `nack_sdk.zip`. You can extract the archive in any directory you want. Because multiple tools will be used, I've created a easily retrievable directory (e.g. `~/buildutils/`) and extracted the archive to this folder (e.g. `~/buildutils/nacl_sdk`).
3. Add the absolute path of the `nacl_sdk`-directory to the environment variables `$PATH` and `$NACL_SDK_ROOT` as follows:
	```bash
	export PATH=~/buildutils/nacl_sdk:$PATH
	export NACL_SDK_ROOT=~/buildutils/nacl_sdk/
	```
4. Subsequently, you need to install the stable bundle (at the time of writing, *pepper_49*) with this command:
	```bash
	cd $NACL_SDK_ROOT
	./naclsdk update
	```

#### Install depot_tools
5. To be able to set-up `webports`, you will need `depot_tools`. Clone the `depot_tools` repository with the following commands:
	```bash
	cd ~/buildutils
	git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
	```
6. Add the cloned path to your `$PATH` environment variable.
	```bash
	export PATH=~/buildutils/depot_tools:$PATH
	```

#### Install webports
7. Install webports with the `gclient` command included in the `depot_tools`:
	```bash
	cd ~/buildutils
	mkdir naclports
	cd naclports
	gclient config --name=src  https://chromium.googlesource.com/external/webports
	gclient sync
	```

#### Compile libssh2
8. Compile the libssh2 C library in the `webports` directory with the command below. The `./make_all.sh` command compiles the libraries for all suitable architectured (e.g. i686, x86_64, arm, pnacl).
	```bash
	cd ~/buildutils/webports
	./make_all.sh libssh2
	```

#### Make the project's Native Client code
8. Change directory to the project, and run the compile command:
	```bash
	cd ~/chromeos-filesystem-sftp
	cd src/nacl_src
	make CONFIG=Release
	```	
9. The compiled code is created in the directory `/src/clang-newlib`.

### Compile the project
1. Install all building system and front-end dependencies, with the following command:
	```bash
	cd ~/chromeos-filesystem-sftp
	npm install
	```

2. To build the project, use the following command. The build directory is `/dist` and specified in `/webpack.config.js`.
	```bash
	npm run build
	```

### Start the app
Because the app is a Chrome App and not a Chrome Extension, the app can only be opened on Chrome OS devices!

1. Move the compiled project folder (e.g. `/dist`) to an accessible local directory on your ChromeOS device, for example `~/Downloads/dist`.
2. Open the Google Chrome browser and navigate to `chrome://extensions`.
3. Make sure that  _Developer Mode_ is checked.
4. Click the _Load unpacked extension_ button, navigate to your app's folder and click OK.

You can find more information on <https://developer.chrome.com/apps/first_app#load>.

## Issues
While the app is working, there are still some features which could be improved.

1. Unfortunately, I've could not manage to configure 'hot reload' during developments. Because the app is a Chrome App, and not a Chrome Extension, some I stumbled to some Content Security Policy (CSP) errors. 
2. I've would like to improve the quality of error messages (in case authentication failed for example).
3. User credentials are stored in the `chrome.app.storage`. While there not accessible by other apps, it seems not the most secure solution.
4. Automatic testing is not yet incorporated.


## License

All files are licensed under the BSD license. See the LICENSE file for details.
All original source code is Copyright 2015-2016 Yoichiro Tanaka.
