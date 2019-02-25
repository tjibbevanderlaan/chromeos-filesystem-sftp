import React from 'react';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Mark from 'react-mark-ii';

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
    paddingRight: theme.spacing.unit*2,
    color: theme.palette.text.primary,
    textTransform: 'capitalize',
    verticalAlign: 'top'
  }, 
  chunk: {
    width: '1.8em',
    display: 'inline-block'
  }
});



class ConfirmDialog extends React.Component {

  render() {
    const {classes, show, title="", message="", details, onDecline, onConfirm} = this.props;
    const options = {
        '__': {renderer: ({children}) => <span className={classes.underline}>{children}</span>},
    };

    // Generate optional details information table
    let dataTable = "";
    let dataItems = [];
    if(details && details.length > 0) {
      dataItems = details.map((item, index) =>
        // Add a row to the table for each item key
        <tr key={item.key + "-" + index}>
          <td className={classes.head}>{chrome.i18n.getMessage(item.key)}</td>
          <td>
            <Mark options={options} wrap="span">
            {
              // Add additional mark-up to the key of the fingerprint
              // e.g. transform b12d3367ce354d5ff3a8cdc0c4488612 to a 
              // more readable chunked key: b1 2d d3 36 7c ....
              item.key === "fingerprint" ? chopStringInPairs(item.value) : item.value
            }
            </Mark>
          </td>
        </tr>
      );
      dataTable = (
        <table className={classes.datatable}>
          <tbody>
          {dataItems}
          </tbody>
        </table>
      );
    }


    function chopStringInPairs(str) {
      let pairs = [];
      for(var i = 0; i < str.length; i += 2) {
        const pairstr = str[i] + (str[i+1] ? str[i+1] : "");
        pairs.push(<span key={i} className={classes.chunk}>{pairstr}</span>);
      }
      return pairs;
    }


    return (
      <Dialog
        open={show}
        onClose={onDecline}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{chrome.i18n.getMessage(title)}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <Mark options={options} wrap="span">{chrome.i18n.getMessage(message)}</Mark>
          </DialogContentText>
            {dataTable}
        </DialogContent>
        <DialogActions>
          <Button id="decline" onClick={onDecline} color="primary" autoFocus>
            {chrome.i18n.getMessage("decline")}
          </Button>
          <Button id="confirm" onClick={onConfirm} color="primary">
            {chrome.i18n.getMessage("confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

export default withStyles(styles, { withTheme: true })(ConfirmDialog);