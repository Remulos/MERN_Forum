const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const GridFSStorage = require('multer-gridfs-storage');
const crypto = require('crypto');
const passport = require('passport');

const User = require('../../models/User');

let upload;

// Multer storage engine
mongoose.connection.on('connected', () => {
	if (mongoose.connection.readyState === 1) {
		const storage = new GridFSStorage({
			db: mongoose.connection.db,
			file: (req, file) => {
				return new Promise((resolve, reject) => {
					crypto.randomBytes(16, (err, buf) => {
						if (err) {
							return reject(err);
						}
						const filename =
							buf.toString('hex') +
							path.extname(file.originalname);
						const fileInfo = {
							filename: filename,
							metadata: { uploader_user_id: req.body.id },
						};
						resolve(fileInfo);
					});
				});
			},
		});
		upload = multer({ storage: storage });
	} else {
		console.log({ msg: 'Failure' });
	}
});

mongoose.connection.on('connected', () => {
	const multerSetUp = require('../../src/modules/gridFsStorage');
	router.post(
		'/test3',
		passport.authenticate('jwt', { session: false }),
		multerSetUp,
		(req, res) => {
			const errors = {};

			User.findById(req.user.id).then(user => {
				if (!user) {
					errors.nouser = 'Cannot find user';
					res.status(404).json(errors);
				} else {
					req.files.forEach(file => {
						user.uploads.unshift({ uploadid: file.id });
					});
					user.save()
						.then(user =>
							res.json({ user: user, files: req.files })
						)
						.catch(err => res.json(err));
				}
			});
		}
	);
});

module.exports = router;
