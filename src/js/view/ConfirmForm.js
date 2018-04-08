import React from 'react';
import PropTypes from 'prop-types';
import Grid from 'material-ui/Grid';
import Button from 'material-ui/Button';
import { withStyles } from 'material-ui/styles';
import { CircularProgress } from 'material-ui/Progress';

const styles = theme => ({
  wrapper: {
    position: 'relative',
  },
  buttonProgress: {
    color: theme.palette.secondary.main,
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
  shade: {
    backgroundColor: 'rgba(255,255,255,0.8)'
  }
});

class ConfirmForm extends React.Component {

  render() {
    const {classes, spacing=24, canMakeFavorite=false, canMount=false, isTryingToMount=false, icon="", refMount} = this.props;

    return (
      <Grid container classes={classes.shade} justify="flex-end" spacing={spacing}>
        <Grid item>
          <Button 
            size="small" 
            disabled={!canMakeFavorite}
            onClick={this.props.onAddFavorite}>
            {icon}
            {chrome.i18n.getMessage("favorite")}
          </Button>
        </Grid>
        <Grid item>
          <div className={classes.wrapper}>
            <Button 
              buttonRef={refMount}
              variant="raised" 
              size="large" 
              color="primary" 
              disabled={!canMount || isTryingToMount}
              type="submit"
              onClick={this.props.onMount}>
              {chrome.i18n.getMessage("mount")}
            </Button>
            {isTryingToMount && <CircularProgress size={24} className={classes.buttonProgress} />}
          </div>
        </Grid>
      </Grid>
    );
  }
}

ConfirmForm.propTypes = {
  classes: PropTypes.object.isRequired,
  spacing: PropTypes.number,
  type: PropTypes.string,
  canMount: PropTypes.bool,
  canMakeFavorite: PropTypes.bool,
  isTryingToMount: PropTypes.bool,
  icon: PropTypes.element,
  onMount: PropTypes.func.isRequired,
  onAddFavorite: PropTypes.func.isRequired,
  refMount: PropTypes.func.isRequired,
};

export default withStyles(styles, { withTheme: true })(ConfirmForm);