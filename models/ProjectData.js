const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var ProjectDataSchema = new Schema({

	name: {
		type: String,
		required: true
	},
	users: [
		{
			user: {
				type: String,
				required: true
			},
			admin: {
				type: Boolean,
				required: true
			}
		}
	],
	bugs: [
		{
			name: {
				type: String,
				required: true
			},
			type: {
				type: String,
				required: true
			},
			severity: {
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
				default: new Date(Date.now()).toTimeString()
			},
			style: {
				type: String,
				default: "dark"
			}
		}
	],
	date: {
		type: String,
		default: Date.now()
	},
	major_count: {
		type: Number,
		default: 0
	},
	minor_count: {
		type: Number,
		default: 0
	},
	nth_count: {
		type: Number,
		default: 0
	}

});

mongoose.model('ProjectList', ProjectDataSchema);