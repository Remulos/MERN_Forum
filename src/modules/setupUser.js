const ifFile = require('./ifFile');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');

const Upload = require('../../models/Upload');

module.exports = setupUserModel = async (req, cb) => {
	let newUser;
	let coverphoto;
	let avatar;

	if (req.files) {
		const userInfo = {
			name: req.body.name,
			handle: req.body.handle,
			email: req.body.email,
			password: req.body.password,
			date: req.body.date,
			dob: req.body.dob,
			timezone: req.body.timezone,
			role: 'Civilian',
		};

		if (req.files['avatar'][0]) {
			avatar = await ifFile(req, 'avatar');
			userInfo.avatar = avatar;
		}

		if (req.files['coverphoto'][0]) {
			coverphoto = await ifFile(req, 'coverphoto');
			userInfo.coverphoto = coverphoto;
		}
		const createNewUser = () => {
			return (newUser = new User(userInfo).save());
		};

		const user = await createNewUser();
		await Upload.findByIdAndUpdate(avatar.id, { $set: { user: user } });
		await Upload.findByIdAndUpdate(coverphoto.id, { $set: { user: user } });

		return user;
	} else {
		newUser = new User(userInfo);
		return newUser;
	}
};
