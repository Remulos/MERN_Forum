import './CSS/main.css';
import React, { Component } from 'react';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Navbar/Sidebar';
import Backdrop from './components/Backdrop';
import ProfileBar from './components/ProfileBar';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
	faBell,
	faEnvelope,
	faPlus,
	faBars,
	faUser,
} from '@fortawesome/free-solid-svg-icons';

library.add(faBell, faEnvelope, faPlus, faBars, faUser);

class App extends Component {
	state = {
		theme: 'theme-light',
		sidebarOpen: false,
		profileBarOpen: false,
	};

	componentWillMount() {
		document.body.classList.add(this.state.theme);
	}

	sidebarToggleHandler = () =>
		this.setState(prevState => {
			return { sidebarOpen: !prevState.sidebarOpen };
		});

	profileBarToggleHandler = () =>
		this.setState(prevState => {
			return { profileBarOpen: !prevState.profileBarOpen };
		});

	backdropClickHandler = () => {
		this.setState({ sidebarOpen: false });
		this.setState({ profileBarOpen: false });
	};

	render() {
		let backdrop;

		if (this.state.sidebarOpen) {
			backdrop = <Backdrop click={this.backdropClickHandler} />;
		}
		if (this.state.profileBarOpen) {
			backdrop = <Backdrop click={this.backdropClickHandler} />;
		}

		return (
			<div className="App">
				<Navbar
					sidebarToggle={this.sidebarToggleHandler}
					profileToggle={this.profileBarToggleHandler}
				/>
				<Sidebar show={this.state.sidebarOpen} />
				<ProfileBar show={this.state.profileBarOpen} />
				{backdrop}
			</div>
		);
	}
}

export default App;
