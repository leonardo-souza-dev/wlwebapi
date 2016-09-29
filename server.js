// set up ========================
var Promise    = require('bluebird');
var express    = require('express');
var app        = express();
var mongoose   = Promise.promisifyAll(require('mongoose'));
var morgan     = require('morgan');
var bodyParser = require('body-parser');
var url        = require('url');
var mongoUri   = (process.env.MONGODB_URI || 'mongodb://localhost');
var basikAuth  = require('basic-auth');
var async      = require('async'); 

// configuration =================
app.set('port', (process.env.PORT || 5000));
mongoose.connect(mongoUri);
app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
var apiKey = '96ea630cb1b5c33ee03c20aa8a46b447';
var movieTMDB = Promise.promisifyAll(require('moviedb')(apiKey));

// define model =================
var ObjectId = mongoose.Schema.Types.ObjectId;
var Movie = mongoose.model('Movie', { dataLancamento: String, titulo: String, titulo_original: String, isInMyList: Boolean, poster: String, tmdbId: Number });
var User = mongoose.model('User', { name: String, password: String, hash: String, movies: [], token: String });

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

//obsoleto INICIO
function criaFilmeNoMongo(filmeNovo){
	Movie.create(filmeNovo, function apiSearch_Moviecreate(err, filme) {
		if (err) res.send(err);
		//console.log(filme);
		//console.log('Filme inserido!');
		c('*********************************');
		c('**           3.1.1           ****');
		c('*********************************');
	});
}

function forNosResultados(resultadosTMDB){
	for(var k in resultadosTMDB) {
		var nome = resultadosTMDB[k].title;
		var posterPath;
		if (resultadosTMDB[k].poster_path != null) {
			posterPath = resultadosTMDB[k].poster_path.substring(1);
		}
		var idTmdb = resultadosTMDB[k].id;
		var tituloOriginal = resultadosTMDB[k].original_title;
		c('**** TITLE ' + nome);
		c('**** ORIGINAL TITLE ' + tituloOriginal);

		Movie.findAsync({ tmdbId: idTmdb })
        .then(function(movies){
			if (movies.length == 0) {
				//http://callbackhell.com/
				c('*********************************');
				c('**           3.1             ****');
				c('*********************************');
				c('*********** filme do TMDB #' + idTmdb + ' NAO ENCONTRADO no banco ');
				
				var filmeNovo = { 
					titulo: nome, 
					titulo_original: tituloOriginal, 
					isInMyList: false, 
					poster: posterPath, 
					tmdbId: idTmdb 
				}
				criaFilmeNoMongo(filmeNovo);
			} else {
				c('*********** Foi encontrado o filme do TMDB #' + idTmdb + ' no MongoDB ');
				c(movies);

				c('*********************************');
				c('**           3.2             ****');
				c('*********************************');
			}
        });
	}
}

function fazOTrampo(pHash, pTermo, res){

	User.findOneAsync({ hash: pHash })
	.then(function(user){
		
		c('*********************************');
		c('**              1            ****');
		c('*********************************');//c('*********** Usuario encontrado');c(user);c('');c('');
		
		movieTMDB.searchMovieAsync({query: pTermo}).then(function buscaTMDB(r){

			c('*********************************');
			c('**              2            ****');
			c('*********************************');
			var resultadosTMDB = r.results;
			var ids = [];
			for(var x in resultadosTMDB){
				ids.push(resultadosTMDB[x].id);
			}
			c('ids');
			c(ids);
			//c('*********** QTD filmes encontrados no TMDB');
			//c(r.results.length);
			//c('*********** Filmes encontrados no TMDB');
			c('inicio do for');
			forNosResultados(resultadosTMDB);
			c('FIM do for');
	        
	        Movie.where( { tmdbId: { $in: ids } }, function apiSearch_Moviefind(err, movies) {
				if (err) res.send(err);
				c('*********************************');
				c('**           4                 **');
				c('**      apiSearch_Moviefind    **');
				c('**                             **');
				c('**  filmes encontrados depois  **');
				c('**  que ja inseriu (ou nao) os **');
				c('**      filmes do TMDB         **');
				c(movies);
				c('');
				var userMovies = user.movies;
				c('user.movies');
				c(user.movies);
	            var moviesRes = new Array();
	            for (i = 0; i < movies.length; i++) {
	            	var esta = estaNaListaDoUsuario(movies[i], userMovies);
				    movies[i].isInMyList = esta;
				    moviesRes.push(movies[i]);
				}
				c('*********************************');
	            res.json({ success: true, message: 'Search complete.', object: { movies: moviesRes }});
	        });
		});
	});
}

app.post('/api/searchold', function apiSearch (req, res) {    
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

    fazOTrampo(req.body.hash, req.body.termo, res);
});
//obsoleto FIM

// routes ===========================================
// api ----------------------------------------------
app.post('/api/createuser', auth, function(req, res) {
	c(req.body.hash);
	var pHash = req.body.hash;
	var lGuid = generateUUID();

	if (pHash == 'undefined' || pHash == undefined) {

		User.create({ 
			hash: lGuid,
			movies: []
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
					movies: []
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
			for (var i = 0; i < user.movies.length; i++) {

				if (user.movies[i]._id != movieId) {
					newMovies.push(user.movies[i]);
				}
			}

			user.movies = newMovies;

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

app.post('/api/addmovie', auth, function adicionaJs(req, res) {
	
	var hash = req.body.hash;
	var movieId = req.body.movieid;

	User.findOne({ hash: hash}, function encontraUsuarioJs(err, user) {
		if (err) res.send(err);

        Movie.findOne({ _id: movieId }, function encontraFilmeJs(err, movie) {
			if (err) res.send(err);

			if (!user) return next(new Error('Could not load Document'));
			else {
				movie.isInMyList = true;
				user.movies.addToSet(movie);

				user.save(function salvaUsuarioJs(err) {
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

app.post('/api/search', function(req, res){
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

	var lTermo = req.body.termo;
	var lhash = req.body.hash;
	var resultadosTMDB;
	var filmesDoUsuario;
	var filmesBuscadosMongo = [];
	var moviesMongodbSearched;
    var moviesRes = new Array();

	async.series([
		function buscaUsuario (callback) {
			c('1 busca usuario');

		    User.findOne({ hash: lhash}, function (err, user) {
				if (err) return callback(err);

                if (user == null) {
                    return callback(new Error('No user found.'));
                }

                filmesDoUsuario = user.movies;

            	callback();
		    });
		},
		function buscaFilmeTmdb (callback) {
			c('2 buscaFilmeTmdb');

			movieTMDB.searchMovieAsync({query: lTermo}, function (err, r){
				if (err) return callback(err);
                if (r == null) return callback(new Error('No search result found.'));
                
				resultadosTMDB = r.results;

				callback();
			});
		},
		function salvaFilmesDoTMDB (callback){

            async.forEach(resultadosTMDB, function(resultado, callback) {

				var lNome = resultado.title;
				var lPosterPath;
				if (resultado.poster_path != null) lPosterPath = resultado.poster_path.substring(1);
				var lTmdbId = resultado.id;
				var lTituloOriginal = resultado.original_title;
				var lDataLancamento = resultado.release_date;
				c('resultado');
				c(resultado);
				
				filmeXpto = {};

				async.series([
					function apiSearchProcuraOFilmeNoMongo (callback) {
						Movie.findOne({ tmdbId: lTmdbId }, function(err, movie){
							if (err) return callback(err);

							filmeXpto = movie;
							if (movie == null)
								c("3 filme " + resultado.original_title + " nao encontrado no mongo");
							else
								c("3 filme " + resultado.original_title + " encontrado no mongo");

				        	callback();
				        });
					},
					function apiSearchSeNaoExistirSalvaFilmeNoMongo (callback) {							//c(new Date().getTime());
						if (filmeXpto == null) {
							var novoFilme = { dataLancamento: lDataLancamento, titulo: lNome, titulo_original: lTituloOriginal, isInMyList: false, poster: lPosterPath, tmdbId: lTmdbId };
							Movie.create(novoFilme, function (err, filme) {
								if (err) res.send(err);


								c('4a salvado ' + resultado.original_title + ' no mongo');
								c('4b inserindo filme ' + resultado.original_title + ' na lista a ser retornada');

								filmesBuscadosMongo.push(filme);
								callback();
							});
						} else {
							c('4b inserindo filme ' + resultado.original_title + ' na lista a ser retornada');
							
							filmesBuscadosMongo.push(filmeXpto);
							callback();
						}
					}
				], callback);

            }, callback);
		},
		function montaResultadoBusca (callback){
			c('5 montaResultadoBusca');
            for (i = 0; i < filmesBuscadosMongo.length; i++) {
            	var esta = estaNaListaDoUsuario(filmesBuscadosMongo[i], filmesDoUsuario);
			    filmesBuscadosMongo[i].isInMyList = esta;
			    moviesRes.push(filmesBuscadosMongo[i]);
			}
			callback();
		}
	], function(err) { 
		if (err != null) return res.status(500).send(err);
			
        res.json({ success: true, message: 'Search complete.', object: { movies: moviesRes }});
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

				var userMovies = user.movies;
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
		if (user == null && user.movies == null) {
        	return res.json({ success: false, message: "Filmes do usuario nao encontrados", object: { mylistt: [] }});
		}

		var msg = 'MyListt searched. #' + user.movies.length + ' movies';
		console.log('\r\n' + msg + '\r\n');

        res.json({ success: true, message: msg, object: { mylistt: user.movies }});
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

    console.log('WL WebApi app is running on port', app.get('port'));
});
