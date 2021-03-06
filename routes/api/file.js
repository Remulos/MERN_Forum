const express = require('express');
const router = express.Router();
const passport = require('passport');
const fs = require('fs');

// Load models
const Upload = require('../../models/Upload');
const User = require('../../models/User').User;

// Load multer storage middleware method
const fileUpload = require('../../src/modules/fileUpload');
const checkBanned = require('../../src/modules/checkBanned');

// @route   GET file/test
// @desc    Test route
// @access  Public
router.get('/test', (req, res) => res.status(200).json({ msg: 'success' }));

// @route   POST file/
// @desc    Upload array of files from input field 'file' - without adding to profile
// @access  Private
router.post(
	'/',
	passport.authenticate('jwt', { session: false }),
	checkBanned(),
	fileUpload.array('file'),
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

// @route   GET file/uploads/:id
// @desc    Get file from id
// @access  Public
// TODO - Link to filesystem
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

// @route   DELETE file/delete/:id
// @desc    Delete upload through id
// @access  Private
router.delete(
	'/delete/:id',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		if (!req.params.id) {
			res.status(400).json({
				NoID: 'Delete request contains no file ID',
			});
		} else {
			// Find the Upload document in the database based by document id.
			Upload.findOne({ _id: req.params.id }, (err, upload) => {
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
							{ _id: req.params.id },
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

// @route   GET file/uploads/user/:id
// @desc    Get all files uploaded by user
// @access  Public
// TODO - Link to filesystem
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
				const profilePicCheck = async () => {
					const removeProfilePics = async () => {
						const user = await User.findById(req.params.id);

						const avatarIndex = await uploads
							.map(upload => upload.id)
							.indexOf(user.avatar.toHexString());

						const coverphotoIndex = await uploads
							.map(upload => upload.id)
							.indexOf(user.coverphoto.toHexString());

						if (coverphotoIndex != -1) {
							await uploads.splice(coverphotoIndex, 1);
						}

						if (avatarIndex != -1) {
							await uploads.splice(avatarIndex, 1);
						}
						return uploads;
					};
					res.status(200).json(await removeProfilePics());
				};
				profilePicCheck();
			}
		});
	}
);

module.exports = router;
