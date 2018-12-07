const express = require('express');
const router = express.Router();
const passport = require('passport');

// Load models
const Report = require('../../models/Report').Report;

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
			type: req.body.type,
		});
		const status = {
			date: Date.now(),
			status: req.body.status,
		};

		newReport.status.push(status);

		newReport
			.save()
			.then(report => res.json(report))
			.catch(err => res.json(err));
	}
);

module.exports = router;
