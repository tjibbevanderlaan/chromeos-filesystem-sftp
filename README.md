# File share (SFTP)

### A ChromeOS app which provides the ability to access a SFTP server, directly from the Files app

<img src="https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/raw/react/docs/screenshot-1.png" title="File share SFTP app preview" width="500" />

## Content
1. [Description](#description)
2. [Installation](#installation)
3. [Development](#development)
	1. [Getting started](#getting-started)
	2. [Compile Native Client code](#compile-native-client-code)
	3. [Compile the project](#compile-the-project)
	4. [Start the app](#start-the-app)
4. [Issues](#issues)
5. [License](#license)

## Description
*File share (SFTP)* is forked from [yoichiro/chromeos-filesystem-sftp](https://github.com/yoichiro/chromeos-filesystem-sftp/) and provides the ability to access a SFTP server directly from the ChromeOS Files app. The fork has improved the design of the user-interface, to provide a more native look-and-feel. To do so, the front-end build system have been moved from [bower](https://bower.io/), [grunt](https://gruntjs.com/) to [npm](https://www.npmjs.com), [webpack](https://webpack.js.org/) to make use of [React](https://reactjs.org/) and the [Material-UI components](https://material-ui-next.com/).

## Development
*File share (SFTP)* is a [Chrome App](https://developer.chrome.com/apps/about_apps), therefore explicitly build for ChromeOS systems. Chrome Apps can be created with common web technologies such as  HTML5, CSS, and JavaScript to deliver an experience comparable of a native application. To extent the power of these technologies, Chrome delivers a [Native Client SDK](https://developer.chrome.com/native-client/sdk/download) to compile C and C++ code in the browser efficiently and securely, independent of the user’s operating system. *File share (SFTP)* makes use of [libssh2](https://www.libssh2.org/) which has been ported to the [Native Client](https://developer.chrome.com/native-client) environment to establish a file share connection over SSH (i.e. SFTP; SSH File Transfer Protocol). The compiled code is part of the app, and communicates with the web technologies back and forth.

Please visit [Code Structure](https://github.com/tjibbevanderlaaan/chromeos-filesystem-sftp/blob/react/docs/code_structure.md) document, to get more insights of the app structure.

### Getting started
To build the app, you need a 1) build system to compile the app's Native Client code, and a 2) front-end build system to build the app itself.

1. First of all, install NodeJS and the node package manager (NPM) - by default installed with NodeJS. You can download and install NodeJS from: <https://nodejs.org/>. Make sure that the `npm` command is included to your global `$PATH` environment variable. 
2. Download the repository! Clone the project with the following command:
	```bash
	cd ~
	git clone https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp.git
	cd chromeos-filesystem-sftp
	```

### Compile Native Client code
To compile the app's Native Client code ([/src/nativeclient_src](https://github.com/tjibbevanderlaan/chromeos-filesystem-sftp/tree/react/src/nacl_src)), you will need the [Native Client SDK](https://developer.chrome.com/native-client/sdk/download), [depot_tools](https://chromium.googlesource.com/chromium/tools/depot_tools.git) and the ported libssh2 library from [webports](https://chromium.googlesource.com/webports/). 

#### Install NaCl SDK

1. Download the Native Client from <https://developer.chrome.com/native-client/sdk/download>.
2. You should get the archive file named `nack_sdk.zip`. You can extract the archive in any directory you want, however, in this guide I will use the directory `~/buildutils/`. Consequently, the extracted files can be found in `~/buildutils/nacl_sdk`.
3. Install the stable bundle of the SDK (at the time of writing, *pepper_49*):
	```bash
	cd ~/buildutils/nacl_sdk
	./naclsdk update
	```
4. Subsequently, add the absolute path of the installed sdk-directory (e.g. `pepper_49`) to the environment variables `$PATH` and `$NACL_SDK_ROOT`:
	```bash
	export PATH=~/buildutils/nacl_sdk/pepper_49:$PATH
	export NACL_SDK_ROOT=~/buildutils/nacl_sdk/pepper_49
	```

	**Resolve certificate error** Unfortunately, I ran into a certificate error `SSL: CERTIFICATE_VERIFY_FAILED`. You can temporary bypass the certificate verification by modifying `download.py`, within `$NACL_SDK_ROOT/nacl_sdk/sdk_tools`, as suggested by <https://groups.google.com/forum/#!topic/native-client-discuss/sh-9sA6LHjw>. Make sure that you do not download malicious software!

	1. Find this line:
	```python
	request = fancy_urllib.FancyRequest(url)
	```
	2. And modify it to:
	```python
	request = fancy_urllib.FancyRequest(url.replace("https://", "http://"))
	```
	3. Perform the `./naclsdk update` command again!

#### Install depot_tools
5. To be able to set-up `webports`, you will need `depot_tools`. Clone the `depot_tools` repository by using these commands:
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
	mkdir webports
	cd webports
	gclient config --name=src  https://chromium.googlesource.com/webports/
	gclient sync
	```

#### Compile libssh2
8. Compile the libssh2 C library in the `webports` directory with the command below. The `./make_all.sh` command compiles the libraries for all suitable architectured (e.g. i686, x86_64, arm, pnacl).
	```bash
	cd ~/buildutils/webports/src
	./make_all.sh libssh2
	```
	**Resolve issue 'missing testfile'** During the postbuild of libssh2, the 	testfile `ssh2.nexe` could not be found. I'm not sure if this is a 			correct fix, but it works; modify the the buildfile of the webported 		libssh2 as follows:
	1. In your text editor, open `build.sh` located at `~/buildutils/webports/src/ports/libssh2/`
	2. Rename `EXECUTABLES="tests/ssh2${NACL_EXEEXT}"` to `EXECUTABLES="example/ssh2${NACL_EXEEXT}"`
	3. Start compiling again (step 8)

	**Resolve issue 'qemu-arm cannot open shared library'** While testing the `glibc-compat` binary for arm architectures, the `qemu-arm` application (part of the NaCl SDK) is used, but fails. Installing `qemu` yourself fixes the issue.
    1. Install `qemu` by yourself:
	```bash
	sudo apt-get install qemu
	```
	2. Prevent the usage of `qemu` provided by Native Client SDK, by renaming the binary:
	```bash
	cd $NACL_SDK_ROOT/tools
	mv qemu-arm qemu-arm-bak
	```
	3. Start compiling again (step 8)

#### Make the project's Native Client code
9. Change directory to the project, and run the compile command:
	```bash
	cd ~/chromeos-filesystem-sftp
	cd src/nacl_src
	make CONFIG=Release
	```	
10. The compiled code is created in the directory `/src/clang-newlib`.

### Compile the project
1. Install all building system and front-end dependencies (if not already done):
	```bash
	cd ~/chromeos-filesystem-sftp
	npm install
	```
2. Make sure that you've compiled the app's native client code; this should be located in `/src/clang-newlib`.
3. To build the project, use the following command. The build directory is `/dist` and specified in `/webpack.config.js`.
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

* Unfortunately, I've could not manage to configure 'hot reload' for development. Because the app is a Chrome App, and not a Chrome Extension, I stumbled to some Content Security Policy (CSP) errors. 
* I've would like to improve the quality of error messages (in case authentication failed for example).
* User credentials are stored in the `chrome.app.storage`. While they are not accessible by other apps, it seems not the most secure solution.
* Automatic testing is not yet incorporated.


## License

All files are licensed under the BSD license. See the LICENSE file for details.
All original source code is Copyright 2015-2016 Yoichiro Tanaka.
