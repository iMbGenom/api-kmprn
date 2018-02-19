const express 			= require('express');
const router 			= express.Router();
let cacheRedis 			= require('./../cache/redis');
let News 				= require('../models/newsModel');
let Topics 				= require('../models/topicsModel');
let GH 					= require('../helper/generalHelper');

router.get('/send', function(req, res) {
	console.log('1');
	res.send('radiliadi');
});

router.post('/send', function(req, res) {
	var result 			= [];
	var msg 			= 'Invalid params';
	var status 			= false;
	var jakTime 		= 25200;
	var d 				= Math.floor(new Date() / 1000)+jakTime;
	let news 			= new News();

	if (!req.body.nws_title) {
		var msg 		= 'Title cant be empty';
		var result 		= {response: result, message: msg, return: status};
		res.json(result);
		return false;
	}
	if (!req.body.nws_body) {
		var msg 		= 'News must have summary';
		var result 		= {response: result, message: msg, return: status};
		res.json(result);
		return false;
	}

	if (GH.isNumeric(req.body.nws_body)) {
		var msg 		= 'News Summary not allowed to be all number';
		var result 		= {response: result, message: msg, return: status};
		res.json(result);
		return false;
	}

	if (GH.isBadWords(req.body.nws_body)) {
		var msg 		= 'News Summary not allowed because badwords detected';
		var result 		= {response: result, message: msg, return: status};
		res.json(result);
		return false;
	}

	news.nws_id 			= req.body.nws_id;
	news.nws_title 			= req.body.nws_title;
	news.nws_body 			= req.body.nws_body;
	news.nws_topics 		= req.body.nws_topics;
	news.nws_type 			= req.body.nws_type;
	news.nws_author 		= req.body.nws_author;
	news.nws_reporter 		= req.body.nws_reporter;
	news.nws_contributor 	= req.body.nws_contributor;
	news.nws_reporter 		= req.body.nws_reporter;
	news.nws_editor 		= req.body.nws_editor;
	news.nws_is_draft 		= req.body.nws_is_draft ? req.body.nws_is_draft : 0;
	if (news.nws_is_draft) {
		news.nws_date_drafted 	= req.body.nws_date_drafted ? req.body.nws_date_drafted : d;
	}
	news.nws_is_publish 	= req.body.nws_is_publish ? req.body.nws_is_publish : 0;
	if (news.nws_is_publish) {
		news.nws_date_published = req.body.nws_date_published ? req.body.nws_date_published : d;
	}
	news.nws_date_created 	= req.body.nws_date_created ? req.body.nws_date_created : d;
	news.nws_status 		= 1;

	news.save(function(err) {
		var msg 		= 'Success';
		var status 		= true;
		var hasil 		= {response: result, message: msg, return: status};
		if (err) {
			var msg 	= 'Error';
			var status 	= false;
			res.json(hasil);
		}
		res.json(hasil);
	});

});

router.post('/', function(req, res) {
	var result 			= [];
	var msg 			= 'Invalid params';
	var status 			= false;
	var jakTime 		= 25200;
	var d 				= Math.floor(new Date() / 1000)+jakTime;
	var byDate 			= true;

	if ((req.body.nws_id == null || req.body.nws_id == '') || (req.body.nws_type == null || req.body.nws_type == '')) {
		var msg 		= 'Content Id or Type cant be empty'
		var result 		= {response: result, message: msg, return: status};
		res.json(result);
	}
	if (req.body.nws_type == 'article') {
		var type 		= 'article';
	}
	else if (req.body.nws_type == 'video') {
		var type 		= 'video';
	}
	else if (req.body.nws_type == 'live') {
		var type 		= 'live';
	}
	else {
		var msg 		= 'Undefined Content Type';
		var result 		= {response: result, message: msg, return: status};
		res.json(result);
	}
	var objRedis 		= {};
	objRedis.prefix 	= 'news';
	objRedis.enable 	= cacheRedis.news.enable;
	objRedis.expire 	= cacheRedis.news.expire;
	objRedis.ttl 		= cacheRedis.news.ttl;
	objRedis.params 	= req.body;
	// console.log(req.body);return false;
	var record_count 	= req.body.record_count ? req.body.record_count : 0;
	var start_index 	= req.body.start_index ? req.body.start_index : 0;
	var date_published 	= req.body.nws_date_published ? req.body.nws_date_published : d;
	// var date_published 	= req.body.date_published ? req.body.date_published : d.toISOString().replace(/T/, ' ').replace(/\..+/, '');
	let query 			= {_id:req.body.nws_id,nws_status:1,nws_is_publish:1,nws_type:type,nws_date_published:{$lte:date_published}};
	// let query 			= {_id:req.body.nws_id};
	var news 			= [];

	var promise1 = new Promise(function(resolve, reject) {
	    if (objRedis.enable) { 
	    	resolve('succes');
	    }
	    else {              
	        reject('redis ' + objRedis.prefix + ' is ' + objRedis.enable);
	    }
	});

	let myGetNewsById = function(p) {
		return new Promise(function(resolve, reject) {
			News.getNewsById(query, start_index, record_count, date_published, byDate, function(err, news) {
				if (news.length > 0) {
					for (let k in news) {
						var msg 				= 'Success'
						var status 				= true;
						var result 				= {numFound: news.length, message: msg, return: status, response: news};
						if (objRedis.enable) {
							objRedis.result = JSON.stringify(result);
							GH.redisSave(objRedis);
						}
						res.json(result);
					}
				}
			});
		});
	}

	let myRedisFetch = function(p) {
		return new Promise(function(resolve, reject) {
			GH.redisFetch(objRedis, function(redisData, err, value) {
				if (redisData) {
					console.log('loaded');
					if (err) {
						var result 	= {response: result, message: msg, return: status, error: err};
						res.json(result);
						reject('not okay');
					}
					res.json(JSON.parse(redisData));
					resolve('okay');
				}
				else {
					console.log('created');
					myGetNewsById();
				}
			});
		});
	}

	var promise2 = new Promise(function(resolve, reject) {
		if (myRedisFetch()) {
			resolve('Success access redis data : ' + objRedis.prefix)
		}
		else {
			reject('Failed access redis data : ' + objRedis.prefix)
		}
	});

	promise1.then(function(val) {
		promise2.then(function(val) {
			console.log(val);
		}).catch(function(val) {
			var result 		= {response: result, message: val, return: status};
			res.json(result);
		});
	}).catch(function(val) {
		var result 		= {response: result, message: val, return: status};
		res.json(result);

	});

});

router.get('/list', function(req, res) {
	News.getAllNews(function(err, comment) {
		if (err) {
			res.json(err);
		}
		res.json(comment);
	});
});

router.post('/delete', function(req, res) {
	var result 			= [];
	var msg 			= 'Invalid params';
	var status 			= false;
	let news 			= {};
	let query 			= {_id:req.body.nws_id,nws_status:1};
	// let query 			= {_id:nws_id,nws_status:1};
	news.status 		= 0;

	News.deleteNews(query, news, function(err, news) {
		if (err) {
			res.json(err);
			let data 	= {response: result, message: err, return: status};
			res.json(data);
		}
		if (news.n == 0) {
			var msg 	= 'Empty result, news already deleted';
			let data 	= {response: result, message: msg, return: status};
			res.json(data);
			return false;
		}
		else if (news.n > 0 && news.nModified > 0) {
			var msg 	= 'Success';
			let status 	= true
			let data 	= {response: result, message: msg, return: status};
			res.json(data);
		}
		else {
			let data 	= {response: result, message: msg, return: status};
			res.json(data);
			return false;
		}
	});
});

module.exports = router;