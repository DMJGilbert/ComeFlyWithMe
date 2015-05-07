var express = require('express');
var router = express.Router();
var request = require('request');

router.get('/', function (req, res) {
	res.send({
		error: 'Nope'
	})
});

router.get('/search', function (req, res) {
	if (req.query.query) {
		res.send({
			error: 'Nope'
		})
	} else {
		res.send({
			error: 'Please provide flight number'
		})
	}
});

module.exports = router;
