const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'user',
	},
	ref: {
		type: Schema.Types.ObjectId,
	},
	type: {
		type: String,
		required: true,
	},
	date: {
		type: Date,
	},
	text: {
		type: String,
	},
	attachments: [
		{
			type: Schema.Types.ObjectId,
			ref: 'upload',
		},
	],
});

CommentSchema.plugin(require('mongoose-paginate'));

module.exports = Comment = mongoose.model('comment', CommentSchema);
