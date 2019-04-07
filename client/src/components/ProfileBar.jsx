import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const profileBar = props => {
	let profileBarClasses = ['sidenav-profile', 'sidenav'];

	if (props.show) {
		profileBarClasses = ['sidebar-profile', 'sidebar', 'open'];
	}

	return (
		<nav className={profileBarClasses.join(' ')}>
			<div className="sidebar-nav-profile" />
			<div className="navbar__items">
				<div className="notification-icons">
					<a href="/">
						<FontAwesomeIcon icon="bell" className="fa__icon" />
					</a>
					<a href="/">
						<FontAwesomeIcon icon="envelope" className="fa__icon" />
					</a>
				</div>
				<ul>
					<li>
						<a href="/">Home</a>
					</li>
					<li>
						<a href="/">Wiki</a>
					</li>
					<li>
						<a href="/">link 3</a>
					</li>
					<li>
						<a href="/">link 4</a>
					</li>
				</ul>
			</div>
		</nav>
	);
};

export default profileBar;
