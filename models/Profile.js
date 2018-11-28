const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProfileSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'user',
	},
	handle: {
		type: Schema.Types.ObjectId,
		ref: 'user',
	},
	avatar: {
		type: String,
		default: '',
	},
	coverphoto: {
		type: String,
		default: '',
	},
	reputation: {
		type: Number,
		default: 0,
	},
	interests: [{ type: String }],
	warningpoints: {
		type: Number,
		default: 0,
	},
	followers: [
		{
			user: {
				type: String,
				required: true,
			},
		},
	],
	rank: {
		type: String,
		default: 0,
	},
	gender: {
		type: String,
	},
	location: {
		type: String,
	},
	clubs: [
		{
			clubid: {
				type: String,
				required: true,
			},
			name: {
				type: String,
				required: true,
			},
			role: {
				type: String,
				required: true,
			},
			permissions: {
				type: Number,
				default: 0,
			},
			follow: {
				type: Boolean,
				default: true,
			},
		},
	],
	date: {
		type: Date,
		default: Date.now,
	},
	contentcount: {
		type: Number,
		default: 0,
	},
	allowfollow: {
		type: Boolean,
		default: true,
	},
	posts: [
		{
			postid: {
				type: String,
				required: true,
			},
			follow: {
				type: Boolean,
				default: true,
			},
		},
	],
	comments: [
		{
			commentid: {
				type: String,
				required: true,
			},
			follow: {
				type: Boolean,
				default: true,
			},
		},
	],
	likes: [
		{
			likeid: {
				type: String,
				required: true,
			},
			follow: {
				type: Boolean,
				default: true,
			},
		},
	],
	ships: [
		{
			name: {
				type: String,
			},
			number: {
				type: Number,
				default: 1,
			},
		},
	],
});

module.exports = Profile = mongoose.model('profile', ProfileSchema);
