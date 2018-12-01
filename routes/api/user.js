const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');

// Load User model to use in mongoose
const User = require('../../models/User');

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
							.then(user => res.json(user))
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

// @route   GET /user
// @desc    Get current user account settings
// @access  Private
router.get(
	'/',
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

// @route   GET /user
// @desc    Find users by handle
// @access  Private
router.get(
	'/user',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		User.find({ handle: { $regex: req.body.handle } })
			.then(user => {
				const users = [];
				user.forEach(user => {
					const foundUser = {};

					foundUser.handle = user.handle;
					foundUser.date = user.date;
					foundUser.dob = user.dob;
					foundUser.avatar = user.avatar;
					foundUser.coverphoto = user.coverphoto;
					foundUser.reputation = user.reputation;
					foundUser.interests = user.interests;
					foundUser.about = user.about;
					foundUser.rank = user.rank;
					foundUser.gender = user.gender;
					foundUser.location = user.location;
					foundUser.clubs = user.clubs;
					foundUser.contentCount = user.contentCount;
					foundUser.posts = user.posts;
					foundUser.comments = user.comments;
					foundUser.ships = user.ships;
					foundUser.uploads = user.uploads;

					users.push(foundUser);
				});
				res.json(users);
			})
			.catch(err => res.json(err));
	}
);

// @route   GET /user/:handle
// @desc    View user profile
// @access  Public
router.get('/:handle', (req, res) => {
	User.findOne({ handle: req.params.handle })
		.then(user => {
			const foundUser = {};

			foundUser.handle = user.handle;
			foundUser.date = user.date;
			foundUser.dob = user.dob;
			foundUser.avatar = user.avatar;
			foundUser.coverphoto = user.coverphoto;
			foundUser.reputation = user.reputation;
			foundUser.interests = user.interests;
			foundUser.about = user.about;
			foundUser.rank = user.rank;
			foundUser.gender = user.gender;
			foundUser.location = user.location;
			foundUser.clubs = user.clubs;
			foundUser.contentCount = user.contentCount;
			foundUser.posts = user.posts;
			foundUser.comments = user.comments;
			foundUser.ships = user.ships;
			foundUser.uploads = user.uploads;

			res.json(foundUser);
		})
		.catch(err => res.status(404).json(err));
});

// @route   POST /user/edit
// @desc    Edit current user model values
// @access  Private
router.post(
	'/edit',
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

		if (req.body.avatar) accountSettings.avatar = req.body.avatar;
		if (req.body.coverphoto)
			accountSettings.coverphoto = req.body.coverphoto;
		if (req.body.gender) accountSettings.gender = req.body.gender;
		if (req.body.location) accountSettings.location = req.body.location;

		if (typeof req.body.interests !== 'undefined') {
			accountSettings.interests = req.body.interests.split(',');
		}

		User.findByIdAndUpdate(
			req.user.id,
			{ $set: accountSettings },
			{ new: true }
		)
			.then(user => res.json(user))
			.catch(err => res.json(err));
	}
);

// @route   POST /user/comment
// @desc    Add record of comment to current user profile
// @access  Private
router.post(
	'/comment',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const errors = {};

		User.findById(req.user.id).then(user => {
			if (!user) {
				errors.nouser = 'Cannot find user';
				res.status(404).json(errors);
			} else {
				const comment = { commentid: req.body.commentid };
				if (
					user.comments.some(
						({ commentid }) => commentid === req.body.commentid
					)
				) {
					errors.commentexists = 'This commentid already exists';
					res.status(404).json(errors);
				} else {
					user.comments.unshift(comment);
					user.save()
						.then(user => res.json(user))
						.catch(err => res.json(err));
				}
			}
		});
	}
);

// @route   DELETE /user/comment
// @desc    Delete record of comment from current user
// @access  Private
router.delete(
	'/comment',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const errors = {};

		User.findById(req.user.id).then(user => {
			if (!user) {
				errors.nouser = 'Cannot find user';
				res.status(404).json(errors);
			} else {
				if (
					user.comments.some(
						({ commentid }) => commentid === req.body.commentid
					)
				) {
					const removeIndex = user.comments
						.map(comment => comment.commentid)
						.indexOf(req.body.commentid);

					user.comments.splice(removeIndex, 1);
					user.save()
						.then(user => res.json(user))
						.catch(err => res.json(err));
				} else {
					errors.nocomment = 'No comment with this id to remove';
					res.status(404).json(errors);
				}
			}
		});
	}
);

// @route   POST /user/like
// @desc    Add record of likes to current user profile
// @access  Private
router.post(
	'/like',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const errors = {};

		const like = { likeid: req.body.likeid };

		User.findById(req.user.id).then(user => {
			if (!user) {
				errors.nouser = 'Cannot find user';
				res.status(404).json(errors);
			} else {
				if (
					user.likes.some(({ likeid }) => likeid === req.body.likeid)
				) {
					errors.alreadyliked = 'User has already liked this';
					res.status(404).json(errors);
				} else {
					user.likes.unshift(like);
					user.save()
						.then(user => res.json(user))
						.catch(err => res.json(err));
				}
			}
		});
	}
);

// @route   DELETE /user/like
// @desc    Remove record of like from current user
// @access  Private
router.delete(
	'/like',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const errors = {};

		const like = { likeid: req.body.likeid };

		// Find the logged in user
		User.findById(req.user.id).then(user => {
			if (!user) {
				errors.nouser = 'Cannot find user';
				res.status(404).json(errors);
			} else {
				// Check that the likeid already exists in the user and then splice out of likes array
				if (
					user.likes.some(({ likeid }) => likeid === req.body.likeid)
				) {
					const removeIndex = user.likes
						.map(like => like.likeid)
						.indexOf(req.body.likeid);

					user.likes.splice(removeIndex, 1);
					user.save()
						.then(user => res.json(user))
						.catch(err => res.json(err));
				} else {
					errors.like = 'Already unliked';
					res.status(404).json(errors);
				}
			}
		});
	}
);

// @route   POST /user/club
// @desc    Add / Edit record of club membership to current user
// @access  Private
router.post(
	'/club',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const errors = {};

		// Find the user for the logged in user
		User.findById(req.user.id).then(user => {
			if (!user) {
				errors.nouser = 'Cannot find user';
				res.status(404).json(errors);
			} else {
				const club = {};
				club.clubid = req.body.clubid;
				if (req.body.clubname) club.name = req.body.clubname;
				if (req.body.role) club.role = req.body.role;
				if (req.body.permissions)
					club.permissions = req.body.permissions;

				if (
					user.clubs.some(({ clubid }) => clubid === req.body.clubid)
				) {
					const removeIndex = user.clubs
						.map(club => club.clubid)
						.indexOf(req.body.clubid);

					if (!club.permissions)
						club.permissions = user.clubs[removeIndex].permissions;
					if (!club.name) club.name = user.clubs[removeIndex].name;
					if (!club.role) club.role = user.clubs[removeIndex].role;

					user.clubs.splice(removeIndex, 1);
					user.clubs.push(club);
					user.save()
						.then(user => res.json(user))
						.catch(err => res.json(err));
				} else {
					user.clubs.push(club);
					user.save()
						.then(user => res.json(user))
						.catch(err => res.json(err));
				}
			}
		});
	}
);

// @route   DELETE /user/club
// @desc    Delete record of club membership from current user
// @access  Private
router.delete(
	'/club',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const errors = {};

		// Find the user for the logged in user
		User.findById(req.user.id).then(user => {
			if (!user) {
				errors.nouser = 'Cannot find user';
				res.status(404).json(errors);
			} else {
				// Find a club with the correct clubid
				if (
					user.clubs.some(({ clubid }) => clubid === req.body.clubid)
				) {
					const removeIndex = user.clubs
						.map(club => club.clubid)
						.indexOf(req.body.clubid);

					user.clubs.splice(removeIndex, 1);
					user.save()
						.then(user => res.json(user))
						.catch(err => res.json(err));
				} else {
					errors.club = 'Not a member of this club';
					res.status(404).json(errors);
				}
			}
		});
	}
);

// TODO
// @route   POST /user/post
// @desc    Add record of post to current user
// @access  Private

// TODO
// @route   DELETE /user/post
// @desc    Delete record of post to current user
// @access  Private

module.exports = router;
