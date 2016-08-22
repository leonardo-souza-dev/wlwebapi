// server.js
    // set up ========================
    var express  = require('express');
    var app      = express();                               // create our app w/ express
    var mongoose = require('mongoose');                     // mongoose for mongodb
    var morgan = require('morgan');             // log requests to the console (express4)
    var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
    var url = require('url');
    
    // configuration =================
    mongoose.connect(process.env.MONGOLAB_URI);
    app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
    app.use(morgan('dev'));                                         // log every request to the console
    app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
    app.use(bodyParser.json());                                     // parse application/json
    app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
    app.set('superSecret', 'ilovescotchyscotch'); // secret variable
	
    // define model =================
    var ObjectId = mongoose.Schema.Types.ObjectId;
    var Movie = mongoose.model('Movie', {
        name: String, _id: ObjectId, isInMyList: false, poster: String
    });
    var User = mongoose.model('User', {
    	name: String, password: String, hash: String, mymovies: [], token: String 
    });
    
    function c(t){
    	console.log(t);
    }
    function generateUUID() {
    	var d = new Date().getTime();
    	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    		var r = (d + Math.random()*16)%16 | 0;
    		d = Math.floor(d/16);
    		return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    	});
    	return uuid;
    }
    
    function estaNaListaDoUsuario(filme, lista){
	var tem = false;
	for (j= 0; j < lista.length; j++) {
	    	
	    if (filme._id.toString() == lista[j]._id) {
            	tem = true;
            	console.log('entrou no TRUE');
	    }
	}
	return tem;
    }

    // routes ===========================================
    // api ----------------------------------------------
	app.post('/api/createuser', function(req, res) {
		var pHash = req.body.hash;
		var lGuid = generateUUID();

		if (pHash == 'undefined' || pHash == undefined) {

			User.create({ 
				hash: lGuid,
				mymovies: []
			}, function(err, user) {
				if (err) res.send(err);

				console.log('User created!');
		    	res.json({ success: true, message: "User created!", 
		    		object: { exists: false, user: user, hash: lGuid } });
			});
		} else {

			User.findOne({ hash: pHash }, function(err, user) {
				if (err) res.send(err);

				if (user == null) {
					User.create({ 
						hash: lGuid,
						mymovies: []
					}, function(err, user2) {
						if (err) res.send(err);

						console.log('User not found with the hash, but created another!');
				    	res.json({ success: true, message: "User created!", 
				    		object: { exists: true, user: user2, hash: lGuid } });
					});
				} else {

					console.log('User exists!');
					res.json({ success: true, message: 'User exists!', 
						object: { exists: true, user: user, hash: pHash } });
				}
			});

		}
	});

	app.post('/api/removemovie', function(req, res) {
		var hash = req.body.hash;
		var movieId = req.body.movieid;

		User.findOne({ hash: hash }, function(err, user) {
			if (err) res.send(err);

	        Movie.findOne({ _id: movieId }, function(err, movie) {
				if (err) res.send(err);

				var newMovies = new Array();
				for (var i = 0; i < user.mymovies.length; i++) {

					if (user.mymovies[i]._id != movieId) {
						newMovies.push(user.mymovies[i]);
					}
				}

				user.mymovies = newMovies;

				user.save(function(err) {
					if (err) { 
						console.log('update error');
						res.json({ success: false, message: 'Movie not added!', object: { } }); 
					}
					else {
						
						var msg = 'Movie \'' + movie.name + '\' removed. ';
						console.log('\r\n' + msg + '\r\n');

						res.json({ success: true, message: msg, object: { } });
					}
				});
	        });
		});
	});

	app.post('/api/addmovie', function(req, res) {
		
		var hash = req.body.hash;
		var movieId = req.body.movieid;

		User.findOne({ hash: hash}, function(err, user) {
			if (err) res.send(err);

	        Movie.findOne({ _id: movieId }, function(err, movie) {
				if (err) res.send(err);

				if (!user) return next(new Error('Could not load Document'));
				else {
					movie.isInMyList = true;
					user.mymovies.addToSet(movie);

					user.save(function(err) {
						if (err) { 
							console.log('update error');
							res.json({ success: false, message: 'Movie not added!', 
								object: { } }); 
						} else {
						
							var msg = 'Movie \'' + movie.name + '\' added. ';
							console.log('\r\n' + msg + '\r\n');

							res.json({ success: true, message: msg, object: { } });
						}
					});
				}
	        });
		});
	});

    //search
    app.post('/api/search', function(req, res) {

        var term = req.body.searchterm;

        if (term == undefined || term == '')
            return res.send({ success: false, message: 'no term found', object: { }	});

        User.findOne({
        	hash: req.body.hash
        }, function(err, user) {
			if (err) res.send(err);

            Movie.find({ name: new RegExp(term, "i")
			}, function(err, movies) {
				if (err) res.send(err);

				var userMovies = user.mymovies;
	            var moviesRes = new Array();

	            for (i = 0; i < movies.length; i++) {

	            	var esta = estaNaListaDoUsuario(movies[i], userMovies);
				    movies[i].isInMyList = esta;
				    moviesRes.push(movies[i]);
				}

	            res.json(
	            	{ success: true, message: 'Search complete.', object: { movies: moviesRes }
	            });
	        });

        });
    });

    app.post('/api/obterfilmesrecomendados', function(req, res) {

        if (req.body.hash == undefined || req.body.hash == '')
            return res.send({ success: false, message: 'no hash found', object: { }	});

        User.findOne({
        	hash: req.body.hash
        }, function(err, user) {
			if (err) res.send(err);

	        Movie.find(function(err, movies) {
				if (err) res.send(err);

				var userMovies = user.mymovies;
	            var moviesRes = new Array();

	            for (i = 0; i < movies.length; i++) {

	            	var esta = estaNaListaDoUsuario(movies[i], userMovies);
				    movies[i].isInMyList = esta;
				    moviesRes.push(movies[i]);
				}

	            res.json(
	            	{ success: true, message: 'Filmes recomendados ok.', 
	            		object: { filmesrecomendados: movies }
	            });
	        }).limit(4);

        });
    });

    app.post('/api/obtermylistt', function(req, res) {

        if (req.body.hash == undefined || req.body.hash == '')
            return res.send({ success: false, message: 'no hash found', object: { }	});

        User.findOne({
        	hash: req.body.hash
        }, function(err, user) {
			if (err) res.send(err);

			var msg = 'MyListt searched. #' + user.mymovies.length + ' movies';
			console.log('\r\n' + msg + '\r\n');

            res.json(
            	{ success: true, message: msg, object: { mylistt: user.mymovies }
            });
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
        Movie.find(function(err, todos) {
            if (err) res.send(err)

            res.json(todos);
        });
    });
	
    //update user
    app.post('/api/updateuser', function(req, res) {
        User.findById(req.params.id, function(err, u) {
			if (!u)
				return next(new Error('Could not load Document'));
			else {
				// do your updates here
				u.modified = new Date();

				u.save(function(err) {
					if (err)
						console.log('error')
					else
						console.log('success')
					});
				}
		});
    });

    app.post('/api/validateuser', function(req, res){

    });

    app.get('/poster', function(req, res){
    	var url_parts = url.parse(req.url, true);
    	var query = url_parts.query;
    	var img = query.p;

    	res.sendfile('./public/images/posters/' + img);
    });

    // application -------------------------------------------------------------
    app.get('*', function(req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });

    // listen (start app with node server.js) ======================================
    app.listen(8080);
    console.log("WL listening on port 8080");
