const express = require('express');
const router = express.Router();
const passport = require('passport');
const recursive = require('recursive-readdir');
const fs = require('fs');

// Load models
const User = require('../../models/User');
const Post = require('../../models/Post');

const requireRole = require('../../src/modules/requireRole');
const ifFile = require('../../src/modules/ifFile');
const isEmpty = require('../../src/modules/is-empty');
const fileUpload = require('../../src/modules/fileUpload');

// @route   GET admin/total-users
// @desc    Get total number of users
// @access  Admin
router.get(
	'/total-users',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		User.countDocuments((err, count) => {
			if (err) {
				res.status(400).json(err);
			} else {
				res.status(200).json(count);
			}
		});
	}
);

// @route   GET admin/total-posts
// @desc    Get total number of posts in database
// @access  Admin
router.get(
	'/total-posts',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		Post.estimatedDocumentCount((err, count) => {
			if (err) {
				res.status(400).json(err);
			} else {
				res.status(200).json(count);
			}
		});
	}
);

// @route   GET admin/total-uploads
// @desc    Get total number of uploads in file system
// @access  Admin
router.get(
	'/total-uploads',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		recursive('./uploads', (err, files) => {
			if (err) res.status(400).json(err);
			if (files) {
				const numFiles = files.length;
				res.status(200).json(numFiles);
			}
		});
	}
);

// @route   GET admin/users/find?handle&page
// @desc    Find users by handle
// @access  Admin
// TODO - Remove user password from returned information
router.get(
	'/users/find',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		const skip = (req.params.page - 1) * 25;
		// Search entire 'users' collection by handle for the regular expression of the search query
		User.find(
			{ handle: { $regex: req.query.handle, $options: 'i' } },
			null,
			[{ limit: 25 }, { skip: skip }]
		)
			.then(user => {
				res.status(200).json(user);
			})
			.catch(err => res.status(404).json({ Error: 'No users found.' }));
	}
);

// @route   GET admin/user/:id
// @desc    Find user
// @access  Admin
// TODO - Remove user password from returned information
router.get(
	'/user/:id',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		User.findById(req.params.id)
			.then(user => {
				res.status(200).json(user);
			})
			.catch(err =>
				res
					.status(404)
					.json({ Error: 'No user found with this handle.' })
			);
	}
);

// @route   POST admin/user/:id
// @desc    Find user and edit
// @access  Admin
router.post(
	'/user/:id',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	fileUpload.fields([
		{ name: 'avatar', maxCount: 1 },
		{ name: 'coverphoto', maxCount: 1 },
	]),
	(req, res) => {
		// Create an object to store all configurable user settings and if new values are in the request body, add them to the object.
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

		User.findById(req.params.id, (err, user) => {
			if (err) res.status(404).json(err);
			else {
				// Create an Async function to ensure that if we have files we can return the new user profile once they are uploaded.
				const updateSettings = async () => {
					// If the request contains files
					if (!isEmpty(req.files)) {
						// If the request files contain an avatar
						if (!isEmpty(req.files['avatar'])) {
							// If the current user avatar already exists
							if (user.avatar) {
								// Find record of existing upload and pass the path into fs.unlink() to delete from the file system
								await Upload.findById(
									user.avatar,
									(err, oldUpload) => {
										if (err) console.log(err);
										else if (oldUpload === null)
											res.json({
												Error:
													'cant find existing avatar',
											});
										// Delete file from file system
										fs.unlink(oldUpload.path, err => {
											if (err) console.log(err);
										});

										// Delete file document from collection
										Upload.findByIdAndDelete(
											oldUpload.id,
											err => {
												if (err)
													res.json(
														`Delete document: ${err}`
													);
											}
										);
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
									$set: { user: user.id },
								},
								{ new: true }
							).catch(err => console.log(err));
						}

						// If the request files contain a coverphoto
						if (!isEmpty(req.files['coverphoto'])) {
							// If the current user coverphoto already exists
							if (user.coverphoto) {
								// Find record of existing upload and pass into fs.unlink() to delete from the file system
								await Upload.findById(
									user.coverphoto,
									(err, oldUpload) => {
										if (err) console.log(err);
										else if (oldUpload === null)
											res.json({
												Error:
													'cant find existing coverphoto',
											});
										// Delete file from file system
										fs.unlink(oldUpload.path, err => {
											if (err) res.json(err);
										});

										// Delete file document from collection
										Upload.findByIdAndDelete(
											oldUpload.id,
											err => {
												if (err) console.log(err);
											}
										);
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
									$set: { user: user.id },
								},
								{ new: true }
							).catch(err => console.log(err));
						}
					}
					// Find and update the user document using the accountSettings object.
					await User.findByIdAndUpdate(
						user.id,
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
		});
	}
);

// @route   DELETE admin/upload/remove?upload
// @desc    Find user upload and delete it.
// @access  Admin
router.delete(
	'/upload/remove',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		// Make sure an upload document exists with the provided id.
		Upload.findByIdAndRemove(req.body.id, (err, upload) => {
			if (err) res.status(404).json(err);
			else {
				// Find any user who is using this upload as an avatar or cover photo.
				User.findOne(
					{
						$or: [
							{ avatar: upload._id },
							{ coverphoto: upload._id },
						],
					},
					(err, user) => {
						if (err) res.status(404).json(err);
						if (user.avatar.toString() === upload._id.toString()) {
							user.avatar = undefined;
						} else if (
							user.coverphoto.toString() === upload._id.toString()
						) {
							user.coverphoto = undefined;
						}
						user.save()
							.then(user => res.json(user))
							.catch(err => res.json(err));
					}
				);
				fs.unlink(upload.path, err => {
					if (err) res.json(err);
				});
			}
		});
	}
);

// @route   DELETE admin/upload/remove?upload
// @desc    Find user upload and delete it.
// @access  Admin
router.delete(
	'/upload/remove',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		// Make sure an upload document exists with the provided id.
		Upload.findByIdAndRemove(req.query.upload, (err, upload) => {
			if (err) res.status(404).json(err);
			else {
				// Find any user who is using this upload as an avatar or cover photo.
				User.findOne(
					{
						$or: [
							{ avatar: upload._id },
							{ coverphoto: upload._id },
						],
					},
					(err, user) => {
						if (err) res.status(404).json(err);
						if (user.avatar.toString() === upload._id.toString()) {
							user.avatar = undefined;
						} else if (
							user.coverphoto.toString() === upload._id.toString()
						) {
							user.coverphoto = undefined;
						}
						user.save()
							.then(user => res.json(user))
							.catch(err => res.json(err));
					}
				);
				fs.unlink(upload.path, err => {
					if (err) res.json(err);
				});
			}
		});
	}
);

// @route   DELETE admin/user?id
// @desc    Find user and delete
// @access  Admin
router.delete(
	'/user?id',
	passport.authenticate('jwt', { session: false }),
	requireRole('Admin'),
	(req, res) => {
		User.findById(req.body.id).then(user => {
			// TODO - Find and remove all user likes
			// TODO - Delete or archive user uploads
			// TODO - Delete or archive user document
		});
	}
);

// @route   POST /admin/user/ban?id
// @desc    Find user ban from creating new content for a specified period of time
// @access  Admin
// TODO - Create POST /admin/user/ban?id route

// @route		POST /admin/user/unban?id
// @desc		Find user and remove ban from account
// @access	Admin
// TODO - Create POST /admin/user/unban?id route

// @route		GET /admin/uploads/reports
// @desc		Retrieve all reported uploads
// @access	Admin
// TODO - Create POST /admin/uploads/reports route

// @route		GET /admin/posts/reports
// @desc		Retrieve all reported posts
// @access	Admin
// TODO - Create POST /admin/posts/reports route

// @route		GET /admin/comments/reports
// @desc		Retrieve all reported comments
// @access	Admin
// TODO - Create POST /admin/comments/reports route

// @route		GET /admin/users/reports
// @desc		Retrieve all reported users
// @access	Admin
// TODO - Create POST /admin/users/reports route

module.exports = router;
