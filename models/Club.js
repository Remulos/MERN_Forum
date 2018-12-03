const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClubSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	avatar: {
		type: Schema.Types.ObjectId,
		ref: 'upload',
	},
	coverphoto: {
		type: Schema.Types.ObjectId,
		ref: 'upload',
	},
	posts: {
		type: Schema.Types.ObjectId,
		ref: 'post',
	},
	members: [
		{
			user: {
				type: Schema.Types.ObjectId,
				ref: 'user',
			},
			clubrole: {
				type: String,
				required: true,
			},
			permissions: {
				type: Number,
				default: 0,
			},
			follow: {
				type: Boolean,
				require: true,
			},
		},
	],
});

module.exports = Club = mongoose.model('club', ClubSchema);
