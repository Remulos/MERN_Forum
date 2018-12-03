const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');

// Load User model to use in mongoose
const User = require('../../models/User');

const fileUpload = require('../../src/modules/fileUpload');
const setupUser = require('../../src/modules/setupUser');
const encryptPassword = require('../../src/modules/encryptPassword');
const ifFile = require('../../src/modules/ifFile');

// @route   GET /user/test
// @desc    Test route
// @access  Public
router.get('/test', (req, res) => res.status(200).json({ msg: 'success' }));

// @route   POST /user/register
// @desc    Register new user
// @access  Public
router.post(
	'/register',
	fileUpload.fields([
		{ name: 'avatar', maxCount: 1 },
		{ name: 'coverphoto', maxCount: 1 },
	]),
	(req, res) => {
		const errors = {};

		// Search existing users by email to see if account already exists.
		User.findOne({ email: req.body.email }).then(user => {
			// If that account already exists, return an error message.
			if (user) {
				errors.email = 'An account with this email already exists';
				res.status(400).json(errors);
			} else {
				// Search existing users by handle to see if the requested handle is already taken.
				User.findOne({ handle: req.body.handle }).then(user => {
					// If a user doesn't already exist, populate a new object with request field data.
					if (user) {
						errors.handle = 'This handle is not available';
						res.status(400).json(errors);
					}

					const register = async () => {
						let newUser;
						let coverphoto;
						let avatar;

						if (req.files) {
							const userInfo = {
								name: req.body.name,
								handle: req.body.handle,
								email: req.body.email,
								password: req.body.password,
								date: req.body.date,
								dob: req.body.dob,
								timezone: req.body.timezone,
								role: 'Civilian',
							};

							if (req.files['avatar'][0]) {
								avatar = await ifFile(req, 'avatar');
								userInfo.avatar = avatar;
							}

							if (req.files['coverphoto'][0]) {
								coverphoto = await ifFile(req, 'coverphoto');
								userInfo.coverphoto = coverphoto;
							}
							const createNewUser = async () => {
								newUser = new User(userInfo);
								await encryptPassword(newUser);
								return newUser;
							};

							const user = await createNewUser();
							await Upload.findByIdAndUpdate(avatar.id, {
								$set: { user: user },
							});
							await Upload.findByIdAndUpdate(coverphoto.id, {
								$set: { user: user },
							});
							return user;
						} else {
							const user = new User(userInfo);
							await encryptPassword(user);
							return user;
						}
					};
					register()
						.then(user => {
							res.status(201).json(user);
						})
						.catch(err => res.status(400).json(err));
				});
			}
		});
	}
);

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
							res.status(200).json({
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
		// Search for the user document with id matching id returned from the passport strategy.
		User.findById(req.user.id)
			.populate('avatar', ['path', 'filename'])
			.populate('coverphoto', ['path', 'filename'])
			.populate('following', ['handle', 'avatar'])
			.then(user => {
				if (!user) {
					errors.nouser = 'Account settings not found.';
					res.status(404).json(errors);
				}
				res.status(200).json({ user });
			})
			.catch(err => res.status(401).json(err));
	}
);

// @route   GET /user/find?handle
// @desc    Find users by handle
// @access  Private
// TODO - add search limit
router.get(
	'/find',
	// Uncomment this to make user profile private
	//passport.authenticate('jwt', { session: false }),
	(req, res) => {
		console.log(req.query.handle);
		// Find all users with handles matching the regular expression of the request query parameters.
		User.find({ handle: { $regex: req.query.handle, $options: 'i' } })
			.then(user => {
				// Create an array for the restricted user documents.
				const users = [];
				// Cycle through eact returned user and add data to the foundUser object that is suitable for public viewing (no email addresses, etc.).
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

					// Add restricted user object to users array
					users.push(foundUser);
				});
				res.status(200).json(users);
			})
			.catch(err =>
				res.status(404).json({
					error: 'No accounts with that handle could be found.',
				})
			);
	}
);

// @route   GET /user/profile/:handle
// @desc    View user profile
// @access  Public
router.get('/profile/:handle', (req, res) => {
	User.findOne({ handle: req.params.handle })
		.then(user => {
			// Create an object to store user data to exclude data that shouldn't be available publicly.
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

			res.status(200).json(foundUser);
		})
		.catch(err =>
			res.status(404).json({ error: 'No User found with this handle.' })
		);
});

// @route   POST /user/edit
// @desc    Edit current user model values
// @access  Private
router.post(
	'/edit',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		// Create object for updated user settings and only add settings if specified in request body.
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

		// CSV - seperate the req.body.interests value by commas
		if (typeof req.body.interests !== 'undefined') {
			accountSettings.interests = req.body.interests.split(',');
		}

		// Use the user id returned from the passport strategy and use it to find and update the user document using the accountSettings object.
		User.findByIdAndUpdate(
			req.user.id,
			{ $set: accountSettings },
			{ new: true }
		)
			.then(user => res.status(200).json(user))
			.catch(err =>
				res.status(404).json({ error: 'Unable top find user account.' })
			);
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

		User.findById(req.user.id)
			.then(user => {
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
							.then(user => res.status(201).json(user))
							.catch(err =>
								res.status(400).json({
									error:
										'Unable to save comment to user record.',
								})
							);
					}
				}
			})
			.catch(err => res.status(404).json({ error: 'Cannot find user' }));
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
						.then(user => res.status(200).json(user))
						.catch(err =>
							res.status(400).json({
								error:
									'Unable to remove comment from user record.',
							})
						);
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
					res.status(400).json(errors);
				} else {
					user.likes.unshift(like);
					user.save()
						.then(user => res.status(201).json(user))
						.catch(err =>
							res.status(400).json({
								error: 'Unable to add like to user record.',
							})
						);
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
						.then(user => res.status(200).json(user))
						.catch(err =>
							res.status(400).json({
								error:
									'Unable to remove like from user record.',
							})
						);
				} else {
					errors.like = 'Already unliked';
					res.status(400).json(errors);
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
						.then(user => res.status(201).json(user))
						.catch(err =>
							res.status(400).json({
								error:
									'Unable to edit club information to user record.',
							})
						);
				} else {
					user.clubs.push(club);
					user.save()
						.then(user => res.status(201).json(user))
						.catch(err =>
							res.status(400).json({
								error:
									'Unable to add club information to user record.',
							})
						);
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
						.then(user => res.status(200).json(user))
						.catch(err =>
							res.status(400).json({
								error:
									'Unable to remove club from user record.',
							})
						);
				} else {
					errors.club = 'Not a member of this club';
					res.status(400).json(errors);
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
