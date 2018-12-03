const Upload = require('../../models/Upload');

module.exports = ifFile = async (req, image) => {
	const upload = new Upload({
		filename: req.files[image][0].filename,
		path: req.files[image][0].path,
		mimetype: req.files[image][0].mimetype,
		size: req.files[image][0].size,
		originalname: req.files[image][0].originalname,
	});
	const newUpload = await upload.save();
	return newUpload;
};
