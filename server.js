// server.js
// set up ========================
var express  = require('express');
var app      = express();
var mongoose = require('mongoose');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var url = require('url');
var mongoUri = (process.env.MONGODB_URI || 'mongodb://localhost');
var basikAuth = require('basic-auth');
app.set('port', (process.env.PORT || 5000));
var senha = process.env.WL_PWD;

// configuration =================
mongoose.connect(mongoUri);
app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
var apiKey = '96ea630cb1b5c33ee03c20aa8a46b447';
var movieDB = require('moviedb')(apiKey);

// define model =================
var ObjectId = mongoose.Schema.Types.ObjectId;
var Movie = mongoose.model('Movie', { titulo: String, titulo_original: String, isInMyList: Boolean, poster: String, tmdbId: Number });
var User = mongoose.model('User', { name: String, password: String, hash: String, mymovies: [], token: String });

var auth = function (req, res, next) {
	function unauthorized(res) {
		res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
		return res.send(401);
	};

	var user = basikAuth(req);

	if (!user || !user.name || !user.pass) {
		return unauthorized(res);
	};

	if (user.name === 'asd' && user.pass === senha) {
		return next();
	} else {
		return unauthorized(res);
	};
};

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
	for (j = 0; j < lista.length; j++) {
	    if (filme._id.toString() == lista[j]._id) {
            tem = true;
	    }
	}
	return tem;
}

// routes ===========================================
// api ----------------------------------------------
app.post('/api/createuser', auth, function(req, res) {
	c(req.body.hash);
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
					hash: pHash,
					mymovies: []
				}, function(err, user2) {
					if (err) res.send(err);

					c(user2);
					c('User not found with the hash, but created another with the hash requested!');
			    	res.json({ success: true, message: "User created!", object: { exists: true, user: user2, hash: lGuid } });
				});
			} else {
				res.json({ success: true, message: 'User exists!', object: { exists: true, user: user, hash: pHash } });
			}
		});

	}
});

app.post('/api/createmovie', auth, function(req, res) {
	var lName = req.body.name;
	var lPoster = req.body.poster;
	var lIsInMyListt = false;
	var idTmdb = req.body.idTmdb;

	Movie.create({ titulo: lName, isInMyList: lIsInMyListt, poster: lPoster, tmdbId: idTmdb }, function(err, movie) {
		if (err) {
    		res.json({ success: false, message: "Erro na criacao do filme!", object: { } });
		} else {

    		res.json({ success: true, message: "Filme criado!", object: { filmeCriado: movie  } });
    	}
	});
});

app.post('/api/removemovie', auth, function(req, res) {
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
					
					var msg = 'Movie \'' + movie.titulo + '\' removed. ';
					console.log('\r\n' + msg + '\r\n');

					res.json({ success: true, message: msg, object: { } });
				}
			});
        });
	});
});

app.post('/api/addmovie', auth, function(req, res) {
	
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
					
						var msg = 'Movie \'' + movie.titulo + '\' added. ';
						c('\r\n' + msg + '\r\n');

						res.json({ success: true, message: msg, object: { } });
					}
				});
			}
        });
	});
});

app.post('/api/searchnew', function(req, res){
	console.log(req.body);
	if (req == undefined || req == '')  {
		return res.send({ success: false, message: 'no req found', object: { } });
	}
	if (req.body == undefined || req.body == '')  {
		return res.send({ success: false, message: 'no req body found', object: { } });
	}
	if (req.body.termo == undefined || req.body.termo == '')  {
		return res.send({ success: false, message: 'no req body term found', object: { } });
	}

	var termo = req.body.termo;

    User.findOne({ hash: req.body.hash}, function(err, user) {
		if (err) res.send(err);

		movieDB.searchMovie({query: termo }, function(err, r){
			console.log(r.results);
			var resultados = r.results;
			for(var k in resultados) {
			    console.log('*****resultados[k]');
			    console.log(resultados[k].title);
			}
	 		res.json(r)
		});

    });
});

app.post('/api/search', function(req, res) {

    c('');
    c('########## INICIO DA BUSCA ##########');
    //c('req.body');
    //c(req.body);
    //c('');
    
    var term = req.body.termo;
	if (req == undefined || req == '')  {
		return res.send({ success: false, message: 'no req found', object: { } });
	}
	if (req.body == undefined || req.body == '')  {
		return res.send({ success: false, message: 'no req body found', object: { } });
	}
	if (req.body.termo == undefined || req.body.termo == '')  {
		return res.send({ success: false, message: 'no req body term found', object: { } });
	}

    User.findOne({
    	hash: req.body.hash
    }, function(err, user) {
		if (err) res.send(err);

		c('*********** COMECO DE usuario encontrado');
		c(user);
		c('*********** FIM DE usuario encontrado');

		movieDB.searchMovie({query: term }, function(err, r){

			var resultados = r.results;

			c('*********** QTD filmes encontrados no TMDB');
			c(r.results.length);

			c('*********** Filmes encontrados no TMDB');
			for(var k in resultados) {
				c('**** ' + r.results[k].title);
				c('**** ' + r.results[k].original_title);
			}

			for(var k in resultados) {

				var nome = resultados[k].title;
				var posterPath;
				if (resultados[k].poster_path != null) {
					posterPath = resultados[k].poster_path.substring(1);
				}
				var idTmdb = resultados[k].id;
				var tituloOriginal = resultados[k].original_title;

				Movie.find({ tmdbId: idTmdb }, function(err, movies) {
					if (err) res.send(err);

					if (movies.length == 0) {

						c('*********************************');
						c('*********************************');
						c('**                           ****');
						c('**                           ****');
						c('**  http://callbackhell.com/ ****');
						c('**                           ****');
						c('**                           ****');
						c('*********************************');
						c('*********************************');

						c('*********** filme do TMDB #' + idTmdb + ' NAO ENCONTRADO no banco ');

						

						Movie.create({ 
							titulo: nome,
							titulo_original: tituloOriginal,
							isInMyList: false,
							poster: posterPath,
							tmdbId: idTmdb
						}, function(err, user) {
							if (err) res.send(err);
							console.log('Filme ' + nome + ' inserido!');
						});
					} else {
						c('*********** filme do TMDB #' + idTmdb + ' ENCONTRAAAADO no banco ');
						c(movies);
					}

		            //res.json({ success: true, message: 'Search complete.', object: { movies: moviesRes }});
		        });

			}

	        Movie.find({ titulo: new RegExp(term, "i")}, function(err, movies) {
				if (err) res.send(err);

				c('##### INICIO - filmes encontrados depois que ja inseriu (ou nao) os filmes do TMDB');
				c(movies);
				c('##### FIM - filmes encontrados depois que ja inseriu (ou nao) os filmes do TMDB');

				var userMovies = user.mymovies;

				c('user.myovies');
				c(user.myovies);

	            var moviesRes = new Array();

	            for (i = 0; i < movies.length; i++) {
	            	var esta = estaNaListaDoUsuario(movies[i], userMovies);
				    movies[i].isInMyList = esta;
				    moviesRes.push(movies[i]);
				}

	            res.json({ success: true, message: 'Search complete.', object: { movies: moviesRes }});
	        });
		});

    });
});

app.post('/api/obterfilmesrecomendados', auth, function(req, res) {

    if (req.body.hash == undefined || req.body.hash == '')
        return res.send({ success: false, message: 'no hash found', object: { }	});

    User.findOne({
    	hash: req.body.hash
    }, function(err, user) {
		if (err) res.send(err);

        Movie.find(function(err, movies) {
			if (err) res.send(err);

			if (user == null) {
	            res.json(
	            	{ success: true, message: 'Filmes recomendados ok. Usuario nao existe.', object: { filmesrecomendados: movies }
	            });
			} else {

				var userMovies = user.mymovies;
	            var moviesRes = new Array();

	            for (i = 0; i < movies.length; i++) {

	            	var esta = estaNaListaDoUsuario(movies[i], userMovies);
				    movies[i].isInMyList = esta;
				    moviesRes.push(movies[i]);
				}

	            res.json(
	            	{ success: true, message: 'Filmes recomendados ok.', object: { filmesrecomendados: moviesRes }
	            });
            }
        }).limit(6);

    });
});

app.post('/api/obtermylistt', auth, function(req, res) {

    if (req.body.hash == undefined || req.body.hash == '')
        return res.send({ success: false, message: 'no hash found', object: { }	});

    User.findOne({
    	hash: req.body.hash
    }, function(err, user) {
		if (err) res.send(err);

		if (user == null) {
        	return res.json({ success: false, message: "Usuario nao encontrado", object: { mylistt: []} });
		}
		if (user == null && user.mymovies == null) {
        	return res.json({ success: false, message: "Filmes do usuario nao encontrados", object: { mylistt: [] }});
		}

		var msg = 'MyListt searched. #' + user.mymovies.length + ' movies';
		console.log('\r\n' + msg + '\r\n');

        res.json({ success: true, message: msg, object: { mylistt: user.mymovies }});
    });        
});

app.post('/api/updateuser', auth, function(req, res) {
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

app.post('/api/enviarlog', auth, function(req, res) {
    console.log('log');
    if (req != null && req.body != null && req.body.logmsg != null) {
    	console.log(req.body.logmsg);
        res.json({ success: true, message: "Logado no server, conteudo ok", object: { }});
	} else {
    	console.log('log chamado mas sem conteudo');
        res.json({ success: false, message: "Logado no server, sem conteudo", object: { }});
	}
});

app.get('/poster', auth, function(req, res){
	var url_parts = url.parse(req.url, true);
	var query = url_parts.query;
	var img = query.p;

	res.sendfile('./public/images/posters/' + img);
});

// application -------------------------------------------------------------
app.get('*', auth, function(req, res) {

    res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
});

// listen (start app with node server.js) ======================================
app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
