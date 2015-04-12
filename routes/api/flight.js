var express = require('express');
var router = express.Router();
var request = require('request');

/* GET users listing. */
router.get('/', function (req, res) {
	if (req.query.id) {
		request("http://bma.data.fr24.com/_external/planedata_json.1.4.php?f=" + req.query.id, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				res.send(body);
			}
		});
	}else{
		res.send({
			error:'Please provide id'
		})
	}
});

module.exports = router;
