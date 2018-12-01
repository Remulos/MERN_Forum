const express = require('express');
const router = express.Router();
const passport = require('passport');
const recursive = require('recursive-readdir');

const User = require('../../models/User');
const Post = require('../../models/Post');

// Permissions validator for Admin routes
const requireRole = role => {
	return (req, res, next) => {
		if (req.user.role === role) {
			next();
		} else {
			res.status(403).json('Insufficient permissions to access route.');
		}
	};
};

// @route   GET /admin/users
// @desc    Get total number of users
// @access  Admin
router.get(
	'/total-users',
	passport.authenticate('jwt', { session: false }),
	requireRole('admin'),
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

// @route   GET /admin/posts
// @desc    Get total number of posts in database
// @access  Admin
router.get(
	'/total-posts',
	passport.authenticate('jwt', { session: false }),
	requireRole('admin'),
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

// @route   GET /admin/uploads
// @desc    Get total number of uploads in file system
// @access  Admin
router.get(
	'/total-uploads',
	passport.authenticate('jwt', { session: false }),
	requireRole('admin'),
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

// @route   GET /admin/users/search?handle
// @desc    Find users by handle
// @access  Admin
router.get(
	'/users/search',
	passport.authenticate('jwt', { session: false }),
	requireRole('admin'),
	(req, res) => {
		User.find({ handle: { $regex: req.query.handle, $options: 'i' } })
			.then(user => {
				res.status(200).json(user);
			})
			.catch(err => res.status(404).json({ Error: 'No users found.' }));
	}
);

// @route   GET /admin/user/:id
// @desc    Find user
// @access  Admin
router.get(
	'/user/:id',
	passport.authenticate('jwt', { session: false }),
	requireRole('admin'),
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

// @route   POST /admin/user/:id
// @desc    Find user and edit
// @access  Admin
router.post(
	'/user/:id',
	passport.authenticate('jwt', { session: false }),
	requireRole('admin'),
	(req, res) => {
		User.findById(req.params.id)
			.then(user => {
				const accountSettings = {};
				if (req.body.name) accountSettings.name = req.body.name;
				if (req.body.handle) accountSettings.handle = req.body.handle;
				if (req.body.email) accountSettings.email = req.body.email;
				if (req.body.dob) accountSettings.dob = req.body.dob;
				if (req.body.timezone)
					accountSettings.timezone = req.body.timezone;
				if (req.body.signature)
					accountSettings.signature = req.body.signature;

				accountSettings.preferences = {};
				if (req.body.newsletter)
					accountSettings.preferences.newsletter =
						req.body.newsletter;
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
					accountSettings.preferences.addedtoconvo =
						req.body.addedtoconvo;
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
					accountSettings.preferences.selfquoted =
						req.body.selfquoted;
				if (req.body.selfmention)
					accountSettings.preferences.selfmention =
						req.body.selfmention;
				if (req.body.selfcontentrep)
					accountSettings.preferences.selfcontentrep =
						req.body.selfcontentrep;
				if (req.body.selffollow)
					accountSettings.preferences.selffollow =
						req.body.selffollow;
				if (req.body.selfprofilepost)
					accountSettings.preferences.selfprofilepost =
						req.body.selfprofilepost;
				if (req.body.statusreply)
					accountSettings.preferences.statusreply =
						req.body.statusreply;
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
				if (req.body.location)
					accountSettings.location = req.body.location;

				if (typeof req.body.interests !== 'undefined') {
					accountSettings.interests = req.body.interests.split(',');
				}

				User.findByIdAndUpdate(
					user.id,
					{ $set: accountSettings },
					{ new: true }
				)
					.then(user => res.status(201).json(user))
					.catch(err =>
						res
							.status(400)
							.json({
								error: 'Unable to update user information.',
							})
					);
			})
			.catch(err =>
				res
					.status(404)
					.json({ error: 'Unable to find a user with this id' })
			);
	}
);

// @route   DELETE /admin/user
// @desc    Find user and delete
// @access  Admin
router.delete(
	'/user',
	passport.authenticate('jwt', { session: false }),
	requireRole('admin'),
	(req, res) => {
		User.findById(req.body.id).then(user => {
			if (req.body.posts === true && user.posts.length !== 0) {
				user.posts.forEach(post => {
					Post.findByIdAndDelete(post.id)
						.then()
						.catch(err =>
							res
								.status(400)
								.json({
									Error:
										'Unable to delete posts from this user.',
								})
						);
				});
			}
			// TODO - delete user uploads
			user.remove((err, user) => {
				if (err) {
					res.status(400).json({
						error: 'Unable to delete user record.',
					});
				}
				res.status(200).json(user);
			});
		});
	}
);

module.exports = router;
