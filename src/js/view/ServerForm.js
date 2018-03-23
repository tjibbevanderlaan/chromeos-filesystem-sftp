import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import Grid from 'material-ui/Grid';
import TextField from 'material-ui/TextField';
import Input, { InputLabel, InputAdornment } from 'material-ui/Input';
import { FormControl, FormHelperText } from 'material-ui/Form';
import IconButton from 'material-ui/IconButton';
import ActiveIcon from 'material-ui-icons/CheckBox';
import InactiveIcon from 'material-ui-icons/CheckBoxOutlineBlank';

const patterns = {
  uriChars: /[^a-z0-9{}|\\^[\]`;/?:@&=+$,%-._~]/i,
  nameChars: /[^a-z0-9-._~]/i
};

const styles = ({
  adornment: {
    whiteSpace: 'nowrap',
    marginRight: 0,
  },
  checkboxIcon: {
    width: 'inherit'
  }
});

class ServerForm extends React.Component {
  handleChange = prop => event => {
    this.props.onFieldChange(prop, event.target.value);
  };

  handleBlur = prop => event => {
    this.props.onFieldBlur(prop, event.target.value);
  };

  handleOnKeyPressServerName = event => {
    if(patterns.uriChars.test(event.key)) 
      event.preventDefault();
  };

  handleMouseDownDisplayName = event => {
    event.preventDefault();
  };

  handleCustomDisplayName = () => {
    this.props.toggleDisplayName();
  };

  render() {
    const { classes, serverName, serverPort=22, mountPath, displayName, serverNameWarning=false,
            customDisplayName, spacing = 24 } = this.props;

    return (
      <Grid container spacing={spacing}>
        <Grid item xs={12} sm={8}>
          <TextField
            id="serverName"
            label={chrome.i18n.getMessage("serverName")}
            className={classes.textField}
            helperText={chrome.i18n.getMessage("serverNameDescription")}
            fullWidth={true}
            autoFocus={true}
            margin="dense"
            value={serverName}
            onChange={this.handleChange('serverName')}
            inputProps={{onKeyPress:this.handleOnKeyPressServerName}}
            error={serverNameWarning}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            id="serverPort"
            label={chrome.i18n.getMessage("serverPort")}
            type="number"
            className={classes.textField}
            value={serverPort}
            onChange={this.handleChange('serverPort')}
            onBlur={this.handleBlur('serverPort')}
            InputLabelProps={{shrink: true}}
            margin="dense"
            fullWidth={true}
          />
        </Grid>

        <Grid item xs={12} sm={12}>
          <FormControl fullWidth className={classes.formControl}>
            <InputLabel htmlFor="mount" shrink={true}>{chrome.i18n.getMessage("mountPath")}</InputLabel>
            <Input
              id="mountPath"
              value={mountPath}
              onChange={this.handleChange('mountPath')}
              startAdornment={serverName && serverName.length > 0 ? 
                <InputAdornment classes={{root:classes.adornment}} position="start">
                {serverName.replace(/\/$/, "")+":" + serverPort + "/"}</InputAdornment> : null}
            />
            <FormHelperText>{chrome.i18n.getMessage("mountPathDescription")}</FormHelperText>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={12}>
          <FormControl fullWidth className={classes.formControl}>
            <InputLabel htmlFor="amount">{chrome.i18n.getMessage("displayName")}</InputLabel>
            <Input
              id="adornment-amount"
              value={displayName}
              onChange={this.handleChange('displayName')}
              onBlur={this.handleBlur('displayName')}
              disabled={!customDisplayName}
              startAdornment={
              <InputAdornment position="start">
                <IconButton
                  classes={{root:classes.checkboxIcon}} 
                  onClick={this.handleCustomDisplayName}
                  onMouseDown={this.handleMouseDownDisplayName}
                >
                  {customDisplayName ? <ActiveIcon /> : <InactiveIcon />}
                </IconButton>
              </InputAdornment>}
            />
            <FormHelperText>{chrome.i18n.getMessage("displayNameDescription")}</FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
    );
  }
}

ServerForm.propTypes = {
  classes: PropTypes.object.isRequired,
  spacing: PropTypes.number,
  serverName: PropTypes.string.isRequired,
  serverNameWarning: PropTypes.bool,
  serverPort: PropTypes.number,
  mountPath: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired,
  customDisplayName: PropTypes.bool.isRequired,
  toggleDisplayName: PropTypes.func.isRequired,
  onFieldChange: PropTypes.func.isRequired,
  onFieldBlur: PropTypes.func.isRequired
};

export default withStyles(styles)(ServerForm);