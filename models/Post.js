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
	images: [
		{
			link: {
				type: String,
				required: true,
			},
			name: {
				type: String,
			},
		},
	],
	attachments: [
		{
			link: {
				type: String,
				required: true,
			},
			name: {
				type: String,
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
			user: {
				type: Schema.Types.ObjectId,
				ref: 'user',
			},
			date: {
				type: Date,
				default: Date.now,
			},
			text: {
				type: String,
			},
			images: [
				{
					uploadid: {
						type: String,
						required: true,
					},
					name: {
						type: String,
					},
				},
			],
		},
	],
	category: {
		type: String,
		required: true,
	},
});

module.exports = Post = mongoose.model('post', PostSchema);
