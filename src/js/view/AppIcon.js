import React from 'react';
import SvgIcon from '@material-ui/core/SvgIcon';

const AppIcon = props => {
  const { className } = props;
  return (
  	<SvgIcon viewBox="0 0 32 32" titleAccess="AppIcon" className={className}>
  	<path d=" M 27 6 L 16 6 L 13 3 L 5 3 C 3.3 3 2 4.3 2 6 L 2 24 C 2 25.7 3.3 27 5 27 L 27 27 C 28.7 27 30 25.7 30 24 L 30 9 C 30 7.3 28.7 6 27 6 Z  M 24 13 L 21 13 L 21 17 L 19 17 L 19 13 L 16 13 L 20 8 L 24 13 Z  M 9 24 C 6.8 24 5 22.2 5 20 C 5 18.7 5.6 17.6 6.5 16.9 C 6.2 16.3 6 15.7 6 15 C 6 12.8 7.8 11 10 11 C 10.1 11 10.3 11 10.4 11 C 11.2 9.2 12.9 8 15 8 C 15.6 8 16.2 8.1 16.7 8.3 L 16 9.1 C 15.7 9.1 15.4 9 15 9 C 13.1 9 11.4 10.4 11.1 12.2 C 10.7 12.1 10.4 12 10 12 C 8.3 12 7 13.3 7 15 C 7 15.9 7.4 16.6 8 17.2 C 6.9 17.6 6 18.7 6 20 C 6 21.7 7.3 23 9 23 L 21.2 23 L 22 24 L 9 24 Z  M 25 24 L 21 19 L 24 19 L 24 15 L 26 15 L 26 19 L 29 19 L 25 24 Z "/>
	</SvgIcon>
  	);
};

export default AppIcon;