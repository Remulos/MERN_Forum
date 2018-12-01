const express = require('express');
const router = express.Router();
const passport = require('passport');
const fs = require('fs');
const path = require('path');
const recursive = require('recursive-readdir');

router.get('/', (req, res) => {
	recursive('./uploads', (err, files) => {
		if (err) res.json(err);
		if (files) {
			const numFiles = files.length;
			res.json(numFiles);
		}
	});
});

module.exports = router;
