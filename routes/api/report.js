const express = require('express');
const router = express.Router();
const passport = require('passport');

// Load models
const Report = require('../../models/Report');
const User = require('../../models/User');
const Upload = require('../../models/Upload');
const Post = require('../../models/Post');
const Comment = require('../../models/Comment');

// @route   report/test
// @desc    Testing the report route
// @access  Public
router.get('/test', (req, res) => res.status(200).json({ success: true }));

// @route   POST report/?user
// @desc    Report a user
// @access  Private
router.post(
	'/:id',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const newReport = new Report({
			reporter: req.user.id,
			category: req.body.category,
			text: req.body.text,
			item: req.params.id,
			date: [],
			type: req.body.type,
		});
		newReport.date.push(Date.now());
		newReport
			.save()
			.then(report => res.json(report))
			.catch(err => res.json(err));
	}
);

module.exports = router;
