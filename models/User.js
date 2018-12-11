const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	handle: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
	about: {
		type: String,
	},
	registerdate: {
		type: Date,
		required: true,
	},
	dob: {
		type: Date,
		required: true,
	},
	signature: {
		type: String,
	},
	timezone: {
		type: String,
	},
	role: {
		type: String,
	},
	preferences: {
		newsletter: {
			type: Boolean,
			default: true,
		},
		autofollowpost: {
			type: Boolean,
			default: true,
		},
		autofollowreply: {
			type: Boolean,
			default: true,
		},
		autofollowmethod: {
			type: Number,
			default: 0,
		},
		shownotificationpopup: {
			type: Boolean,
			default: true,
		},
		singleemailbetweenvisit: {
			type: Boolean,
			default: false,
		},
		playnotificationsound: {
			type: Boolean,
			default: true,
		},
		receivemessage: {
			type: Number,
			default: 0,
		},
		addedtoconvo: {
			type: Number,
			default: 0,
		},
		contentfollownew: {
			type: Number,
			default: 0,
		},
		contentfollowcomment: {
			type: Number,
			default: 0,
		},
		contentfollowreview: {
			type: Number,
			default: 0,
		},
		personfollowpost: {
			type: Number,
			default: 0,
		},
		selfquoted: {
			type: Number,
			default: 0,
		},
		selfmention: {
			type: Number,
			default: 0,
		},
		selfcontentrep: {
			type: Number,
			default: 0,
		},
		selffollow: {
			type: Number,
			default: 0,
		},
		selfprofilepost: {
			type: Number,
			default: 0,
		},
		statusreply: {
			type: Number,
			default: 0,
		},
		personfollowstatus: {
			type: Number,
			default: 0,
		},
		selfclubinvite: {
			type: Number,
			default: 0,
		},
		selfclubrequestresponse: {
			type: Number,
			default: 0,
		},
		memberclubrequest: {
			type: Number,
			default: 0,
		},
		memberjoinclub: {
			type: Number,
			default: 0,
		},
		eventreminders: {
			type: Number,
			default: 0,
		},
	},
	avatar: {
		type: Schema.Types.ObjectId,
		ref: 'upload',
	},
	coverphoto: {
		type: Schema.Types.ObjectId,
		ref: 'upload',
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
	following: [
		{
			type: Schema.Types.ObjectId,
			ref: 'user',
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
	lastloggedin: {
		type: Date,
	},
	divisions: [
		{
			name: {
				type: String,
				default: 'Recruit',
			},
		},
	],
	ban: [
		{
			reason: {
				type: String,
				required: true,
			},
			start: {
				type: Date,
				required: true,
			},
			end: {
				type: Date,
				required: true,
			},
		},
	],
});

UserSchema.plugin(require('mongoose-paginate'));

module.exports = User = mongoose.model('user', UserSchema);
