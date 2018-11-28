// Defining the jwt passport strategy
// passport-jwt info at https://github.com/themikenicholson/passport-jwt
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
const mongoose = require('mongoose');

// model defined in /models/User.js
const User = mongoose.model('user');

const keys = require('../config/keys');

const opts = {};
opts.secretOrKey = keys.secretOrKey;
opts.jwtFromRequest = ExtractJWT.fromAuthHeaderAsBearerToken();

module.exports = passport => {
	passport.use(
		new JwtStrategy(opts, (jwt_payload, done) => {
			User.findById(jwt_payload.id)
				.then(user => {
					if (user) {
						return done(null, user);
					}
					if (!user) {
						return done(null, false);
					}
				})
				.catch(err => console.log(err));
		})
	);
};
