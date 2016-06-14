// server.js
    // set up ========================
    var express  = require('express');
    var app      = express();                               // create our app w/ express
    var mongoose = require('mongoose');                     // mongoose for mongodb
	var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
    var morgan = require('morgan');             // log requests to the console (express4)
    var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
    var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
    // configuration =================
    mongoose.connect('mongodb://localhost');
    app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
    app.use(morgan('dev'));                                         // log every request to the console
    app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
    app.use(bodyParser.json());                                     // parse application/json
    app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
    app.use(methodOverride());
	console.log('1');
	app.set('superSecret', 'ilovescotchyscotch'); // secret variable
	
	// define model =================
    var Movie = mongoose.model('Movie', {
        name: String, plot: String
    });
	var User = mongoose.model('User', {
        user_id: String, name: String, password: String
    });
    
	// routes ======================================================================
    // api ---------------------------------------------------------------------
	
	app.get('/api/setup', function(req, res) {
		User.create({
			name: 'Nick Cerminara', 
			password: '123', 
			admin: true
		}, function(err, data){
			if (err) res.send(err);
			res.json({ setupresult: true });
		});
	});
	
	app.post('/api/authenticate', function(req, res) {

		// find the user
		User.findOne({
			name: req.body.name
		}, function(err, user) {
			
			if (err) throw err;

			if (!user) {
				res.json({ success: false, message: 'Authentication failed. User not found.' });
			} else if (user) {
				
				// check if password matches
				if (user.password != req.body.password) {
					
					res.json({ success: false, message: 'Authentication failed. Wrong password.' });
					
				} else {
					console.log('auth ok');
					// if user is found and password is right
					// create a token
					var token = jwt.sign(user, app.get('superSecret'), {
						expiresIn: 86400 // expires in 24 hours
					});
					
					// return the information including token as JSON
					res.json({
						success: true,
						message: 'Enjoy your token!',
						token: token
					});
				}
			}
		});
	});
	
    //search
    app.post('/api/search', function(req, res) {
        var term = req.body.searchterm;
        var user = req.body.userid;
        console.log('server.js');
        console.log('term: ' + term);
        console.log('req.body');
        console.log(req.body);

        if (term == '')
            return;

        Movie.find({ 
			name: new RegExp(term, "i")
		}, function(err, movies) {
			if (err)
                res.send(err);

            // search and return movies searched
            res.json(movies);
        });
    });

    // create todo and send back all todos after creation
    app.post('/api/todos', function(req, res) {
        // create a todo, information comes from AJAX request from Angular
        Movie.create({
			name: req.body.name, 
			done: false
			}, function(err, todo) {
				if (err) res.send(err);

				// get and return all the todos after you create another
				Movie.find(function(err, todos) {
					if (err)
						res.send(err);
					res.json(todos);
				});
        });
    });

    // delete a todo
    app.delete('/api/todos/:todo_id', function(req, res) {
        Movie.remove({
            _id : req.params.todo_id
        }, function(err, todo) {
            if (err)
                res.send(err);

            // get and return all the todos after you create another
            Movie.find(function(err, todos) {
                if (err)
                    res.send(err)
                res.json(todos);
            });
        });
    });
	
	// get all todos
    app.get('/api/todos', function(req, res) {
        // use mongoose to get all todos in the database
        Movie.find(function(err, todos) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)

            res.json(todos); // return all todos in JSON format
        });
    });

    // application -------------------------------------------------------------
    app.get('*', function(req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });

    // listen (start app with node server.js) ======================================
    app.listen(8080);
    console.log("WL listening on port 8080");