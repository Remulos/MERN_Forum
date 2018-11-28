const router = require('express').Router();
const passport = require('passport');
const multer = require('multer');
const Grid = require('gridfs-stream');
const upload = require('./storage').upload;
const gfs = require('./storage').gfs;

/* const mongoose = require('mongoose');
const multer = require('multer');
const Grid = require('gridfs-stream');
const GridFsStorage = require('multer-gridfs-storage');
const path = require('path');
const crypto = require('crypto');

const uri = require('../../config/keys').mongoURI;

let gfs;

const conn = mongoose.connection;

conn.once('open', () => {
	gfs = Grid(conn.db, mongoose.mongo);
	gfs.collection('uploads');
});

const storage = new GridFsStorage({
	url: uri,
	file: (req, file) => {
		return new Promise((resolve, reject) => {
			crypto.randomBytes(16, (err, buf) => {
				if (err) {
					return reject(err);
				}
				const filename =
					buf.toString('hex') + path.extname(file.originalname);
				const fileInfo = {
					filename: filename,
					bucketName: 'uploads',
				};
				resolve(fileInfo);
			});
		});
	},
});
const upload = multer({ storage }); */

// @route   GET files/test
// @desc    Test files route
// @access  Public
router.get('/test', (req, res) => res.json({ msg: 'success' }));

// @route   POST files/upload
// @desc    Uploads file to db
// @access  Private
router.post(
	'/upload',
	passport.authenticate('jwt', { session: false }),
	upload.single('file'),
	(req, res) => {
		res.json({ file: req.file });
	}
);

// @route   POST files/upload
// @desc    Uploads file to db
// @access  Private
router.post(
	'/upload/array',
	passport.authenticate('jwt', { session: false }),
	upload.array('file'),
	(req, res) => {
		res.json({ file: req.file });
	}
);

// @route   GET files/
// @desc    Display all files in JSON
// @access  Private
router.get('/', (req, res) => {
	gfs.files.find().toArray((err, files) => {
		if (!files || files.length === 0) {
			return res.status(404).json({ nofiles: 'No files exist' });
		}
		return res.json(files);
	});
});

// @route   GET files/:filename
// @desc    Find single file
// @access  Private
router.get('/:filename', (req, res) => {
	gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
		if (!file || file.length === 0) {
			return res
				.status(404)
				.json({ nofile: 'No file with this filename exists.' });
		}
		return res.json(file);
	});
});

// @route   GET files/image/:filename
// @desc    Display single image
// @access  Private
router.get('/image/:filename', (req, res) => {
	gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
		if (!file || file.length === 0) {
			return res
				.status(404)
				.json({ nofile: 'No file with this filename exists.' });
		}

		// Check if image
		if (
			file.contentType === 'image/jpeg' ||
			file.contentType === 'image/png' ||
			file.contentType === 'image/bmp' ||
			file.contentType === 'image/gif'
		) {
			// Read stream output to browser
			const readstream = gfs.createReadStream(file.filename);
			readstream.pipe(res);
		} else {
			res.status(404).json({
				notimage: 'File is not an image.',
			});
		}
	});
});

module.exports = router;
