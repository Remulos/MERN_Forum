const validator = require('validator');
const isEmpty = require('../src/modules/is-empty');

module.exports = function validateLoginInput(data) {
	let errors = {};

	data.email = !isEmpty(data.email) ? data.email : '';
	data.password = !isEmpty(data.password) ? data.password : '';

	// Email validation
	if (validator.isEmpty(data.email)) {
		errors.email = 'Email is required';
	}

	if (!validator.isEmail(data.email)) {
		errors.email = 'Not a valid email';
	}

	// Password validation
	if (validator.isEmpty(data.password)) {
		errors.password = 'Password is required';
	}

	return {
		errors,
		isValid: isEmpty(errors),
	};
};
