import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import Grid from 'material-ui/Grid';
import TextField from 'material-ui/TextField';
import Input, { InputLabel, InputAdornment } from 'material-ui/Input';
import { FormControl, FormHelperText } from 'material-ui/Form';
import Select from 'material-ui/Select';
import { MenuItem } from 'material-ui/Menu';
import IconButton from 'material-ui/IconButton';
import Visibility from 'material-ui-icons/Visibility';
import VisibilityOff from 'material-ui-icons/VisibilityOff';

const styles = ({
  hidePassword: {
    display: 'none',
  }
});

class AuthForm extends React.Component {
  state = {
    showPassword: false
  };

  handleChange = prop => event => {
    this.props.onFieldChange(prop, event.target.value);
  };

  handleMouseDownPassword = event => {
    event.preventDefault();
  };

  handleClickShowPasssword = () => {
    this.setState({ showPassword: !this.state.showPassword });
  };

  render() {
    const { classes, spacing=24,
            type="password", username="", password="", privateKey="", refPassword, refPublicKey} = this.props;

    const passwordForm = (
      <Grid container spacing={spacing}>
        <Grid item xs={12} sm={6}>
          <TextField
            id="username"
            label={chrome.i18n.getMessage("username")}
            value={username}
            onChange={this.handleChange('username')}
            disabled={type!=='password'}
            className={classes.textField}
            helperText={chrome.i18n.getMessage("usernameDescription")}
            fullWidth={true}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
        <FormControl fullWidth={true}>
          <InputLabel htmlFor="password">{chrome.i18n.getMessage("password")}</InputLabel>
          <Input
            inputRef={refPassword}
            id="password"
            type={this.state.showPassword ? 'text' : 'password'}
            value={password}
            onChange={this.handleChange('password')}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  onClick={this.handleClickShowPasssword}
                  onMouseDown={this.handleMouseDownPassword}
                >
                  {this.state.showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
          />
        </FormControl>
        </Grid>
      </Grid>
    );

    const privateKeyForm = (
      <TextField
        inputRef={refPublicKey}
        id="privateKey"
        label={chrome.i18n.getMessage("privateKey")}
        value={privateKey}
        onChange={this.handleChange('privateKey')}
        className={classes.textField}
        fullWidth={true}
        multiline={true}
        rows={4}
      />
    );

    let form = null;
    if(type === 'password') form = passwordForm;
    if(type === 'publicKey') form = privateKeyForm;

    return (
      <Grid container spacing={this.props.spacing}>
        
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth={true}>
            <InputLabel htmlFor="authmethod">{chrome.i18n.getMessage("authType")}</InputLabel>
            <Select
              value={type}
              onChange={this.handleChange('type')}
              inputProps={{
                name: 'authmethod',
                id: 'authmethod',
              }}
            >
              <MenuItem value="password">{chrome.i18n.getMessage("authTypePassword")}</MenuItem>
              <MenuItem value="publicKey">{chrome.i18n.getMessage("authTypePublicKey")}</MenuItem>
              <MenuItem value="keyboard">{chrome.i18n.getMessage("authTypeKeyboardInteractive")}</MenuItem>
            </Select>
            <FormHelperText>
              {chrome.i18n.getMessage("authTypeDescription")}
            </FormHelperText>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={8}>
          {form}
        </Grid>
      </Grid>
    );
  }
}

AuthForm.propTypes = {
  classes: PropTypes.object.isRequired,
  spacing: PropTypes.number,
  type: PropTypes.string,
  username: PropTypes.string,
  password: PropTypes.string,
  privateKey: PropTypes.string,
  onFieldChange: PropTypes.func.isRequired,
  refPassword: PropTypes.func.isRequired,
  refPublicKey: PropTypes.func.isRequired,
};

export default withStyles(styles)(AuthForm);