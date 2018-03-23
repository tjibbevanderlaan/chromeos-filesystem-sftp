import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import classNames from 'classnames';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';
import IconButton from 'material-ui/IconButton';
import BookmarkIcon from 'material-ui-icons/BookmarkBorder';
import MoreVertIcon from 'material-ui-icons/MoreVert';
import ServerForm from './ServerForm';
import AuthForm from './AuthForm';
import ConfirmForm from './ConfirmForm';
import DrawerLists from './DrawerLists';
import AppIcon from './AppIcon';
import SnackbarInformer from './SnackbarInformer';
import ConfirmDialog from './ConfirmDialog';

const drawerWidth = 240;
const defaultPort = 22;
const gridspacing = 24;

let timer = null;

const patterns = {
  uriChars: /[^a-z0-9{}|\\^[\]`;/?:@&=+$,%-._~]/i,
  nameChars: /[^a-z0-9-._~]/i
};

const styles = theme => ({
  appFrame: {
    position: 'relative',
    display: 'flex',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  appBar: {
    position: 'absolute',
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: drawerWidth,
  },
  menuButton: {
    marginLeft: 12,
    marginRight: -theme.spacing.unit,
  },
  appIcon: {
    paddingLeft: theme.spacing.unit,
    paddingRight:theme.spacing.unit
  },
  hide: {
    display: 'none',
  },
  flex: {
    flex: 1,
  },
  content: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    backgroundColor: theme.palette.background.default,
    paddingLeft: theme.spacing.unit * 4,
    paddingRight: theme.spacing.unit * 4,
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit * 2,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    height: 'calc(100% - 56px)',
    marginTop: 56,
    [theme.breakpoints.up('sm')]: {
      height: 'calc(100% - 64px)',
      marginTop: 64,
    },
    marginRight: -drawerWidth,
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: 0,
  },
  contentItem: {
    flex: 1,
    marginBottom: theme.spacing.unit*2,
  },
  fixedBottom: {
    flexGrow: 0,
    flexShrink: 1,
    alignSelf: 'flex-end',
    paddingBottom: theme.spacing.unit*4
  }
});

/**
 * AppContent React.Component class
 * Main component of the app
 */
class AppContent extends React.Component {
  state = {
    open: false,
    serverName: '',
    serverPort: defaultPort,
    mountPath: '',
    customDisplayName: false,
    displayName: '',    // name of mount, as displayed in Files app

    serverNameWarning: false, // warning visualized, in case incorrect chars are used
    type: 'password',   // authentication type, 'password', 'publicKey' or 'keyboard'
    username:'',        // credentials of mount connection
    password: '',       // credentials of mount connection
    privateKey: '',     // credentials of mount connection
    showPassword: false,// whether or not to visualize password 
    keepCredentials: false, // keep credentials locally stored

    favorites: [],      // list of all local stored mount favorites
    isReadyToMakeFavorite: false, // has the user filled sufficient fields to make it a fav
    selectedFavorite: '', // key (string) of favorite. Empty string is no favorite

    isReadyToMount: false, // has the user filled sufficient fields to init connection
    isTryingToMount: false, // is the app  trying to mount a connection
    isMounted: false, // is the form (i.e. the connection) succesfully mounted

    showStatus: false, // is a pop-up status message displayed
    statusMessage: "", // message of pop-up status

    showDialog: false, // is the dialog displayed
    dialogTitle: "", // title of dialog
    dialogMessage: "", // message of dialog
    dialogDetails: [], // optional details of connection

    responseCache: {} // temporary response
  };

  /**
   * componentDidMount is an event handler and invoked by React
   * as soon the component is load. E.g. a React-type of 'onload'
   */
  componentDidMount = () => {
    this.loadLocalStoredMountFavorites();
  };

  /**
   * handleChange validates any value change of all input elements,
   * and stores these changes in the state of the app
   * @param  {String} name  Name of input field, which is equal to tbe state name
   * @param  {String} value Value of the corresponding field
   */
  handleChange = (name, value) => {
    // Validate input characters for serverName and mountPath forms
    if(name === 'serverName') {
      value = value.replace(patterns.uriChars,"");
    }

    // Validate if reserved characters are used in serverName
    if(name === 'serverName' && patterns.nameChars.test(value)) {
      this.setState({serverNameWarning : true});
    } else if(this.state.serverNameWarning) {
      this.setState({serverNameWarning : false});
    }

    // Update default displayName, if custom is disabled and any name has changed
    if(!this.state.customDisplayName && 
      (['serverName', 'username', 'type'].includes(name)) ) {
      this.setDefaultDisplayName({[name] : value});
    }

    // Create new state variable
    let newState = {[name] : value};

    // Check if all required fields are given to mount the share
    const isReadyTo = this.isFormReadyTo(newState, "mount");
    newState.isReadyToMount = isReadyTo.mount;
    newState.isReadyToMakeFavorite = isReadyTo.makeFavorite;

    // If a favorite is shown
    if(this.state.selectedFavorite.length > 0) {

      // and the credentials are changed, while they are not
      // stored in the favorite (because keepCredentials is off)
      if(!this.state.keepCredentials && ['password', 'privateKey'].includes(name)) {
        // then the form is not ready to make a new favorite
        newState.isReadyToMakeFavorite = false;

        // otherwise, the credentials are changed, which could
        // mean a new type of favorite
      } else {
        newState.selectedFavorite = '';
        newState.isReadyToMakeFavorite = true;
      }
    }

    // Update the app's state information
    this.setState(newState);
  };

  /**
   * handleBlur validates serverPort and displayName as soon the user as
   * selected outside these input fields. Portnumber may not be negative, 
   * may not be empty, and my not be not-a-number. The (custom) display name may
   * not be empty.
   * @param  {String} name  Name of the field, e.g. 'serverPort' or 'displayName'
   * @param  {String} value Value of the corresponding field
   */
  handleBlur = (name, value) => {
    if(name === 'serverPort' && (isNaN(value) || value < -1 || value==='')) {
      this.setState({'serverPort' : defaultPort});
    } else if(name === 'displayName' && this.state.customDisplayName && value.length === 0) {
        this.setDefaultDisplayName();
    }
  };

  /**
   * handleCloseStatus closes the status pop-up, when invoked
   */
  handleCloseStatus = () => {
    this.setState({showStatus: false});
  };

  /**
   * onMountButtonClick is invoked by the Mount-button, and creates
   * a mount-request which will be send to 'background.js', which 
   * on his turn triggers SFTP_FS, SFTP_CLIENT...  
   */
  onMountButtonClick = () => {

    this.setState({isTryingToMount: true, showStatus: false});

    timer = setTimeout(this.onShowStatus, 3000, chrome.i18n.getMessage("mountFailTimeout"));

    var request = {
        type: "mount",
        serverName: this.state.serverName,
        serverPort: this.state.serverPort.toString(),
        authType: this.state.type,
        username: this.state.username,
        password: this.state.password,
        privateKey: this.state.privateKey,
        mountPath: "/" + this.state.mountPath,
        displayName: this.state.displayName
    };
    
    // Send the request to 'background.js'
    chrome.runtime.sendMessage(request, this.handleInitialMountResponse);
  };

  /**
   * Triggers the pop-up status message to pop-up, with a specific message
   * @param  {String} message Message which will be shown in the pop-up
   */
  onShowStatus = message => {
    this.setState({
      isTryingToMount: false, 
      statusMessage: message,
      showStatus: true,
    });
  };

  /**
   * handleInitialMountResponese handles the feedback, given by 'background.js',
   * which follows from our initial mount-request, triggered by onMountButtonClick.
   * When 'background.js' could parse our request succesfully, a fingerprint of the
   * host-server will be returned which need to be validated by the user (if not already
   * trusted by the user)
   * @param  {Object} response Response-object, given by 'background.js'
   */
  handleInitialMountResponse = (response) => {
    console.log('view, appcontent, handleresponse');
    console.log(response);
    
    this.setState({responseCache: response}, () => {

      clearTimeout(timer);
      
      // Server responses the request ...
      if (response) {

        // ... by returning the server's fingerprint. 
        // Time to verify its authenticity
        if(response.type === "confirmFingerprint") {

          const {serverName, serverPort} = this.state;

          // Get previously saved, trusted fingerprint of the server
          this.getLocalStoredTrustedFingerprint(serverName, serverPort, prevFingerprint => {

            const details = [{
              key: "host",
              value: response.fileSystemId
            }, {
              key: "algorithm",
              value: response.algorithm
            }, {
              key: "fingerprint",
              value: response.fingerprint
            }];

            // Did we found a previously stored fingerprint?
            if(prevFingerprint) {
              const equalAlgorithm = prevFingerprint.algorithm && prevFingerprint.algorithm === response.algorithm;
              const equalValue = prevFingerprint.value && prevFingerprint.value === response.fingerprint;
              
              // Yes, compare with the current received one
              if(equalAlgorithm && equalValue) {
                // Equal! Just connect
                this.handleConfirmFingerprint(response);
              } else {
                // Differs, ask the user what to do next
                this.setState({
                  dialogTitle: "verifyServerAuthenticityTitle",
                  dialogMessage: "verifyServerAuthenticityDescription",
                  dialogDetails: details,
                  showDialog: true
                });
              }

            // No, no previously stored fingerprint found. Ask user if
            // it trusts the server
            } else {
              this.setState({
                dialogTitle: "confirmServerAuthenticityTitle",
                dialogMessage: "confirmServerAuthenticityDescription",
                dialogDetails: details,
                showDialog: true
              });
            }
          });
        } else if(response.type === "error") {
            let message = chrome.i18n.getMessage("mountFail");
            if(response.error) message += " " + chrome.i18n.getMessage(response.error);

            this.setState({
              isTryingToMount: false, 
              statusMessage: message,
              showStatus: true,
            });
        }
      } else {
          this.setState({
            isTryingToMount: false, 
            statusMessage: chrome.i18n.getMessage("mountFailInternalError"),
            showStatus: true,
          });
      }
    });
  };


  /**
   * handleConfirmFingerprint handles the confirmation, given by the user in the dialog,
   * to trust the fingerprint of the server, and continueing the initiation of the connection
   */
  handleConfirmFingerprint = () => {

    const response = this.state.responseCache;
    const request = {
        type: "accept",
        requestId: response.requestId,
        fileSystemId: response.fileSystemId
    };

    this.setState({
      showDialog: false
    })

    chrome.runtime.sendMessage(request, this.handleConnectionResponse);
  };

  /**
   * handleConnectionResponse handles the response which is received, after the fingerprint
   * of the server is (automatically) confimred. The response can be succesfull, and means
   * a connected mount. When unsuccesfull, a failure will be shown as a status pop-up
   * @param  {Object} response Response-object, given by 'background.js'
   */
  handleConnectionResponse = response => {

    console.log('handleConncectionResponse');
    console.log(response);

    const {serverName, serverPort} = this.state;
    const {algorithm, fingerprint} = this.state.responseCache;

    if(response && response.success) {
        this.storeTrustedFingerprint(serverName, serverPort, algorithm, fingerprint);

        // Display status pop-up that connection is established successfully
        this.setState({
          responseCache: {},
          isTryingToMount: false,
          statusMessage: chrome.i18n.getMessage("mountSuccess"),
          showStatus: true,
          showDialog: false
        });

        // Close the app window, after 2 seconds
        timer = setTimeout(() => window.close(), 2000);
      } else {

        // Display status pop-pu to show that initiation of connection has failed
        this.setState({
          responseCache: {},
          isTryingToMount: false,
          statusMessage: chrome.i18n.getMessage("mountFail"),
          showStatus: true,
          showDialog: false
        });
      }
  };

  /**
   * handleDeclineFingerprint is invoked by the user, when the user declines the 
   * fingerprint of the server. In this case, the dialog is hided and the initiation
   * of the connection is aborted.
   */
  handleDeclineFingerprint = () => {
    const response = this.state.responseCache;

    this.setState({
      showDialog: false
    });

    const request = {
        type: "decline",
        requestId: response.requestId,
        fileSystemId: response.fileSystemId
    };

    chrome.runtime.sendMessage(request, () => {
      this.setState({
        responseCache: {},
        statusMessage: chrome.i18n.getMessage("mountDeclined"),
        isTryingToMount: false,
        showStatus: true,
        showDialog: false
      });
    });
    
  };

  /**
   * loadLocalStoredMountFavorites loads all locally stored connection favorites.
   * These favorites are stored in an Array, named 'mountFavorites', within the 
   * Chrome App environment. The functions loads the Array within the favorites
   * state of the app.
   */
  loadLocalStoredMountFavorites = function() {
      chrome.storage.local.get("mountFavorites", items => {
        const mountFavorites = items.mountFavorites || [];
        this.setState({favorites: mountFavorites});
      });
  };

  /**
   * loadTrustedFingerprints loads all locally stored fingerprints, which are trusted.
   * When the user connected to a specific server, and its fingerprint is confirmed at 
   * that time, this fingerprint will be saved. The fingerprints are stored as an
   * Object within the Chrome App environment
   * @param  {Function} callback Returns an object with fingerprints
   */
  loadTrustedFingerprints = callback => {
    chrome.storage.local.get("fingerprints", function(items) {
        var fingerprints = items.fingerprints || {};
        callback(fingerprints);
    });
  };

  /**
   * getLocalStoredTrustedFingerprint derives a specific fingerprint for a specific 
   * server and of serverport combination. The function derives all fingerprints with
   * help the function 'loadTrustedFingerprints' 
   * @param  {String}   serverName Name of the server
   * @param  {String}   serverPort Port number of server
   * @param  {Function} callback   Fingerprint of server (String)
   */
  getLocalStoredTrustedFingerprint = (serverName, serverPort, callback) => {
    console.log('getLocalStoredFingerprint');
      this.loadTrustedFingerprints(function(fingerprints) {
          var fingerprint = fingerprints[serverName + ":" + serverPort];
          console.log(fingerprint);
          callback(fingerprint);
      });
  };

  /**
   * storeTrustedFingerprint saves a specific fingerprint for a specific server-serverport
   * combination , in the local storage of the Chrome App environment
   * @param  {String}   serverName Name of the server
   * @param  {String}   serverPort Port number of server
   * @param  {String}   algorithm  Algorithm of fingperint
   * @param  {String}   fingerprint Fingerprint itself
   */
  storeTrustedFingerprint = (serverName, serverPort, algorithm, fingerprint) => {
    console.log('storeTrustedFingerprint');
      this.loadTrustedFingerprints(function(fingerprints) {
          fingerprints[serverName + ":" + serverPort] = {
              value: fingerprint,
              algorithm: algorithm
          };
          console.log('fingerprints');
          console.log(fingerprints);
          chrome.storage.local.set({fingerprints: fingerprints});
      });
  };

  /**
   * onToggleDrawer updates the state to open or close the drawer (the menu with
   * favorites). The function is invoked by a UI-button
   */
  onToggleDrawer = () => {
    this.setState({ open: !this.state.open });
  };

  /**
   * onAddFavorite stores the current filled fields as a new mount favorite. The
   * fucntion is invoked by a UI-button
   */
  onAddFavorite = () => {
    this.storeAsFavorite();
    this.setState({open: true});
  };

  /**
   * onShowFavorite shows the saved favorite share in the fields for which
   * the function is invoked (a list item in the drawer)
   * @param  {Object} favorite Favorite-object with all required data
   */
  onShowFavorite = favorite => {
    this.showFavorite(favorite);
  };

  /**
   * onRemoveFavorite removes the saved favorite share for which the function 
   * is invoked (a list item in the drawer)
   * @param  {Object} favorite Favorite-object with all required data
   */
  onRemoveFavorite = favorite => {
    this.removeFavorite(favorite);
  };

  /**
   * onKeepCredentials toggles the setting to store passwords and keyss locally or not
   */
  onToggleKeepCredentials = () => {
    this.setState({keepCredentials: !this.state.keepCredentials});
  };

  /**
   * setDefaultDisplayName sets the display name to a newly created 
   * default display name, based on the latest (not yet updated) states, 
   * gives as the first argument.
   * @param  {Object} opts List of (not yet updated) states
   */
  setDefaultDisplayName = opts => {
    const states = Object.assign(this.state, opts);
    this.setState({displayName: this.createDefaultDisplayName(states)});
  };

  /**
   * createDefaultDisplayName creates a default display name. The
   * display name is the reference to the SFTP mount, as shown in 
   * ChromeOS Files. The markup of the default display name is
   * '<servername> (<username>)'
   * @param  {Object} opts List of (not yet updated) states
   */
  createDefaultDisplayName = opts => {
    const { serverName, serverPort, username, type  } = opts;
    const hasUser = (type === "password" && username.length > 0);
    const hasPort = serverPort !== defaultPort ? ":" + serverPort.toString() : "";
    return serverName.replace(/\/$/, "")
      + hasPort + (hasUser ? " (" + username +  ")" : "");
  };

  /**
   * toggleCustomDisplayName turns the use of a custom display name on
   * or off
   * @param  {Boolean} toggle Turn custom name on or off
   */
  toggleCustomDisplayName = (toggle) => {
    const newToggleState = toggle || !this.state.customDisplayName;
    if(this.state.selectedFavorite.length > 0) this.setState({selectedFavorite: ""});
    this.setState({customDisplayName: newToggleState});
    
    if(!newToggleState) this.setDefaultDisplayName(newToggleState);
  };

  /**
   * storeAsFavorite saves the current completed form fields as a 'favorite'
   * within the favorites-state-array. These favorites can be shown and 
   * requested from the drawer
   */
  storeAsFavorite = () => {
    const { type, username, password, privateKey, keepCredentials } = this.state;

    // Create new object from a set of state properties
    const favorite = (({ serverName, serverPort, mountPath, displayName }) => 
                      ({ serverName, serverPort, mountPath, displayName }))(this.state);

    // Create default values for all authentication methods
    favorite.username = "";
    favorite.password = "";
    favorite.privateKey = "";
    favorite.type = type;

    // Fill only the fields which are used for the mount favorite
    if(type === 'password') {
      favorite.username = username;
      if(keepCredentials) favorite.password = password;
    } else if(keepCredentials && type === 'publicKey') {
      favorite.privateKey = privateKey;    }

    // Add a 'unqiue' key to the favorite, and save to the list
    favorite.key = this.createKey('fav');
    const favorites = [...this.state.favorites, favorite];

    // Update local storage with new list of favorites, and update
    // the UI by updating state information 
    chrome.storage.local.set({mountFavorites: favorites}, () => {
      this.setState({
        favorites: favorites,
        selectedFavorite: favorite.key,
        isReadyToMakeFavorite: false
      });
    });

    
  };

  /**
   * createKey generates a unique identifier. The function is used to 
   * add a unique id for each saved favorite.
   * See: https://gist.github.com/gordonbrander/2230317
   * @param  {String} ref Reference for which the key is created
   * @return {String}     'Unique' id
   */
  createKey = ref => {
    const name = ref || '';
    return name + '_' + Math.random().toString(36).substr(2, 9);
  };

  isFormReadyTo = (opts) => {
    const result = {mount: false, makeFavorite: false};
    const states = Object.assign(this.state, opts);
    const { serverName, username, password, privateKey, type, keepCredentials  } = states;

    const hasServerName = serverName.length > 0;
    if(!hasServerName) return result;

    if(type === 'password') {
      const hasUsername = username.length > 0;
      const hasPassword = password.length > 0;
      if(hasUsername && hasPassword) {
        result.mount = true;
        result.makeFavorite = true;
      } else if(hasUsername && !keepCredentials) {
        result.makeFavorite = true;
      }
    } else if(type === 'publicKey') {
      const hasPublicKey = privateKey.length > 0;
      if(hasPublicKey) {
        result.mount = true;
        result.makeFavorite = true;
      } else if(!keepCredentials) {
        result.makeFavorite = true;
      }
    } else {
      result.makeFavorite = true;
    }

    return result;
  };

  /**
   * showFavorite shows the data of the favorite mount in the 
   * according input fields
   * @param  {Object} favorite Favorite-object with all required data
   */
  showFavorite = (favorite) => {
    // Verify whether credentials are stored
    let hasCredentials = false;  
    if( favorite.type === "password" && 
      favorite.username.length > 0 && favorite.password.length > 0) {
      hasCredentials = true;
    } else if (favorite.type === "publicKey" && favorite.privateKey.length > 0 ) {
      hasCredentials = true;
    }

    // Verify if the display name is custom
    let customDisplayName = false;
    let defaultDisplayName = this.createDefaultDisplayName(favorite);
    if(defaultDisplayName !== favorite.displayName) customDisplayName = true;

    // Update the app state, and focus credential fields (if empty)
    this.setState({...favorite,
              customDisplayName: customDisplayName,
              isReadyToMount: hasCredentials,
              selectedFavorite: favorite.key,
              isReadyToMakeFavorite: false,
             }, () => {
      if(!hasCredentials) {
        if(favorite.type === "password") this.inputPassword.focus();
        else if(favorite.type === "publicKey") this.inputPublicKey.focus();
      }
    });
  };

  /**
   * removeFavorite removes an saved favorite from the list of favorites
   * @param  {Object} favorite Favorite-object which has to be removed
   */
  removeFavorite = (favorite) => {
    let itemIndex = -1;
    this.state.favorites.forEach(function (item, index) {
      if(item.key === favorite.key) itemIndex = index;
    });

    if(this.state.selectedFavorite === favorite.key) {
      this.setState({selectedFavorite: "", isReadyToMakeFavorite: true});
    } 

    if(itemIndex > -1) {
      this.setState({
        favorites: this.state.favorites.filter((_, i) => i !== itemIndex),
      });
    }
  };

  // Render function of the AppContent component
  render() {
    const { classes } = this.props;
    const { open, 
      serverName, serverPort, mountPath, displayName, serverNameWarning,
      type, username, password, privateKey, customDisplayName,
      favorites, isReadyToMakeFavorite, selectedFavorite, 
      keepCredentials, focusCredentials,
      isReadyToMount, isTryingToMount,
      showStatus, statusMessage } = this.state;

    return (
      <div className={classes.appFrame}>
        <AppBar
          className={classNames(classes.appBar, {
            [classes.appBarShift]: open,
          })}>
          <Toolbar>
            <AppIcon className={classes.appIcon} />
            <Typography variant="title" className={classes.flex} color="inherit" noWrap>
             {chrome.i18n.getMessage("appName")}
            </Typography>

            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={this.onToggleDrawer}
              className={classNames(classes.menuButton, open && classes.hide)}>
              <MoreVertIcon me/>
            </IconButton>
          </Toolbar>
        </AppBar>

        <form className={classNames(classes.content, { [classes.contentShift] : open })} onSubmit={this.onMountButtonClick}>
          <section id="form-server" className={classes.contentItem}>
            <ServerForm 
              serverName={serverName}
              serverNameWarning={serverNameWarning}
              serverPort={serverPort}
              mountPath={mountPath}
              customDisplayName={customDisplayName}
              displayName={displayName}
              onFieldChange={this.handleChange}
              onFieldBlur={this.handleBlur}
              toggleDisplayName={this.toggleCustomDisplayName}
              spacing={gridspacing}
            />
          </section>
          <section id="form-auth" className={classes.contentItem}>
            <AuthForm
              username={username}
              password={password}
              privateKey={privateKey}
              type={type}
              onFieldChange={this.handleChange}
              refPassword={el => this.inputPassword = el}
              refPublicKey={el => this.inputPublicKey = el}
              spacing={gridspacing}
            />
          </section>
          <section id="form-confirm" className={classNames(classes.contentItem, classes.fixedBottom)}>
            <ConfirmForm
              canMakeFavorite={isReadyToMakeFavorite}
              canMount={isReadyToMount}
              isTryingToMount={isTryingToMount}
              onMount={this.onMountButtonClick}
              onAddFavorite={this.onAddFavorite}
              icon={<BookmarkIcon/>}
              spacing={gridspacing}
            />
          </section>
        </form>
        <DrawerLists
          open={open}
          favorites={favorites}
          keepCredentials={keepCredentials}
          selectedFavorite={selectedFavorite}
          onToggleDrawer={this.onToggleDrawer}
          onShowFavorite={this.onShowFavorite}
          onRemoveFavorite={this.onRemoveFavorite}
          onToggleKeepCredentials={this.onToggleKeepCredentials}
        />

        <SnackbarInformer
          message={statusMessage}
          show={showStatus}
          handleClose={this.handleCloseStatus}
        />
        
        <ConfirmDialog 
          title={this.state.dialogTitle}
          message={this.state.dialogMessage}
          details={this.state.dialogDetails}
          show={this.state.showDialog} 
          onDecline={this.handleDeclineFingerprint}
          onConfirm={this.handleConfirmFingerprint}
        />
      </div>
    );
  }
}

AppContent.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(AppContent)