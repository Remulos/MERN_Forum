const validator = require('validator');
const isEmpty = require('../src/modules/is-empty');

module.exports = function validatePostInput(data) {
	let errors = {};

	data.title = !isEmpty(data.title) ? data.title : '';
	data.text = !isEmpty(data.text) ? data.text : '';

	if (!validator.isLength(data.title, { min: 2, max: 30 })) {
		errors.title = 'Title must be between 2 and 30 characters';
	}

	if (validator.isEmpty(data.title)) {
		errors.title = 'Title is required';
	}

	if (!validator.isLength(data.text, { min: 2, max: 3000 })) {
		errors.text = 'Maximum of 3000 characters has been reached.';
	}

	if (validator.isEmpty(data.text)) {
		errors.text = 'Post must contain at least 2 characters.';
	}

	return {
		errors,
		isValid: isEmpty(errors),
	};
};
