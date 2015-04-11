var express = require('express');
var router = express.Router();
var request = require('request');

/* GET users listing. */
router.get('/', function (req, res) {
	//if () {
		request("http://arn.data.fr24.com/zones/fcgi/feed.js?bounds=58.539594766640484,52.43193490579993,41.68977539062598,60.721435546875&faa=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=1&estimated=1&maxage=900&gliders=1&stats=1&", function (error, response, body) {
			if (!error && response.statusCode == 200) {
				res.send(body);
			}
		});
	//}
});

//http://mobile.api.fr24.com/common/v1/search.json?limit=10&query=GLP811
router.get('/search', function (req, res) {
	if (req.query.query) {
		request("http://mobile.api.fr24.com/common/v1/search.json?limit=10&query=" + req.query.query, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var data = JSON.parse(body);
				delete data._api;
				res.jsonp(data);
			}
		});
	}
});

module.exports = router;
