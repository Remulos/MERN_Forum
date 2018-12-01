const express = require('express');
const router = express.Router();
const passport = require('passport');
const fs = require('fs');
const multer = require('multer');

const User = require('../../models/User');
const Upload = require('../../models/Upload');

const generateUpload = require('../../src/modules/uploadDestination');

// @route   POST /file
// @desc    Upload array of files from input field 'file' - without adding to profile
// @access  Private
router.post(
	'/',
	passport.authenticate('jwt', { session: false }),
	generateUpload.array('file'),
	(req, res) => {
		const errors = {};

		if (!req.files) {
			res.status(400).json({ error: 'No files found' });
		} else {
			const uploads = [];

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
					.then(uploads.push(upload))
					.catch(err => res.json(err));
			});
			res.json(uploads);
		}
	}
);

// @route   GET /file/uploads/:id
// @desc    Get file from id
// @access  Public
router.get('/uploads/:id', (req, res) => {
	Upload.findOne({ _id: req.params.id })
		.populate('user', ['handle', 'avatar'])
		.then(upload => {
			if (!upload) {
				res.status(404).json({ error: 'No upload found' });
			}
			res.json(upload);
		})
		.catch(err => res.status(404).json(err));
});

// @route   DELETE /file
// @desc    Upload array of file names to delete
// @access  Private
router.delete(
	'/',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const errors = {};
		const stage1 = {};
		if (!req.body.fileid) {
			res.status(400).json({
				NoID: 'Delete request contains no file ID',
			});
		} else {
			Upload.findOne({ _id: req.body.fileid }, (err, upload) => {
				if (err) {
					res.status(404).json({
						IncorrectID: 'No file with this ID was found.',
					});
				} else {
					console.log(
						upload.user + ' ' + req.user.id + ' ' + req.user.role
					);
					if (
						upload.user === req.user.id ||
						req.user.role === 'admin'
					) {
						Upload.findOneAndDelete(
							{ _id: req.body.fileid },
							(err, upload) => {
								if (err) {
									res.status(404).json({
										IncorrectID:
											'No file with this ID was found.',
									});
								} else {
									fs.unlink(upload.path, err => {
										if (err) {
											res.status(404).json(err);
										} else {
											res.json({
												stage1: upload,
												stage2:
													'File successfully deleted',
											});
										}
									});
								}
							}
						);
					} else {
						res.status(401).json({
							Unauthorized:
								'You are not authorised to delete this file.',
						});
					}
				}
			});
		}
	}
);

module.exports = router;
