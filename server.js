const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const scheduler = require('node-schedule');
const fs = require('fs');

const app = express();

const isEmpty = require('./src/modules/is-empty');

const User = require('./models/User').User;
const Division = require('./models/Division');

// bodyParser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Passport middleware
app.use(passport.initialize());

// Passport Config
require('./config/passport')(passport);

// Load route files
// Setup routes
app.use('/user', require('./routes/api/user'));
app.use('/post', require('./routes/api/post'));
app.use('/file', require('./routes/api/file'));
app.use('/admin', require('./routes/api/admin'));
app.use('/report', require('./routes/api/report'));
app.use('/apply', require('./routes/api/apply'));

const uri = require('./config/keys').mongoURI;

// Connect to MongoDB
mongoose
	.connect(
		uri,
		{ useNewUrlParser: true }
	)
	.then()
	.catch(err => console.log(err));

const db = mongoose.connection;

// Logging key connection statuses to console
db.on('connecting', () =>
	console.log(`Mongoose default connection to ${uri} is loading...`)
);

db.on('connected', () => {
	console.log(`Mongoose default connection is open to ${uri}`);
	Division.find({}).then(divdoc => {
		if (isEmpty(divdoc)) {
			const divisions = [
				{ name: 'Recruit', description: 'Everyone who signs up.' },
				{ name: 'Member', description: 'Accepted members.' },
			];

			const addDevisions = new Division({ divarray: divisions });
			addDevisions.save();
		}
	});
});

db.on('error', err =>
	console.log(`Mongoose default connection has encountered ${err} error.`)
);

db.on('disconnected', () =>
	console.log('Mongoose default connection is disconnected')
);

process.on('SIGINT', () => {
	db.close(() => {
		console.log(
			'Mongoose default connection is disconnected due to application termination'
		);
		process.exit(0);
	});
});

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));
