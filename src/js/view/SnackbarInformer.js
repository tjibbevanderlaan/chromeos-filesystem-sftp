import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import Button from 'material-ui/Button';
import Snackbar from 'material-ui/Snackbar';
import IconButton from 'material-ui/IconButton';
import CloseIcon from 'material-ui-icons/Close';
import Mark from 'react-mark-ii';

const styles = theme => ({
  close: {
    width: theme.spacing.unit * 4,
    height: theme.spacing.unit * 4,
  },
  code: {
    borderRadius: '3px',
    padding: '0.2em 0.4em',
    // color is theme.pallete.secondary.main with 0.12 opacity
    backgroundColor: 'rgba(255, 152, 0, 0.12)',
    color: theme.palette.secondary.main
  }
});

class SnackbarInformer extends React.Component {
  render() {
    const {classes, show=false, onClose, undoAction, message=""} = this.props;
    const options = {
        '*': {renderer: 'b'},
        '`': {renderer: ({children}) => <span className={classes.code}>{children}</span>}
    };
    const actions = [
      <IconButton
        key="close"
        aria-label="Close"
        color="inherit"
        className={classes.close}
        onClick={onClose}
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
        onClose={onClose}
        SnackbarContentProps={{
          'aria-describedby': 'message-id',
        }}
        message={<Mark options={options} wrap="span">{message}</Mark>}
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
  onClose: PropTypes.func.isRequired
};

export default withStyles(styles, { withTheme: true })(SnackbarInformer);