const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');

const app = express();
const router = express.Router();

const port = 1222;

mongoose.connect("mongodb://localhost:27017/dts", {
	
}).then(() => {
	console.log("MongoDB Connected");
}).catch((err) => {
	console.log(err);
});

// MongoDB UserData
require('./models/UserData');
const UserData = mongoose.model('Users');

// MongoDB BugData
require('./models/BugData');
const BugData = mongoose.model('BugList');

// Use Template Engine
app.engine('handlebars', exphbs({
	defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// Route To Index
router.get('/', (req, res) => {
	res.render('index');
});

// Route To The Entries
router.get('/entries', (req, res) => {
	res.render('gameentries/addgame');
});

// Route To The Log In
router.get('/login', (req, res) => {
	res.render('login');
});

// Create Bug Entry
app.post('/:user/addgame', (req, res) => {
	var newEntry = {
		project: req.body.project,
		name: req.body.bug_name,
		type: req.body.bug_type,
		status: "Open",
		enviornment: {
			os: req.body.os,
			platform: req.body.platform,
			extra: req.body.env_extra
		},
		description: req.body.description,
		steps: req.body.steps,
		reporter: req.params.user
	};
	new BugData(newEntry).save().then((entry) => {
		res.redirect('/');
	});
});

// Edit Bug Entry
app.post('/delete/:id', (req, res) => {
	BugData.remove({ _id: req.params.id }).then(() => {
		//res.flash("Game Removed");
		res.redirect('/');
	});
});

// Routes For Paths
app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/scripts'));
app.use('/', router);
// Start Server
app.listen(port, function () {
	console.log("Server is running on port " + port.toString());
});
