var express = require('express');
var router = express.Router();
var request = require('request');

/* GET users listing. */
router.get('/', function (req, res) {
	if (req.query.lat && req.query.lng) {
		request("http://api.openweathermap.org/data/2.5/weather?lat=" + req.query.lat +"&lon=" + req.query.lng, function (error, response, body) {
			
			if (!error && response.statusCode == 200) {
				res.send(body);
			}
		});
	}else{
		res.send({
			error:'Please provide lat and long.'
		})
	}
});

module.exports = router;