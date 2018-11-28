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

// @route   POST post/
// @desc    Create Post
// @access  Public
router.post(
	'/',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const errors = {};

		const newPost = {
			title: req.body.title,
			text: req.body.text,
			category: req.body.category,
		};
	}
);

module.exports = router;
