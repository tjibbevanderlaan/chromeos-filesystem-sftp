import React from 'react';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton'
import ClearIcon from '@material-ui/icons/Clear';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  frame: {
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-start',
  },
  ellipsis: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  selected: {
    backgroundColor: theme.palette.action.selected
  }
});

class FavoritesItem extends React.Component {
  render() {
    const { classes, favorite, selected=false,
            onShowFavorite, onRemoveFavorite } = this.props;

    //
    const mountInfo = splitMountPath(favorite);    
    const descriptor = (
      <span className={classes.frame}>
        <span className={classes.ellipsis}>{mountInfo[0]}</span>
        <span>{mountInfo[1]}</span>
      </span>
    );

    return (
      <ListItem 
        className={selected ? classes.selected : null}
        button dense
        onClick={() => onShowFavorite(favorite)}>
        <ListItemText
          primary={favorite.displayName}
          secondary={descriptor}
          />
          <ListItemSecondaryAction>
            <IconButton 
              onClick={() => onRemoveFavorite(favorite)}
              aria-label="Remove">
              <ClearIcon />
            </IconButton>
          </ListItemSecondaryAction>
      </ListItem>
    );
  }
}

/**
 * splitMountPath combines serverName and mountPath in one overall
 * string. The last segment of the path is seperated, to improve
 * path visualization in the UI in case of long strings. For example:
 * 192.168.2.11/this/directory/is/really/deep. The function will break
 * this string down to:
 * segmentA: '192.168.2.11/this/directory/is/really'
 * segmentB: 'deep'
 * @param  {Object} opts Favorite-object with all required data
 * @return {Array}       Array with segmentA and B respectively
 */
function splitMountPath(opts) {
  const {serverName, serverPort, mountPath } = opts;
  const re = /([^\\/]+)[\\/]*$/g;
  const result = re.exec(mountPath);
  const slash = (mountPath.indexOf("\\") > -1) ? "\\" : "/";
  let start = serverName + ":" + serverPort.toString() + slash;
  let end = "";

  if(result && result[1]) {
    start = start + mountPath.slice(0,result.index-1);
    end = slash + result[1];
  }

  return [start, end];
}

FavoritesItem.propTypes = {
  classes: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  favorite: PropTypes.object.isRequired,
  onShowFavorite: PropTypes.func.isRequired,
  onRemoveFavorite: PropTypes.func.isRequired,
};

export default withStyles(styles)(FavoritesItem);