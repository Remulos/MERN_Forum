import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const sidebar = props => {
	let sidebarClasses = ['sidebar', 'sidebar-nav'];

	if (props.show) {
		sidebarClasses = ['sidebar', 'sidebar-nav', 'open'];
	}

	return (
		<nav className={sidebarClasses.join(' ')}>
			<ul>
				<li>
					<a href="/">Home</a>
				</li>
				<li>
					<a href="/">Wiki</a>
				</li>
				<li>
					<a href="/">
						<FontAwesomeIcon icon="bell" className="fa__icon" />
					</a>
				</li>
				<li>
					<a href="/">
						<FontAwesomeIcon icon="envelope" className="fa__icon" />
					</a>
				</li>
			</ul>
		</nav>
	);
};

export default sidebar;
