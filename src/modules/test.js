const addUploads = async (files, id, done) => {
	const uploads = [];
	for (const file of files) {
		const upload = new Upload({
			filename: file.filename,
			path: file.path,
			mimetype: file.mimetype,
			size: file.size,
			originalname: file.originalname,
			user: id,
		});

		file.link = upload.path;
		file.name = upload.originalname;
		console.log(file);
		upload.save((err, upload) => {
			if (err) {
				return done(Error('Failed to save upload'));
			} else {
				uploads.push(upload);
			}
		});
	}
	console.log(uploads);
	return done(null, uploads);
};

module.exports = addFiles = async (files, id, done) => {
	await new Promise((resolve, reject) => {
		addUploads((files, id, done), (err, result) => {
			if (err) {
				reject(err);
			} else resolve(result);
		});
	});
};
