import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import Button from 'material-ui/Button';
import Snackbar from 'material-ui/Snackbar';
import IconButton from 'material-ui/IconButton';
import CloseIcon from 'material-ui-icons/Close';

const styles = theme => ({
  close: {
    width: theme.spacing.unit * 4,
    height: theme.spacing.unit * 4,
  },
});

class SnackbarInformer extends React.Component {
  render() {
    const {classes, show=false, handleClose, undoAction, message=""} = this.props;

    const actions = [
      <IconButton
        key="close"
        aria-label="Close"
        color="inherit"
        className={classes.close}
        onClick={handleClose}
      >
      <CloseIcon />
    </IconButton>];

    if(undoAction) {
      actions.unshift(
        <Button key="undo" color="secondary" size="small" onClick={undoAction}>
          UNDO
        </Button>);
    }

    return (
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        open={show}
        autoHideDuration={6000}
        onClose={handleClose}
        SnackbarContentProps={{
          'aria-describedby': 'message-id',
        }}
        message={<span id="message-id">{message}</span>}
        action={actions}
      />
    );
  }
}

SnackbarInformer.propTypes = {
  classes: PropTypes.object.isRequired,
  message: PropTypes.string,
  undoAction: PropTypes.func,
  show: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired
};

export default withStyles(styles, { withTheme: true })(SnackbarInformer);