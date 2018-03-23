import React from 'react';
import Button from 'material-ui/Button';
import { withStyles } from 'material-ui/styles';
import Mark from 'react-mark-ii';

import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog';

const styles = theme => ({
  underline: {
    textDecoration: 'underline',
    textUnderlinePosition: 'under'
  },
  datatable: {
    paddingTop: theme.spacing.unit,
    borderSpacing: '0px',
    color: theme.palette.text.secondary,
  },
  head: {
    paddingRight: theme.spacing.unit,
    color: theme.palette.text.primary,
  }
});



class AlertDialog extends React.Component {

  render() {
    const {classes, show, title, message="", onDecline, onConfirm} = this.props;
    const options = {
        '__': {renderer: ({children}) => <span className={classes.underline}>{children}</span>},
    };


    const text = "Please confirm the authenticity of the host by manually verifying the fingerprint. Press __Confirm__ to add the host to the list of trusted hosts and establish the connection. Hit __Decline__ in case of a fingerprint mismatch.";

    return (
      <Dialog
        open={show}
        onClose={onDecline}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Verify host authenticity</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <Mark options={options} wrap="span">{text}</Mark>
          </DialogContentText>

            <table className={classes.datatable}>
              <tbody>
                <tr><td className={classes.head}>Host</td><td>NetworkDrive (1023.123.123)</td></tr>
                <tr><td className={classes.head}>Fingerprint</td><td>12:23:23:234:34:34: (RSA)</td></tr>
              </tbody>
            </table>
        </DialogContent>
        <DialogActions>
          <Button id="decline" onClick={onDecline} color="primary">
            Decline
          </Button>
          <Button id="confirm" onClick={onConfirm} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

export default withStyles(styles, { withTheme: true })(AlertDialog);