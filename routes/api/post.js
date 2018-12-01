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
router.get('/test', (req, res) => res.status(200).json({ success: true }));

mongoose.connection.on('connected', () => {
	// File upload middleware

	// @route   POST post/
	// @desc    Create Post
	// @access  Public
	router.post(
		'/',
		passport.authenticate('jwt', { session: false }),
		(req, res) => {}
	);
});

module.exports = router;
