const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const keys = require('../../config/keys');
const passport = require('passport');
const fs = require('fs');

// Load User model to use in mongoose
const User = require('../../models/User');

const fileUpload = require('../../src/modules/fileUpload');
const encryptPassword = require('../../src/modules/encryptPassword');
const ifFile = require('../../src/modules/ifFile');
const isEmpty = require('../../src/modules/is-empty');

// @route   GET /user/test
// @desc    Test route
// @access  Public
router.get('/test', (req, res) => res.status(200).json({ msg: 'success' }));

// @route   POST /user/register
// @desc    Register new user
// @access  Public
// @ TODO	-	Test without upload
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
					// If a user doesn't already exist, create a new object with request field data.
					if (user) {
						errors.handle = 'This handle is not available';
						res.status(400).json(errors);
					}
					// Async function so that newUser document will only populate the avatar and coverphoto fields with their document id's once they have been created.
					const register = async () => {
						//let coverphoto;
						//let avatar;

						// New userInfo object to store all non-upload variables.
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

						// Check to see if any files were uploaded.
						// Using isEmpty because even without uploads, req.files returns an empty object.
						if (!isEmpty(req.files)) {
							let avatar;
							let coverphoto;

							// Checking if an avatar file was uploaded and creating document for it using ifFile().
							// Then adding new document to userInfo object (which will be used to create new User document).
							if (!isEmpty(req.files['avatar'])) {
								avatar = await ifFile(req, 'avatar');
								userInfo.avatar = avatar;
							}

							// Checking if an avatar file was uploaded and creating document for it using ifFile().
							// Then adding new document to userInfo object (which will be used to create new User document).
							if (!isEmpty(req.files['coverphoto'])) {
								coverphoto = await ifFile(req, 'coverphoto');
								userInfo.coverphoto = coverphoto;
							}

							// Creating async function for new User document generation to ensure the password is encrypted by encryptPassword() before being returned.
							const createNewUser = async () => {
								const newUser = new User(userInfo);
								await encryptPassword(newUser);
								return newUser;
							};

							// Assign the new User document returned by the createNewUser() function to a new user vairable to use to update avatar/coverphoto updates.
							const user = await createNewUser();

							// Update newly created upload file to include newly created user reference.
							if (!isEmpty(req.files['avatar'])) {
								Upload.findByIdAndUpdate(
									avatar._id,
									{
										$set: { user: user },
									},
									{ new: true }
								)
									.then()
									.catch(err => console.log(err));
							}
							// Update newly created upload file to include newly created user reference.
							if (!isEmpty(req.files['coverphoto'])) {
								Upload.findByIdAndUpdate(
									coverphoto.id,
									{
										$set: { user: user },
									},
									{ new: true }
								)
									.then()
									.catch(err => console.log(err));
							}

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
	// Uncomment this to make searching user profiles private
	//passport.authenticate('jwt', { session: false }),
	(req, res) => {
		// Find all users with handles matching the regular expression of the request query parameters.
		User.find({ handle: { $regex: req.query.handle, $options: 'i' } })
			.populate('avatar', ['path', 'filename'])
			.then(user => {
				const getSearchData = async () => {
					// Create an array for the restricted user documents.
					const users = [];
					// Cycle through eact returned user and add data to the foundUser object that is suitable for public viewing (no email addresses, etc.).
					await user.forEach(user => {
						const foundUser = {};
						foundUser.id = user.id;
						foundUser.handle = user.handle;
						foundUser.avatar = user.avatar;
						// Add restricted user object to users array
						users.push(foundUser);
					});

					res.status(200).json(users);
				};
				getSearchData();
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
		.populate('avatar', ['path', 'filename'])
		.populate('coverphoto', ['path', 'filename'])
		.populate('following', ['handle', 'avatar'])
		.then(user => {
			// Create an object to store user data to exclude data that shouldn't be available publicly.
			const foundUser = {};
			foundUser.id = user.id;
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
			foundUser.contentCount = user.contentCount;

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
	fileUpload.fields([
		{ name: 'avatar', maxCount: 1 },
		{ name: 'coverphoto', maxCount: 1 },
	]),
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
		if (req.body.gender) accountSettings.gender = req.body.gender;
		if (req.body.location) accountSettings.location = req.body.location;

		// CSV - seperate the req.body.interests value by commas
		if (typeof req.body.interests !== 'undefined') {
			accountSettings.interests = req.body.interests.split(',');
		}

		// Create an Async function to ensure that if we have files we can return the new user profile once they are uploaded.
		const updateSettings = async () => {
			// If the request contains files
			if (!isEmpty(req.files)) {
				// If the request files contain an avatar
				if (!isEmpty(req.files['avatar'])) {
					// If the current user avatar already exists
					if (req.user.avatar) {
						// Find record of existing upload and pass the path into fs.unlink() to delete from the file system
						await Upload.findById(
							req.user.avatar,
							(err, oldUpload) => {
								if (err) console.log(err);
								else if (oldUpload === null)
									res.json({
										Error: 'cant find existing avatar',
									});
								// Delete file from file system
								fs.unlink(oldUpload.path, err => {
									if (err) console.log(err);
								});

								// Delete file document from collection
								Upload.findByIdAndDelete(oldUpload.id, err => {
									if (err)
										res.json(`Delete document: ${err}`);
								});
							}
						);
					}
					// New avatar = new upload document
					const avatar = await ifFile(req, 'avatar');

					// Add new upload document to accountSettings object
					accountSettings.avatar = avatar._id;

					// Find the new upload document and add user id
					await Upload.findByIdAndUpdate(
						avatar._id,
						{
							$set: { user: req.user.id },
						},
						{ new: true }
					).catch(err => console.log(err));
				}

				// If the request files contain a coverphoto
				if (!isEmpty(req.files['coverphoto'])) {
					// If the current user coverphoto already exists
					if (req.user.coverphoto) {
						// Find record of existing upload and pass into fs.unlink() to delete from the file system
						await Upload.findById(
							req.user.coverphoto,
							(err, oldUpload) => {
								if (err) console.log(err);
								else if (oldUpload === null)
									res.json({
										Error: 'cant find existing coverphoto',
									});
								// Delete file from file system
								fs.unlink(oldUpload.path, err => {
									if (err) res.json(err);
								});

								// Delete file document from collection
								Upload.findByIdAndDelete(oldUpload.id, err => {
									if (err) console.log(err);
								});
							}
						);
					}

					// New coverphoto = new upload document
					const coverphoto = await ifFile(req, 'coverphoto');

					// Add new upload document to accountSettings object
					accountSettings.coverphoto = coverphoto._id;

					// Find the new upload document and add user id
					await Upload.findByIdAndUpdate(
						coverphoto._id,
						{
							$set: { user: req.user.id },
						},
						{ new: true }
					).catch(err => console.log(err));
				}
			}
			// Find and update the user document using the accountSettings object.
			await User.findByIdAndUpdate(
				req.user.id,
				{ $set: accountSettings },
				{ new: true },
				(err, user) => {
					err ? res.json(err) : res.json(user);
				}
			)
				.populate('avatar', ['filename', 'path'])
				.populate('coverphoto', ['filename', 'path'])
				.populate({
					path: 'following',
					populate: {
						path: 'user',
						model: ['handle', 'avatar'],
					},
				})
				.catch(err => console.log(err));
		};
		updateSettings().catch(err => console.log(err));
	}
);

// @route   DELETE /user/delete
// @desc    Delete current user
// @access  Private
router.delete(
	'/delete',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {}
);

module.exports = router;
