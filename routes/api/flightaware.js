var express = require('express');
var router = express.Router();
var request = require('request');
var util = require('util');
var restclient = require('restler');

var fxml_url = 'http://flightxml.flightaware.com/json/FlightXML2/';
var username = 'inmarsat';
var apiKey = process.env.FLIGHTAWARE;

router.get('/', function (req, res) {
	if (req.query.id) {
		restclient.get(fxml_url + 'InFlightInfo', {
			username: username,
			password: apiKey,
			query: {
				ident: req.query.id
			}
		}).on('success', function (result, response) {
			res.send(result);
		}).on('failure', function (result, response) {
			res.send(result);
		});
	} else {
		res.send({
			error: 'Please provide id'
		})
	}
});

router.get('/random', function (req, res) {
	request('http://uk.flightaware.com/live/flight/random', function (error, response, body) {
		var id = response.request.req.path.split('/')[3];
		restclient.get(fxml_url + 'InFlightInfo', {
			username: username,
			password: apiKey,
			query: {
				ident: id
			}
		}).on('success', function (result, response) {
			res.send(result);
		}).on('failure', function (result, response) {
			res.send(result);
		});
	});
});


module.exports = router;
