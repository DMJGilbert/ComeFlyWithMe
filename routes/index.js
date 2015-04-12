var express = require('express');
var router = express.Router();

/* GET home page. */

router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/flight', function(req, res) {
	
  	res.render('flight', { title: 'Express' , id: req.query.id});
});

module.exports = router;
