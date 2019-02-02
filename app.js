const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const handlebars = require('handlebars');
const exphbs = require('express-handlebars');

const app = express();
const router = express.Router();

const port = 1222;

mongoose.connect("mongodb://localhost:27017/dts", {
	useNewUrlParser: true
}).then(() => {
	console.log("MongoDB Connected");
}).catch((err) => {
	console.log(err);
});

// MongoDB UserData
require('./models/UserData');
const UserData = mongoose.model('Users');

// MongoDB BugData
require('./models/ProjectData');
const ProjectData = mongoose.model('ProjectList');

// Use Template Engine
app.engine('handlebars', exphbs({
	defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// Functions Needed To Run Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//#region Routs
// Route To Index
router.get('/', (req, res) => {
	res.redirect('/login');
});

router.get('/home/:user', (req, res) => {
	UserData.findOne({ _id: req.params.user }).then((entry) => {
		if (entry != null) {
			ProjectData.find({ 'users.user': entry.id }).then((projects) => {
				res.render('home', { user: req.params.user, first_name: entry.first_name, projects: projects });
			});
		} else res.render('login', { error: "No User Found" });
	});
});

// Route To The Bugs Menu
router.get('/bugs/:user', (req, res) => {
	res.render('bugpages/bugmenu', { user: req.params.user});
});

// Route To The Add Bug Page
router.get('/createbug/:user', (req, res) => {
	ProjectData.find({ 'users.user': req.params.user }).then((projects) => {
		res.render('bugpages/createbug', { user: req.params.user, projects: projects });
	});
});

// Route To The Search Bug Page
router.get('/search/:user', (req, res) => {
	ProjectData.find({ 'users.user': req.params.user }).then((projects) => {
		res.render('bugpages/searchbug', { user: req.params.user, projects: projects});
	});
});

// Route To The Edit Bug Page
router.get('/editbug/:user', (req, res) => {
	res.render('bugpages/bugmenu', { user: req.params.user });
});

// Route To The Search Bug Page
router.get('/search/:user', (req, res) => {
	res.render('bugpages/bugmenu', { user: req.params.user });
});

// Route To The Projects Menu
router.get('/projects/:user', (req, res) => {
	res.render('projectpages/projectmenu', { user: req.params.user });
});

// Route To Create Projects
router.get('/createproject/:user', (req, res) => {
	res.render('projectpages/createproject', { user: req.params.user });
});

// Route To The Projects List
router.get('/projectlist/:user', (req, res) => {
	ProjectData.find({ 'users.user': req.params.user }).then((projects) => {
		
		for (var i = 0; i < projects.length; i++) {
			for (var j = 0; j < projects[i].users.length; j++) {
				if (req.params.user == projects[i].users[j].user) {
					projects[i].localadmin = projects[i].users[j].admin;
					break;
				}
			}
		}
		
		res.render('projectpages/projectslist', { user: req.params.user, projects: projects });
	});
});

// Route To The Projects Add Users
router.get('/projectadduser/:project/:user', (req, res) => {
	ProjectData.findOne({ _id: req.params.project }).then((project) => {
		res.render('projectpages/projectadduser', { user: req.params.user, project: project });
	});
});


// Route To The Log In
router.get('/login', (req, res) => {
	res.render('login');
});

// Route To Sign Up
router.get('/signup', (req, res) => {
	res.render('signup');
});
//#endregion

//#region Posts
app.post('/newuser', (req, res) => {
	var newEntry = {
		email: req.body.email,
		password: Encrypt(req.body.password, req.body.email),
		first_name: req.body.first_name,
		last_name: req.body.last_name
	};
	new UserData(newEntry).save().then((entry) => {
		res.redirect('/home/' + entry.id);
	});
});

app.post('/loginuser', (req, res) => {
	UserData.findOne({email: req.body.email}).then((entry) => {
		if (entry != null) {
			if (entry.password == Encrypt(req.body.password, req.body.email)) {
				res.redirect('/home/' + entry.id);
			} else res.render('login', {error: "Password is Incorrect"});
		} else res.render('login', {error: "No Email Found"});
	});
});

// Create Bug Entry
app.post('/:user/addbug', (req, res) => {
	console.log(req.params.user);
	UserData.findOne({ _id: req.params.user }).then((entry) => {
		var reporter = entry.first_name + " " + entry.last_name;
		console.log(reporter);
		
		var style = req.body.bug_severity == "major" ? "danger" : req.body.bug_severity == "minor" ? "warning" : "success";
		
		var newEntry = {
			name: req.body.bug_name,
			type: req.body.bug_type,
			severity: req.body.bug_severity,
			status: "Open",
			enviornment: {
				os: req.body.os,
				platform: req.body.platform,
				extra: req.body.extra
			},
			description: req.body.description,
			steps: req.body.steps,
			reporter: reporter,
			style: style,
			log: [
				{
					sender: reporter,
					message: "\"" + req.body.bug_name + "\" Bug Created"
				}
			]
		};
		
		var majorCount = newEntry.severity == "major" ? 1 : 0;
		var minorCount = newEntry.severity == "minor" ? 1 : 0;
		var nthCount = newEntry.severity == "nth" ? 1 : 0;
		
		ProjectData.findOne({ _id: req.body.project }).then((project) => {
			majorCount += GetSeverityCount(project, "major");
			minorCount += GetSeverityCount(project, "minor");
			nthCount += GetSeverityCount(project, "nth");

			ProjectData.updateOne({ _id: req.body.project }, { $push: {bugs: newEntry}, $set: { major_count: majorCount, minor_count: minorCount, nth_count: nthCount } }).then((entry) => {
				res.redirect('/home/' + req.params.user);
			});
		});
	});
});

app.post('/createproject/:user', (req, res) => {
	UserData.findOne({ _id: req.params.user }).then((entry) => {
		console.log(req.params.user);
		if (entry != null) {
			var newEntry = {
				name: req.body.project_name,
				users: {
					user: entry.id,
					name: entry.first_name + " " + entry.last_name,
					admin: true
				}
			};
			new ProjectData(newEntry).save().then((entry) => {
				res.redirect('/home/' + req.params.user);
			});
		} else res.render('login', { error: "No User Found" });
	});
});

// Add User
app.post('/project/:project/add/:user', (req, res) => {
	UserData.findOne({ email: req.body.newuser }).then((entry) => {
		var newEntry = {
			user: entry.id,
			name: entry.first_name + " " + entry.last_name,
			admin: false
		};
		ProjectData.updateOne({ _id: req.params.project }, { $push: { users: newEntry }}).then((entry) => {
			res.redirect('/projectadduser/' + req.params.project + '/' + req.params.user);
		});
	});
});

// Set User Admin
app.post('/projectmakeadmin/:project/:user/:toadmin', (req, res) => {
	ProjectData.updateOne({ _id: req.params.project, 'users.user': req.params.toadmin }, { $set: { 'users.$.admin': true } }).then((entry) => {
		console.log(JSON.stringify(entry));
		res.redirect('/projectlist/' + req.params.user);
	});
});

// Set User Admin
app.post('/projectremoveadmin/:project/:user/:toadmin', (req, res) => {
	ProjectData.updateOne({ _id: req.params.project, 'users.user': req.params.toadmin }, { $set: { 'users.$.admin': false } }).then((entry) => {
		res.redirect('/projectlist/' + req.params.user);
	});
});

// Edit Bug Entry
app.post('/:user/:id/edit', (req, res) => {
	
});

// Seach Bugs
app.post('/:user/searchbugs', (req, res) => {
	var search = {}
	
	if (req.body.bug_name != "") search.name = req.body.bug_name;
	if (req.body.bug_type != "") search.type = req.body.bug_type;
	if (req.body.bug_severity != "") search.severity = req.body.bug_severity;
	if (req.body.bug_status != "") search.status = req.body.bug_status;
	
	if (req.body.os != "") search.enviornment.os = req.body.os;
	if (req.body.platform != "") search.enviornment.platform = req.body.platform;
	
	ProjectData.findOne({ _id: req.body.project }).then((project) => {
		var bugsFound = []
		
		for (var i = 0; i < project.bugs.length; i++) if (CompareJSON(search, project.bugs[i])) bugsFound.push(project.bugs[i]);
		
		res.render('bugpages/searchbugresults', { user: req.params.user, bugs: bugsFound });
	});
	
});
//#endregion

// Routes For Paths
app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/public'));
app.use('/', router);
// Start Server
app.listen(port, () => {
	console.log("Server is running on port " + port.toString());
});

// Helper Functions
function Encrypt(rawPassword, key) {
	var newPassword;
	var length = Math.max(rawPassword.length, key.length)
	for (i = 0; i < length; i++) {
		newPassword += String.fromCharCode(rawPassword.charCodeAt(i % rawPassword.length) + key.charCodeAt(i % key.length));
	}
	return newPassword;
}

function GetSeverityCount(project, severity) {
	var count = 0;
	
	for (var i = 0; i < project.bugs.length; i++) {
		if (project.bugs[i].severity == severity) count++;
	}
	
	return count;
}

function CompareJSON(obj1, obj2) {
	var keys1 = [];
	for (var key in obj1) keys1.push(key);
	var keys2 = [];
	for (var key in obj2) keys2.push(key);
	
	for (var i = 0; i < keys1.length; i++) {
		for (var j = 0; j < keys2.length; j++) {
			if (keys1[i] == keys2[j]) {
				if (obj1[keys1[i]] != obj2[keys2[j]]) { return false;}
			}
		}
	}
	
	return true;
}
