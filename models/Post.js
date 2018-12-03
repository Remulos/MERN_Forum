const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'user',
	},
	title: {
		type: String,
		require: true,
	},
	text: {
		type: String,
		required: true,
	},
	attachments: [
		{
			upload: {
				type: Schema.Types.ObjectId,
				ref: 'upload',
			},
		},
	],
	date: {
		type: Date,
		default: Date.now,
	},
	likes: [
		{
			user: {
				type: Schema.Types.ObjectId,
				ref: 'user',
			},
			date: {
				type: Date,
				default: Date.now,
			},
		},
	],
	comments: [
		{
			comment: {
				type: Schema.Types.ObjectId,
				ref: 'comment',
			},
		},
	],
	category: {
		type: String,
		required: true,
	},
	pinned: {
		type: Boolean,
		default: false,
	},
	starred: {
		type: Boolean,
		default: false,
	},
	locked: {
		type: Boolean,
		default: false,
	},
});

module.exports = Post = mongoose.model('post', PostSchema);
