var express  = require('express');
var app      = express();
var bodyParser = require('body-parser');
//var mongoose = require('./fazotrampo')
//var Filme = mongoose.model();

function c(){
	console.log('faz')
		.then(function(){
			console.log('acontece');
		});
}

app.set('port', 4004);
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json

app.post('/api/teste', function(req, res){
	c();
	res.send('fim');
});

// listen (start app with node server.js) ======================================
app.listen(app.get('port'), function() {
    console.log('Server3 app is running on port', app.get('port'));
});
