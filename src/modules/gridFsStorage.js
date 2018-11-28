const mongoose = require('mongoose');
const crypto = require('crypto');
const GridFSStorage = require('multer-gridfs-storage');
const path = require('path');

let storage;

mongoose.connection.on('connected', () => {
	if (mongoose.connection.readyState === 1) {
		storage = new GridFSStorage({
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
							metadata: { uploader_user_id: req.user.id },
						};
						resolve(fileInfo);
					});
				});
			},
		});
	} else {
		console.log({ msg: 'Failure' });
	}
	return storage;
});

module.exports = storage;
