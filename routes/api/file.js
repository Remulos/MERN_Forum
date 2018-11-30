const express = require('express');
const router = express.Router();
const passport = require('passport');
const fs = require('fs');

const User = require('../../models/User');

const generateUpload = require('../../src/modules/uploadDestination');

// @route   POST /file
// @desc    Upload array of files from input field 'file'
// @access  Private
router.post(
	'/',
	passport.authenticate('jwt', { session: false }),
	generateUpload.array('file'),
	(req, res) => {
		const errors = {};

		User.findById(req.user.id).then(user => {
			if (!user) {
				errors.nouser = 'Cannot find user';
				res.status(404).json(errors);
			} else {
				req.files.forEach(file => {
					user.uploads.unshift({ uploadPath: file.path });
				});
				user.save()
					.then(user => res.json({ user: user, files: req.files }))
					.catch(err => res.json(err));
			}
		});
	}
);

// @route   DELETE /file
// @desc    Upload array of file names to delete
// @access  Private
router.delete(
	'/',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		if (req.body.file) {
			const fileUploadPath = {};
			fs.unlink(req.body.file, err => res.status(404).json(err));
			fileUploadPath.uploadPath = req.body.file;
			User.findOne({ uploads: fileUploadPath })
				.then(user => {
					console.log('file owner found!');
				})
				.catch(err => console.log({ msg: 'File owner not found' }));
			res.json({ msg: 'File successfully deleted' });
		} else {
			res.json({ error: 'no file path recieved' });
		}
	}
);

module.exports = router;
