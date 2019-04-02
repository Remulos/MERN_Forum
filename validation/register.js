const validator = require('validator');
const isEmpty = require('../src/modules/is-empty');

module.exports = function validateRegisterInput(data) {
	let errors = {};

	data.name = !isEmpty(data.name) ? data.name : '';
	data.handle = !isEmpty(data.handle) ? data.handle : '';
	data.email = !isEmpty(data.email) ? data.email : '';
	data.password = !isEmpty(data.password) ? data.password : '';
	data.password2 = !isEmpty(data.password2) ? data.password2 : '';
	data.dob = !isEmpty(data.dob) ? data.dob : '';

	// Name Validation
	if (!validator.isLength(data.name, { min: 2, max: 30 })) {
		errors.name = 'Name must be between 2 and 30 characters';
	}

	if (validator.isEmpty(data.name)) {
		errors.name = 'Name field is required';
	}

	// Name Validation
	if (!validator.isLength(data.handle, { min: 2, max: 16 })) {
		errors.handle = 'Handle must be between 2 and 16 characters';
	}

	if (validator.isEmpty(data.handle)) {
		errors.handle = 'Handle field is required';
	}

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

	if (!validator.isLength(data.password, { min: 6, max: 30 })) {
		errors.password = 'Pass must be between 2 and 30 characters';
	}

	// Password2 validation
	if (!validator.equals(data.password, data.password2)) {
		errors.password2 = 'Passwords must match';
	}

	if (validator.isEmpty(data.password2)) {
		errors.password2 = 'Confirm Password is required';
	}

	// Date of Birth validation
	if (validator.isEmpty(data.dob)) {
		errors.dob = 'Date of birth is required.';
	}

	return {
		errors,
		isValid: isEmpty(errors),
	};
};
