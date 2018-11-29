const router = require('express').Router();
const mongoose = require('mongoose');
const passport = require('passport');
const multer = require('multer');

// Load models
const Post = require('../../models/Post');
const Profile = require('../../models/Post');

// @route   GET post/test
// @desc    Test post route
// @access  Public
router.get('/test', (req, res) => res.json({ success: true }));

mongoose.connection.on('connected', () => {
	// File upload middleware
	const multerSetUp = require('../../src/modules/gridFsStorage');

	// @route   POST post/
	// @desc    Create Post
	// @access  Public
	router.post(
		'/',
		passport.authenticate('jwt', { session: false }),
		multerSetUp,
		(req, res) => {
			const errors = {};

			const newPost = {
				title: req.body.title,
				text: req.body.text,
				category: req.body.category,
			};

			if (req.files.length > 0) {
				req.file.forEach(file => {});
			}

			Profile.findOne({ user: req.user.id }).then(profile => {
				if (!profile) {
					errors.noprofile = 'Cannot find profile';
					res.status(404).json(errors);
				} else {
					req.files.forEach(file => {
						profile.uploads.unshift({ uploadid: file.id });
					});
				}
			});
		}
	);
});

module.exports = router;
