const mongoose = require('mongoose');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');

let destPath;

const generateUpload = () => {
	const year = new Date().getUTCFullYear();
	const month = new Date().getUTCMonth();
	const day = new Date().getUTCDate();
	destPath = `./uploads/${year}/${month}/${day}/`;

	const storage = multer.diskStorage({
		destination: destPath,
		filename: function(req, file, cb) {
			crypto.pseudoRandomBytes(16, function(err, raw) {
				cb(
					null,
					raw.toString('hex') +
						Date.now() +
						path.extname(file.originalname)
				);
			});
		},
	});

	upload = multer({ storage: storage });
	return upload;
};

generateUpload();

module.exports = upload;
