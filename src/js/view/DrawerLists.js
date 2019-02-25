import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton'
import List from '@material-ui/core/List';
import ListSubheader from '@material-ui/core/ListSubheader';
import FavoritesItem from './FavoritesItem';
import ChevronLeftIcon from '@material-ui/icons/ChevronRight';
import Divider from '@material-ui/core/Divider';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Switch from '@material-ui/core/Switch';

const drawerWidth = 240;

const styles = theme => ({
  drawerPaper: {
    position: 'relative',
    height: '100%',
    width: drawerWidth,
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar,
  },
  list: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
  },
  nested: {
    paddingLeft: theme.spacing.unit * 4,
  },
  hide: {
    visibility: 'hidden',
  }
});

class FavoritesList extends React.Component {

  render() {
    const { classes, favorites, open, selectedFavorite='', keepCredentials=false,
            onToggleDrawer, onShowFavorite, onRemoveFavorite, onToggleKeepCredentials } = this.props;

    // Generate list items, based on the items within
    // the favorites array in the state of the main app
    const items = favorites.map((favorite) =>
      <FavoritesItem 
        key={favorite.key}
        favorite={favorite}
        selected={selectedFavorite===favorite.key}
        onShowFavorite={onShowFavorite}
        onRemoveFavorite={onRemoveFavorite}
      />
    );

    const noItems = (
      <ListItem dense disabled>
        <ListItemText primary={chrome.i18n.getMessage("noFavorites")} />
      </ListItem>
    );
    
    return (
      <Drawer
        variant="persistent"
        anchor="right"
        className={classNames(!open && classes.hide)}
        classes={{
          paper: classes.drawerPaper,
        }}
        open={open}>
        <div className={classes.drawerInner}>
          <div className={classes.drawerHeader}>
            <IconButton onClick={onToggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </div>

          <Divider />

          <div className={classes.list}>
            <List
              component="nav"
              subheader={<ListSubheader component="div">{chrome.i18n.getMessage("favorites")}</ListSubheader>}>
              {items.length > 0 ? items : noItems}
            </List>
            <List 
              component="nav"
              subheader={<ListSubheader component="div">{chrome.i18n.getMessage("settings")}</ListSubheader>}>
              <ListItem dense>
                <ListItemText primary={chrome.i18n.getMessage("storeCredentials")} />
                <ListItemSecondaryAction>
                  <Switch
                    onClick={onToggleKeepCredentials}
                    checked={keepCredentials}
                  />
                </ListItemSecondaryAction>
              </ListItem>

            </List>


          </div>
        </div>
      </Drawer>
    );
  }
}

FavoritesList.propTypes = {
  classes: PropTypes.object.isRequired,
  favorites: PropTypes.array.isRequired,
  open: PropTypes.bool.isRequired,
  selectedFavorite: PropTypes.string,
  keepCredentials: PropTypes.bool,
  onToggleDrawer: PropTypes.func.isRequired,
  onShowFavorite: PropTypes.func.isRequired,
  onRemoveFavorite: PropTypes.func.isRequired,
  onToggleKeepCredentials: PropTypes.func.isRequired
};

export default withStyles(styles)(FavoritesList);