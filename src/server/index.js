

var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var {Pool} = require('pg');

var app = express();

app.use(express.static("dist"));

app.use(bodyParser.json());
var connectionString = process.env.DATABASE_URL || 'postgres://purezhwtekqdkk:cd5b2d197a17a52551d1a98604d161e446c41907e1c03510c94b6fd33b0381a0@ec2-52-202-185-87.compute-1.amazonaws.com:5432/d3205a6i0edh82';

if (process.env.DATABASE_URL !== undefined) {
	pg.defaults.ssl = true;
  }

const client = new Pool({
	connectionString
  });
client.connect()


var propertyTable = 'property__c';
var favoriteTable = 'favorite__c';
var brokerTable = 'broker__c';

// setup the demo data if needed
client.query('SELECT * FROM salesforce.broker__c', function(error, data) {
	if (error !== null) {
		   //for initial setup of data
		client.query('SELECT * FROM broker__c', function(error, data) {
		  if (error !== null) {
			console.log('Loading Demo Data...');
			require('./db/index.js')(client);
			console.log('Done Loading Demo Data!');
		  }
		});
	  }
	  else {
		var schema = 'salesforce.';
		propertyTable = schema + 'property__c';
		favoriteTable = schema + 'favorite__c';
		brokerTable = schema + 'broker__c';
	  }
});


app.get('/property', function(req, res) {
	client.query('SELECT * FROM ' + propertyTable, function(error, data) {
		console.log(error)
		res.json(data.rows);
	});
});

app.get('/property/:id', function(req, res) {
	client.query(
		'SELECT ' +
			propertyTable +
			'.*, ' +
			brokerTable +
			'.sfid AS broker__c_sfid, ' +
			brokerTable +
			'.name AS broker__c_name, ' +
			brokerTable +
			'.email__c AS broker__c_email__c, ' +
			brokerTable +
			'.phone__c AS broker__c_phone__c, ' +
			brokerTable +
			'.mobile_phone__c AS broker__c_mobile_phone__c, ' +
			brokerTable +
			'.title__c AS broker__c_title__c, ' +
			brokerTable +
			'.picture__c AS broker__c_picture__c FROM ' +
			propertyTable +
			' INNER JOIN ' +
			brokerTable +
			' ON ' +
			propertyTable +
			'.broker__c = ' +
			brokerTable +
			'.sfid WHERE ' +
			propertyTable +
			'.sfid = $1',
		[req.params.id],
		function(error, data) {
			res.json(data.rows[0]);
		}
	);
});

app.get('/favorite', function(req, res) {
	client.query(
		'SELECT ' +
			propertyTable +
			'.*, ' +
			favoriteTable +
			'.sfid AS favorite__c_sfid FROM ' +
			propertyTable +
			', ' +
			favoriteTable +
			' WHERE ' +
			propertyTable +
			'.sfid = ' +
			favoriteTable +
			'.property__c',
		function(error, data) {
			res.json(data.rows);
		}
	);
});

app.post('/favorite', function(req, res) {
	client.query('INSERT INTO ' + favoriteTable + ' (property__c) VALUES ($1)', [req.body.property__c], function(
		error,
		data
	) {
		res.json(data);
	});
});

app.delete('/favorite/:sfid', function(req, res) {
	client.query('DELETE FROM ' + favoriteTable + 'WHERE sfid = ($1)' , [req.params.sfid], function(error, data) {
		res.json(data);
	});
});

app.get('/broker', function(req, res) {
	client.query('SELECT * FROM ' + brokerTable, function(error, data) {
		res.json(data.rows);
	});
});

app.get('/broker/:sfid', function(req, res) {
	client.query('SELECT * FROM ' + brokerTable + ' WHERE sfid = $1', [req.params.sfid], function(error, data) {
		res.json(data.rows[0]);
	});
});

var port = process.env.PORT || 5000;

app.listen(port);

//console.log('Listening at: http://localhost:' + port);
