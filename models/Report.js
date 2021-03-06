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
	},
	itemowner: {
		type: Schema.Types.ObjectId,
	},
	type: {
		type: String,
		required: true,
	},
	date:{
		type: Date,
		default: Date.now,
	},
	status: [
		{
			date: {
				type: Date,
				default: Date.now,
			},
			status: {
				type: String,
				required: true,
			},
		},
	],
});

ReportSchema.plugin(require('mongoose-paginate'));

const Report = mongoose.model('report', ReportSchema);
const ArchivedReport = mongoose.model('archivedReport', ReportSchema);

module.exports = { Report, ArchivedReport };
