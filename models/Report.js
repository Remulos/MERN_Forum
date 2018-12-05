const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReportSchema = new Schema({
	reporter: {
		type: Schema.Types.ObjectId,
		ref: 'user',
	},
	category: {
		type: String,
		required: true,
	},
	text: {
		type: String,
		required: true,
	},
	item: {
		type: Schema.Types.ObjectId,
		ref: 'comment',
	},
	type: {
		type: String,
		required: true,
	},
	date: [
		{
			type: Date,
			required: true,
		},
	],
	status: {
		type: String,
	},
});

module.exports = Report = mongoose.model('report', ReportSchema);
