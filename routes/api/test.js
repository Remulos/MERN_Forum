const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const GridFSStorage = require('multer-gridfs-storage');
const crypto = require('crypto');

let upload;

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

mongoose.connection.once('connected', () => {
	router.post('/test2', upload.single('file'), (req, res) => {
		// TODO
		// Add info to Profile
		// Add authentication method before upload
		res.json({ msg: 'success' });
	});
});

module.exports = router;

// ------------------------------------------Working!! Upload!!----------------------------------------------------
// ----------------------------------------------------------------------------------------------------------------
/* const fs = require('fs');
const mongodb = require('mongodb');

router.post(
	'/',
	multer({ dest: '../../uploads' }).single('file'),
	(req, res) => {
		test(req, res);
	}
);

const test = (req, res) => {
	if (mongoose.connection.readyState === 1) {
		const bucket = new mongodb.GridFSBucket(mongoose.connection.db);

		fs.createReadStream(`../../uploads/${req.file.filename}`)
			.pipe(bucket.openUploadStream(req.file.filename))
			.on('error', err => {
				console.log(err);
			})
			.on('finish', () => {
				res.json({ msg: 'file uploaded successfully' });
			});
	} else {
		res.json();
	}
}; */
