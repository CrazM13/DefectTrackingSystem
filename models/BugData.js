const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var BugDataSchema = new Schema({

	project: {
		type: String,
		required: true
	},
	name: {
		type: String,
		required: true
	},
	type: {
		type: String,
		required: true
	},
	status: {
		type: String,
		required: true
	},
	enviornment: {
		os: {
			type: String,
			required: false
		},
		platform: {
			type: String,
			required: false
		},
		extra: {
			type: String,
			required: false
		}
	},
	description: {
		type: String,
		required: true
	},
	steps: {
		type: String,
		required: true
	},
	reporter: {
		type: String,
		required: true
	},
	assignee: {
		type: String,
		required: false
	},
	date: {
		type: String,
		default: Date.now
	}

});

mongoose.model('BugList', BugDataSchema);