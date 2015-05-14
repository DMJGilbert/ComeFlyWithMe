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
		restclient.get(fxml_url + 'AirportInfo', {
		    username: username,
		    password: apiKey,
		    query: {airportCode: req.query.id}
		}).on('success', function(result, response) {
		    res.send(result);
		}).on('failure', function(result, response) {
		    res.send(result);
		});
	}else{
		res.send({
			error:'Please provide id'
		})
	}
});

module.exports = router;
