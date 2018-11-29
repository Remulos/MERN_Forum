const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const GridFSStorage = require('multer-gridfs-storage');
const crypto = require('crypto');

let upload;

const multerSetUp = () => {
	let storage;
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
							metadata: { uploader_user_id: req.body.id },
						};
						resolve(fileInfo);
					});
				});
			},
		});
	} else {
		console.log({ msg: 'No mongoose connection found' });
	}
	upload = multer({ storage: storage }).array('file', 10);
	return upload;
};

multerSetUp();

module.exports = upload;
