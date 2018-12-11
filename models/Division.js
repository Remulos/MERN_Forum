const mongoose = require('mongoose');

const DivisionSchema = new mongoose.Schema({
	divarray: [
		{
			name: {
				type: String,
				required: true,
			},
			description: {
				type: String,
				required: true,
			},
		},
	],
});

module.exports = Division = mongoose.model('division', DivisionSchema);
