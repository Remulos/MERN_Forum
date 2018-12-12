const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ApplicationSchema = new Schema({
	user: {
		type: Schema.Types.ObjectId,
		ref: 'user',
	},
	date: {
		type: Date,
		required: true,
	},
	message: {
		type: String,
		required: true,
	},
});

ApplicationSchema.plugin(require('mongoose-paginate'));

const Application = mongoose.model('application', ApplicationSchema);
const ArchivedApplication = mongoose.model(
	'archivedapplication',
	ApplicationSchema
);

module.exports = { Application, ArchivedApplication };
