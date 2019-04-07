import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Toggler = props => (
	<FontAwesomeIcon
		icon={props.icon}
		className={props.class}
		onClick={props.click}
	/>
);

export default Toggler;
