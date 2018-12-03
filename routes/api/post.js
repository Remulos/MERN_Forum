const router = require('express').Router();
const mongoose = require('mongoose');
const passport = require('passport');
const fs = require('fs');
const multer = require('multer');

// Load models
const Post = require('../../models/Post');
const Profile = require('../../models/Post');

// Load multer storage method
const fileUpload = require('../../src/modules/fileUpload');
const addFiles = require('../../src/modules/test');

// @route   GET post/test
// @desc    Test post route
// @access  Public
router.get('/test', (req, res) => res.status(200).json({ success: true }));

// @route   POST post/
// @desc    Create Post
// @access  Public
router.post(
	'/',
	passport.authenticate('jwt', { session: false }),
	fileUpload.array('file'),
	(req, res) => {
		const newPost = new Post({
			user: req.user.id,
			title: req.body.title,
			text: req.body.text,
			category: req.body.category,
		});

		if (!req.files) {
			console.log('files not present');
			newPost
				.save()
				.then(post => res.status(200).json(post))
				.catch(err => res.status(400).json(err));
		} else {
			// Cycle through all files in request, add attributes to new Upload object and save to uploads collection. Then add saved object to 'uploads' array.
			req.files.forEach(file => {
				const upload = new Upload({
					filename: file.filename,
					path: file.path,
					mimetype: file.mimetype,
					size: file.size,
					originalname: file.originalname,
					user: req.user.id,
				});

				upload
					.save()
					.then(newPost.attachments.push(upload))
					.catch(err => res.status(400).json(err));
			});
			newPost
				.save()
				.then(post => res.status(200).json(post))
				.catch(err => res.status(400).json(err));
		}
	}
);

module.exports = router;
