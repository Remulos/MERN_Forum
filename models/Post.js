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
			type: Schema.Types.ObjectId,
			ref: 'upload',
		},
	],
	date: {
		type: Date,
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
			type: Schema.Types.ObjectId,
			ref: 'comment',
		},
	],
	division: {
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

PostSchema.plugin(require('mongoose-paginate'));

module.exports = Post = mongoose.model('post', PostSchema);
