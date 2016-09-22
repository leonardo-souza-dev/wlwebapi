var express  = require('express');
var app      = express();
var bodyParser = require('body-parser');
//var request = require('request');

var apiKey = '96ea630cb1b5c33ee03c20aa8a46b447';
var usuario = 'leonardotreze@gmail.com';
var senha = 'Leonard013@t10';

var movieDB = require('moviedb')(apiKey);

app.set('port', (process.env.PORT || 4002));
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json

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

	var termo = req.body.termo

	movieDB.searchMovie({query: termo }, function(err, r){
 		res.json(r)
	});
});
/*
app.get('/tmdb', function(req, res){

	//passa api_key e retorna o request_token
	var url01 = 'http://api.themoviedb.org/3/authentication/token/new?api_key=' + apiKey;
	request({
		method: 'GET',
		url: url01,
		headers: { 'Accept': 'application/json' }}, 
		function (error, response, body) {
			if(error) res.send(error);
			var obteveToken = JSON.parse(body).success;
			if (!obteveToken) res.send('nao obteve Token');
			var urlComToken = response.headers["authentication-callback"];
			var sohToken = urlComToken.split('/')[urlComToken.split('/').length - 1];

			//passa api_key, request_token, usuario, senha e valida
			request(
				{
					method: 'GET',
					url: urlComToken,
					headers: { 'Accept': 'application/json' }
				}, 
				function (error2, response2, body2) {
					if(error2) res.send(error2);

					var url2 = 'https://api.themoviedb.org/3/authentication/token/validate_with_login?api_key=' + apiKey + '&request_token='+ sohToken + '&username=' + usuario + '&password=' + senha;

					//cria session_id					
					request({
						method: 'GET',
						url: url2,
						headers: { 'Accept': 'application/json'	}}, 
						function (error3, response3, body3) {
							if(error3) res.send(error3);
							var body3parse = JSON.parse(body3);
							var requestToken = body3parse["request_token"];
							var sucesso = body3parse["success"];
							if (!sucesso) {
								res.json({sucessoo: false});
							} else {
								request({
									method: 'GET',
									url: 'http://api.themoviedb.org/3/authentication/session/new?api_key=' + apiKey + '&request_token=' + requestToken,
									headers: {'Accept': 'application/json'}}, 
									function (error4, response4, body4) {
										if(error4) res.send(error4);

										request({
											method: 'GET',
											url: 'http://api.themoviedb.org/3/search/movie?api_key=' + apiKey + '&request_token' + requestToken + '&query=domesticas',
											headers: {
											'Accept': 'application/json'
											}}, 
											function (error5, response5, body5) {
												if(error5) res.send(error5);

												res.json({b5: JSON.parse(body5)});
											}
										);
									}
								);
							}							
						}
					);
				}
			);
		}
	);
});
*/

// listen (start app with node server.js) ======================================
app.listen(app.get('port'), function() {
    console.log('Server2 app is running on port', app.get('port'));
});

//"http://www.themoviedb.org/authenticate/85963c326f491f5d72175eb6e7a22a60531cdb64",

//https://api.themoviedb.org/3/authentication/token/validate_with_login?
//api_key=96ea630cb1b5c33ee03c20aa8a46b447&
//request_token=84c0c45beb568e62f58788e31292abeaf5f6fd96&
//username=leonardotreze@gmail.com&
//password=Leonard013@t10