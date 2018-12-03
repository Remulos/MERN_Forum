const bcrypt = require('bcryptjs');

module.exports = encryptPassword = newUser => {
	// First generate the salt with a callback function.
	bcrypt.genSalt(10, (err, salt) => {
		// Inside the call back function hash the new users password.
		bcrypt.hash(newUser.password, salt, (err, hash) => {
			if (err) throw err;
			// Change the new users password to the new hash string.
			newUser.password = hash;

			// Save the whole new user object to MongoDB and return it as json.
			newUser
				.save()
				.then(user => {
					return user;
				})
				.catch(err => {
					return err;
				});
		});
	});
};
