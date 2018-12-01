const express = require('express');
const router = express.Router();
const passport = require('passport');
const fs = require('fs');

// Load models
const Upload = require('../../models/Upload');

// Load multer storage middleware method
const generateUpload = require('../../src/modules/uploadDestination');

// @route   GET /file/test
// @desc    Test route
// @access  Public
router.get('/test', (req, res) => res.status(200).json({ msg: 'success' }));

// @route   POST /file
// @desc    Upload array of files from input field 'file' - without adding to profile
// @access  Private
router.post(
	'/',
	passport.authenticate('jwt', { session: false }),
	generateUpload.array('file'),
	(req, res) => {
		if (!req.files) {
			res.status(404).json({ error: 'No files found' });
		} else {
			// Create uploads variable for returned upload documents
			const uploads = [];

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
					.then(uploads.push(upload))
					.catch(err => res.status(400).json(err));
			});
			res.status(202).json(uploads);
		}
	}
);

// @route   GET /file/uploads/:id
// @desc    Get file from id
// @access  Public
// TODO  		Link to filesystem
router.get('/uploads/:id', (req, res) => {
	Upload.findOne({ _id: req.params.id })
		.populate('user', ['handle', 'avatar'])
		.then(upload => {
			if (!upload) {
				res.status(404).json({ error: 'No upload found' });
			}
			res.status(200).json(upload);
		})
		.catch(err => res.status(404).json(err));
});

// @route   DELETE /file
// @desc    Delete upload through id
// @access  Private
router.delete(
	'/',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		if (!req.body.fileid) {
			res.status(400).json({
				NoID: 'Delete request contains no file ID',
			});
		} else {
			// Find the Upload document in the database based by document id.
			Upload.findOne({ _id: req.body.fileid }, (err, upload) => {
				if (err) {
					res.status(404).json({
						IncorrectID: 'No file with this ID was found.',
					});
				} else {
					// Check that current user has permissions to delete the file.
					if (
						upload.user === req.user.id ||
						req.user.role === 'admin'
					) {
						// Delete the record of the file from the database and use the returned document to delete(unlink) the file from the file system in the callback.
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
											res.status(400).json(err);
										} else {
											// Return both the deleted database document and a successfull delete message.
											res.status(200).json({
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

// @route   GET /file/uploads/user/:id
// @desc    Get all files uploaded by user
// @access  Public
// TODO  		Link to filesystem
router.get(
	'/uploads/user/:id',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Upload.find({ user: req.params.id }, (err, uploads) => {
			if (err) {
				res.status(404).json({
					Error: 'Unable to find any files with this user id.',
				});
			} else {
				res.status(200).json(uploads);
			}
		});
	}
);

module.exports = router;
