import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Toggler from '../Toggler';

const navbar = props => (
	<header className="nav">
		<nav className="navbar">
			<div className="navbar__brand">
				<a href="/">LOGO</a>
			</div>
			<div className="spacer" />
			<Toggler
				icon="bars"
				class="navbar__toggler nav-toggle"
				click={props.sidebarToggle}
			/>
			<div className="navbar__items">
				<ul>
					<li>
						<a href="/">Home</a>
					</li>
					<li>
						<a href="/">Wiki</a>
					</li>
					<li>
						<Toggler
							icon="user"
							class="navbar__toggler profile-bar"
							click={props.profileToggle}
						/>
					</li>
				</ul>
			</div>
		</nav>
	</header>
);

export default navbar;
