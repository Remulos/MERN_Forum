const cluster = require('cluster');
const { cpus } = require('os');
const numWorkers = cpus().length;
const isMaster = cluster.isMaster;

if (isMaster) {
	console.log('I am master!');
	const workers = [...Array(numWorkers)].map(_ => cluster.fork());

	cluster.on('online', worker =>
		console.log(`Worker ${worker.process.id} is online`)
	);
	cluster.on('exit', (worker, exitCode) => {
		console.log(`Worker ${worker.process.id} exited with code ${exitCode}`);
		console.log('Starting a new Worker');
		cluster.fork();
	});
} else {
	const express = require('express');
	const mongoose = require('mongoose');
	const bodyParser = require('body-parser');
	const passport = require('passport');
	const scheduler = require('node-schedule');
	const fs = require('fs');

	const app = express();

	// Load models
	const User = require('./models/User');

	// Load route files
	const user = require('./routes/api/user');
	const post = require('./routes/api/post');
	const test = require('./routes/api/test');
	const admin = require('./routes/api/admin');

	// bodyParser middleware
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());

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

	db.on('connected', () =>
		console.log(
			`Mongoose default connection is open to ${uri} on port ${port}`
		)
	);

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

	// Passport middleware
	app.use(passport.initialize());

	// Passport Config
	require('./config/passport')(passport);

	// Setup routes
	app.use('/user', user);
	app.use('/post', post);
	app.use('/test', test);
	app.use('/admin', admin);

	// Scheduled db stats query

	scheduler.scheduleJob('* 0 * * *', () => {
		User.countDocuments((err, count) => {
			fs.readFile('./logs/users.json', (err, data) => {
				const json = JSON.parse(data);
				const timestamp = Date.now();
				json.push({ count: count, timestamp: timestamp });
				fs.writeFile('./logs/users.json', JSON.stringify(json), err => {
					if (err) throw err;
				});
			});
		});
	});

	const port = process.env.PORT || 5000;

	app.listen(port);
}
