const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UploadSchema = new Schema({
	filename: {
		type: String,
		required: true,
	},
	originalname: {
		type: String,
	},
	path: {
		type: String,
		require: true,
	},
	mimetype: {
		type: String,
		required: true,
	},
	date: {
		type: Date,
		default: Date.now,
	},
	size: {
		type: String,
		required: true,
	},
	user: {
		type: Schema.Types.ObjectId,
		ref: 'user',
	},
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
				required: true,
			},
		},
	],
	likes: [
		{
			user: {
				type: Schema.Types.ObjectId,
				ref: 'user',
			},
		},
	],
	viewCount: {
		type: Number,
	},
});

module.exports = Upload = mongoose.model('uploads', UploadSchema);
