const router = require('express').Router();
const passport = require('passport');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   GET /profile/test
// @desc    Test route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'success' }));

// @route   GET /profile/
// @desc    View logged in users profile
// @access  Private
router.get(
	'/',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const errors = {};

		Profile.findOne({ user: req.user.id })
			.populate('user', ['name', 'handle'])
			.then(profile => {
				if (!profile) {
					errors.noprofile = 'No profile data found';
					res.status(404).json(errors);
				}
				res.json(profile);
			})
			.catch(err => res.status(404).json(err));
	}
);

// @route   POST /profile/
// @desc    Create/edit logged in users profile
// @access  Private
router.post(
	'/',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const profileFields = {};
		profileFields.user = req.user.id;
		if (req.body.avatar) profileFields.avatar = req.body.avatar;
		if (req.body.coverphoto) profileFields.coverphoto = req.body.coverphoto;
		if (req.body.gender) profileFields.gender = req.body.gender;
		if (req.body.location) profileFields.location = req.body.location;

		if (typeof req.body.interests !== 'undefined') {
			profileFields.interests = req.body.interests.split(',');
		}

		Profile.findOne({ user: req.user.id }).then(profile => {
			if (profile) {
				Profile.findByIdAndUpdate(
					profile.id,
					{ $set: profileFields },
					{ new: true }
				)
					.then(profile => {
						res.json(profile);
					})
					.catch(err => res.json(err));
			} else {
				new Profile(profileFields)
					.save()
					.then(profile => res.json(profile))
					.catch(err => res.json(err));
			}
		});
	}
);

// @route   POST /profile/comment
// @desc    Add record of comment to profile
// @access  Private
router.post(
	'/comment',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const errors = {};

		Profile.findOne({ user: req.user.id }).then(profile => {
			if (!profile) {
				errors.noprofile = 'Cannot find profile';
				res.status(404).json(errors);
			} else {
				const comment = { commentid: req.body.commentid };
				if (
					profile.comments.some(
						({ commentid }) => commentid === req.body.commentid
					)
				) {
					errors.commentexists = 'This commentid already exists';
					res.status(404).json(errors);
				} else {
					profile.comments.unshift(comment);
					profile
						.save()
						.then(profile => res.json(profile))
						.catch(err => res.json(err));
				}
			}
		});
	}
);

// @route   DELETE /profile/comment
// @desc    Delete record of comment
// @access  Private
router.delete(
	'/comment/',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const errors = {};

		Profile.findOne({ user: req.user.id }).then(profile => {
			if (!profile) {
				errors.noprofile = 'Cannot find profile';
				res.status(404).json(errors);
			} else {
				const comment = { commentid: req.body.commentId };

				if (
					profile.comments.some(
						({ commentid }) => commentid === req.body.commentid
					)
				) {
					const removeIndex = profile.comments
						.map(comment => comment.commentid)
						.indexOf(req.body.commentid);

					profile.comments.splice(removeIndex, 1);
					profile
						.save()
						.then(profile => res.json(profile))
						.catch(err => res.json(err));
				} else {
					errors.nocomment = 'No comment with this id to remove';
					res.status(404).json(errors);
				}
			}
		});
	}
);

// @route   POST /profile/like
// @desc    Add record of likes to profile
// @access  Private
router.post(
	'/like',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const errors = {};

		const like = { likeid: req.body.likeid };

		Profile.findOne({ user: req.user.id }).then(profile => {
			if (!profile) {
				errors.noprofile = 'Cannot find profile';
				res.status(404).json(errors);
			} else {
				if (
					profile.likes.some(
						({ likeid }) => likeid === req.body.likeid
					)
				) {
					errors.alreadyliked = 'User has already liked this';
					res.status(404).json(errors);
				} else {
					profile.likes.unshift(like);
					profile
						.save()
						.then(profile => res.json(profile))
						.catch(err => res.json(err));
				}
			}
		});
	}
);

// @route   DELETE /profile/like
// @desc    Remove record of like
// @access  Private
router.delete(
	'/like',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const errors = {};

		const like = { likeid: req.body.likeid };

		// Find the profile for the logged in user
		Profile.findOne({ user: req.user.id }).then(profile => {
			if (!profile) {
				errors.noprofile = 'Cannot find profile';
				res.status(404).json(errors);
			} else {
				// Check that the likeid already exists in the profile and then splice out of likes array
				if (
					profile.likes.some(
						({ likeid }) => likeid === req.body.likeid
					)
				) {
					const removeIndex = profile.likes
						.map(like => like.likeid)
						.indexOf(req.body.likeid);

					profile.likes.splice(removeIndex, 1);
					profile
						.save()
						.then(profile => res.json(profile))
						.catch(err => res.json(err));
				} else {
					errors.like = 'Already unliked';
					res.status(404).json(errors);
				}
			}
		});
	}
);

// @route   POST /profile/club
// @desc    Add / Edit record of club membership to profile
// @access  Private
router.post(
	'/club',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const errors = {};

		// Find the profile for the logged in user
		Profile.findOne({ user: req.user.id }).then(profile => {
			if (!profile) {
				errors.noprofile = 'Cannot find profile';
				res.status(404).json(errors);
			} else {
				const club = {};
				club.clubid = req.body.clubid;
				if (req.body.clubname) club.name = req.body.clubname;
				if (req.body.role) club.role = req.body.role;
				if (req.body.permissions)
					club.permissions = req.body.permissions;

				if (
					profile.clubs.some(
						({ clubid }) => clubid === req.body.clubid
					)
				) {
					const removeIndex = profile.clubs
						.map(club => club.clubid)
						.indexOf(req.body.clubid);

					if (!club.permissions)
						club.permissions =
							profile.clubs[removeIndex].permissions;
					if (!club.name) club.name = profile.clubs[removeIndex].name;
					if (!club.role) club.role = profile.clubs[removeIndex].role;

					profile.clubs.splice(removeIndex, 1);
					profile.clubs.push(club);
					profile
						.save()
						.then(profile => res.json(profile))
						.catch(err => res.json(err));
				} else {
					profile.clubs.push(club);
					profile
						.save()
						.then(profile => res.json(profile))
						.catch(err => res.json(err));
				}
			}
		});
	}
);

// @route   DELETE /profile/club
// @desc    Delete record of club membership from profile
// @access  Private
router.delete(
	'/club',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const errors = {};

		// Find the profile for the logged in user
		Profile.findOne({ user: req.user.id }).then(profile => {
			if (!profile) {
				errors.noprofile = 'Cannot find profile';
				res.status(404).json(errors);
			} else {
				// Find a club with the correct clubid
				if (
					profile.clubs.some(
						({ clubid }) => clubid === req.body.clubid
					)
				) {
					const removeIndex = profile.clubs
						.map(club => club.clubid)
						.indexOf(req.body.clubid);

					profile.clubs.splice(removeIndex, 1);
					profile
						.save()
						.then(profile => res.json(profile))
						.catch(err => res.json(err));
				} else {
					errors.club = 'Not a member of this club';
					res.status(404).json(errors);
				}
			}
		});
	}
);

// @route   POST /profile/post
// @desc    Add record of posts to profile
// @access  Private
// TODO

module.exports = router;
