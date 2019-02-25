import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import InputAdornment from '@material-ui/core/InputAdornment';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

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

    let pkey;
    if(type !== "password") pkey = (
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

    return (
      <Grid container spacing={spacing}>
        
        <Grid item xs={12} sm={6}>
          <TextField
            id="username"
            label={chrome.i18n.getMessage("username")}
            value={username}
            onChange={this.handleChange('username')}
            className={classes.textField}
            fullWidth={true}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
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
              <MenuItem value="publickey">{chrome.i18n.getMessage("authTypePublicKey")}</MenuItem>
              <MenuItem value="keyboard-interactive">{chrome.i18n.getMessage("authTypeKeyboardInteractive")}</MenuItem>
            </Select>
            <FormHelperText>
              {chrome.i18n.getMessage("authTypeDescription")}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          {pkey}
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
            <FormHelperText id="password-helper-text">{chrome.i18n.getMessage("passwordDescription")}</FormHelperText>
          </FormControl>
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