const express = require('express');
const router = express.Router();
const passport = require('passport');

const Application = require('../../models/Application').Application;

// @route		GET apply/test
// @desc		Test apply route
// @access	Public
router.get('/test', (req, res) => res.json('Success'));

// @route		GET apply/
// @desc		View submitted application
// @access	Private
router.get(
	'/',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Application.findOne({ user: req.user.id })
			.then(application => res.json(application))
			.catch(err => res.json(err));
	}
);

// @route		POST apply/
// @desc		Submit application to become full member
// @access	Private
router.post(
	'/',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const application = new Application({
			user: req.user.id,
			date: Date.now(),
			message: req.body.message,
		});

		application
			.save()
			.then(application => res.json(application))
			.catch(err => res.json(err));
	}
);

// @route		PUT apply/
// @desc		Edit submitted application
// @access	Private
router.put(
	'/',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		const edits = { message: req.body.message };
		Application.findOneAndUpdate(
			{ user: req.user.id },
			{ $set: edits },
			{ new: true }
		)
			.then(application => res.json(application))
			.catch(err => res.json(err));
	}
);

// @route		DELETE apply/
// @desc		Delete submitted application
// @access	Private
router.delete(
	'/',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Application.findOneAndDelete({ user: req.user.id })
			.then(res.json('Deleted'))
			.catch(err => res.json(err));
	}
);

module.exports = router;
