const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');

// Load User model to use in mongoose
const User = require('../../models/User');
const Profile = require('../../models/Profile');

// @route   GET /user/test
// @desc    Test route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'success' }));

// @route   POST /user/register
// @desc    Register new user
// @access  Public
router.post('/register', (req, res) => {
	const errors = {};

	// Search existing users by email to see if account already exists
	User.findOne({ email: req.body.email }).then(user => {
		// If that account already exists, return an error message
		if (user) {
			errors.email = 'An account with this email already exists';
			res.status(400).json(errors);
		} else {
			User.findOne({ handle: req.body.handle }).then(user => {
				// If a user doesn't already exist, populate a new object with request field data
				if (user) {
					errors.handle = 'This handle is not available';
					res.status(400).json(errors);
				}
				const newUser = new User({
					name: req.body.name,
					handle: req.body.handle,
					email: req.body.email,
					password: req.body.password,
					date: req.body.date,
					dob: req.body.dob,
					timezone: req.body.timezone,
				});

				// First generate the salt with a callback function
				bcrypt.genSalt(10, (err, salt) => {
					// Inside the call back function hash the new users password
					bcrypt.hash(newUser.password, salt, (err, hash) => {
						if (err) throw err;
						// Change the new users password to the new hash string
						newUser.password = hash;

						// Save the whole new user object to MongoDB and return it as json
						// p.s. .save() is a mongoose function
						newUser
							.save()
							.then(user => {
								const newProfile = new Profile({
									user: user.id,
								});
								newProfile.save().then(res.json(user));
							})
							.catch(err => console.log(err));
					});
				});
			});
		}
	});
});

// @route   POST /user/login
// @desc    Log in existing user
// @access  Public
router.post('/login', (req, res) => {
	const errors = {};

	const email = req.body.email;
	const password = req.body.password;

	User.findOne({ email }).then(user => {
		// Check to see if email address matched existing user
		if (!user) {
			errors.noemail = 'There is no account using this address';
			res.status(404).json(errors);
		}

		// use bcrypt to compare the login password with the stored and hashed user password
		bcrypt
			.compare(password, user.password)
			.then(isMatch => {
				if (isMatch) {
					// Create jwt payload
					const payload = {
						id: user.id,
						name: user.name,
					};

					// Sign token
					jwt.sign(
						payload,
						keys.secretOrKey,
						{ expiresIn: '12h' },
						(err, token) => {
							res.json({
								success: true,
								token: 'Bearer ' + token,
							});
						}
					);
				} else {
					errors.password = 'Incorrect password';
					res.status(404).json(errors);
				}
			})
			.catch(err => console.log(err));
	});
});

// @route   GET /user/account
// @desc    Get user account settings
// @access  Private
router.get(
	'/account',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		User.findById(req.user.id)
			.then(user => {
				if (!user) {
					errors.nouser = 'Account settings not found.';
					res.status(400).json(errors);
				}
				res.json({ user });
			})
			.catch(err => res.status(404).json(err));
	}
);

// @route   POST /user/account/edit
// @desc    Edit user model values
// @access  Private
router.post(
	'/account/edit',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const accountSettings = {};
		if (req.body.name) accountSettings.name = req.body.name;
		if (req.body.handle) accountSettings.handle = req.body.handle;
		if (req.body.email) accountSettings.email = req.body.email;
		if (req.body.dob) accountSettings.dob = req.body.dob;
		if (req.body.timezone) accountSettings.timezone = req.body.timezone;
		if (req.body.signature) accountSettings.signature = req.body.signature;

		accountSettings.preferences = {};
		if (req.body.newsletter)
			accountSettings.preferences.newsletter = req.body.newsletter;
		if (req.body.autofollowpost)
			accountSettings.preferences.autofollowpost =
				req.body.autofollowpost;
		if (req.body.autofollowreply)
			accountSettings.preferences.autofollowreply =
				req.body.autofollowreply;
		if (req.body.shownotificationpopup)
			accountSettings.preferences.shownotificationpopup =
				req.body.shownotificationpopup;
		if (req.body.singleemailbetweenvisit)
			accountSettings.preferences.singleemailbetweenvisit =
				req.body.singleemailbetweenvisit;
		if (req.body.playnotificationsound)
			accountSettings.preferences.playnotificationsound =
				req.body.playnotificationsound;
		if (req.body.receivemessage)
			accountSettings.preferences.receivemessage =
				req.body.receivemessage;
		if (req.body.addedtoconvo)
			accountSettings.preferences.addedtoconvo = req.body.addedtoconvo;
		if (req.body.contentfollownew)
			accountSettings.preferences.contentfollownew =
				req.body.contentfollownew;
		if (req.body.contentfollowcomment)
			accountSettings.preferences.contentfollowcomment =
				req.body.contentfollowcomment;
		if (req.body.contentfollowreview)
			accountSettings.preferences.contentfollowreview =
				req.body.contentfollowreview;
		if (req.body.personfollowpost)
			accountSettings.preferences.personfollowpost =
				req.body.personfollowpost;
		if (req.body.selfquoted)
			accountSettings.preferences.selfquoted = req.body.selfquoted;
		if (req.body.selfmention)
			accountSettings.preferences.selfmention = req.body.selfmention;
		if (req.body.selfcontentrep)
			accountSettings.preferences.selfcontentrep =
				req.body.selfcontentrep;
		if (req.body.selffollow)
			accountSettings.preferences.selffollow = req.body.selffollow;
		if (req.body.selfprofilepost)
			accountSettings.preferences.selfprofilepost =
				req.body.selfprofilepost;
		if (req.body.statusreply)
			accountSettings.preferences.statusreply = req.body.statusreply;
		if (req.body.personfollowstatus)
			accountSettings.preferences.personfollowstatus =
				req.body.personfollowstatus;
		if (req.body.selfclubinvite)
			accountSettings.preferences.selfclubinvite =
				req.body.selfclubinvite;
		if (req.body.selfclubrequestresponse)
			accountSettings.preferences.selfclubrequestresponse =
				req.body.selfclubrequestresponse;
		if (req.body.memberclubrequest)
			accountSettings.preferences.memberclubrequest =
				req.body.memberclubrequest;
		if (req.body.memberjoinclub)
			accountSettings.preferences.memberjoinclub =
				req.body.memberjoinclub;
		if (req.body.eventreminders)
			accountSettings.preferences.eventreminders =
				req.body.eventreminders;

		User.findByIdAndUpdate(
			req.user.id,
			{ $set: accountSettings },
			{ new: true }
		)
			.then(user => res.json(user))
			.catch(err => res.json(err));
	}
);

module.exports = router;
