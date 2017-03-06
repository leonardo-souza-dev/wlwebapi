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
var senha      = process.env.WL_PWD;
app.set('port', (process.env.PORT || 5000));
mongoose.connect(mongoUri);
app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
var apiKey = '96ea630cb1b5c33ee03c20aa8a46b447';
var movieTMDB = Promise.promisifyAll(require('moviedb')(apiKey));

//configuracao da url base da imagem do poster
var gTamanhoPoster;
var gBaseUrl;
movieTMDB.configuration(function (err, cfg){
	if (err) return callback(err);

    gBaseUrl = cfg.images.base_url;
    var tamanho = 2;
    gTamanhoPoster = cfg.images.poster_sizes[tamanho];
});

// define model =================
var ObjectId = mongoose.Schema.Types.ObjectId;
var Movie = mongoose.model('Movie', { titulo: String, tituloOriginal: String, isInMyList: Boolean, 
	poster: String, tmdbId: Number, dataLancamento: String, urlPoster: String, popularidade: String });
var User = mongoose.model('User', { name: String, password: String, hash: String, movies: [], token: String });

var auth = function (req, res, next) {
	function unauthorized(res) {
		res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
		return res.send(401);
	};

	var user = basikAuth(req);

	//console.log('user');
	//console.log(user);

	//console.log('user.name');
	//console.log(user.name);

	//console.log('user.pass');
	//console.log(user.pass);

	//console.log('senha');
	//console.log(senha);

	if (!user || !user.name || !user.pass) {
		//console.log('nao autorizado1');
		return unauthorized(res);
	};
	
	if (user.name === 'asd' && user.pass === senha) {
		//console.log('autorizado');
		return next();
	} else {
		//console.log('nao autorizado2');
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
	var pHash = req.body.hash;
	var lGuid = generateUUID();

	if (pHash == 'undefined' || pHash == undefined) {

		User.create({ 
			hash: lGuid,
			movies: []
		}, function(err, user) {
			if (err) res.send(err);

			c('User created!');
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

	User.findOne({ hash: hash }, function userFindOne(err, user) {
		if (err) res.send(err);

        Movie.findOne({ _id: movieId }, function movieFindOne(err, movie) {
			if (err) res.send(err);

			var newMovies = new Array();
			for (var i = 0; i < user.movies.length; i++) {

				if (user.movies[i]._id != movieId) {
					newMovies.push(user.movies[i]);
				}
			}

			user.movies = newMovies;

			user.save(function(err) {
				if (err) res.json({ success: false, message: 'Movie not added!', object: { } }); 
					
				var msg = 'Movie \'' + movie.titulo + '\' removed. ';

				res.json({ success: true, message: msg, object: { } });
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
					if (err) res.json({ success: false, message: 'Movie not added!', object: { } }); 
					
					var msg = 'Movie \'' + movie.titulo + '\' added. ';
					res.json({ success: true, message: msg, object: { } });
				});
			}
        });
	});
});

app.post('/api/obteritenscarrossel', auth, function carrosel(req, res){

	var lTmdbIds = [268,286217,901,9710];
	var lUrls = [];

    async.forEach(lTmdbIds, function(lTmdbId, callback) {
		async.series([
			function buscaUrl (callback) {
				movieTMDB.movieImages({id: lTmdbId}, function (err, img){
					if (err) return callback(err);

					var lCaminhoImagem;

		        	if (img.posters.length != 0) {
				        lCaminhoImagem = img.posters[0].file_path;
		        	}
		        	var lUrlPoster = gBaseUrl + "/" + gTamanhoPoster + "/" + lCaminhoImagem;
		        	lUrls.push(lUrlPoster);

	            	callback();
				});
			}
		], callback);
    }, function (err) {
		if (err != null) return res.status(500).send(err);
			
        res.json({ success: true, message: 'Search URLs complete.', object: { urls: lUrls }});
		});
	});

app.post('/api/search', function(req, res){

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
			c(lTermo);

			movieTMDB.searchMovieAsync({query: lTermo}, function (err, r){
				if (err) return callback(err);
                if (r == null) return callback(new Error('No search result found.'));
                
				resultadosTMDB = r.results;

				callback();
			});
		},
		function salvaFilmesDoTMDB (callback){

            async.forEach(resultadosTMDB, function(resultado, callback) {

            	c('***************resultado');
            	c(resultado);
            	c('');

				var lNome = resultado.title;
				var lPosterPath;
				if (resultado.poster_path != null) {
					lPosterPath = resultado.poster_path.substring(1);
				} else {
					lPosterPath = '';
				}
				var lTmdbId = resultado.id;
				var lTituloOriginal = resultado.original_title;
				var lDataLancamento = resultado.release_date;
				var lUrlPoster;
				var lPopularidade = resultado.popularity;
				
				filmeXpto = {};

				async.series([
					function buscaUrl (callback) {

						movieTMDB.movieImages({id: lTmdbId}, function (err, img){
							if (err) return callback(err);

				        	if (img.posters.length != 0) {
						        lCaminhoImagem = img.posters[0].file_path;
				        	}
				        	lUrlPoster = gBaseUrl + "/" + gTamanhoPoster + "/" + lCaminhoImagem;

			            	callback();
						});
					},
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
					function apiSearchSeNaoExistirSalvaFilmeNoMongo (callback) {
						if (filmeXpto == null) {

							var novoFilme = { 
								urlPoster: lUrlPoster, 
								dataLancamento: lDataLancamento, 
								titulo: lNome, 
								tituloOriginal: lTituloOriginal, 
								isInMyList: false, 
								poster: lPosterPath, 
								tmdbId: lTmdbId, 
								popularidade: lPopularidade 
							};

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
		//c('\r\n' + msg + '\r\n');

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
    c('log');
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
