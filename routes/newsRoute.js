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
	News.getAllNews(function(err, news) {
		if (err) {
			res.json(err);
		}
		res.json(news);
	});
});

router.post('/delete', function(req, res) {
	var result 			= [];
	var msg 			= 'Invalid params';
	var status 			= false;
	var nws_id 			= req.body.nws_id;
	var nws_type 		= req.body.nws_type;
	var nws_status 		= 1;
	let query 			= {_id:nws_id,nws_type:nws_type,nws_status:nws_status};
	let news 			= {};
	news.nws_status 	= 2;

	var objRedis 				= {};
	objRedis.enable 			= cacheRedis.news.enable;
	objRedis.prefix 			= 'news';
	objRedis.params 			= {};
	objRedis.params._id 		= nws_id;
	objRedis.params.nws_type	= nws_type;
	objRedis.params.start_index = req.body.start_index ? req.body.start_index : 0;
	objRedis.params.record_count= req.body.record_count ? req.body.record_count : 10;

	if (objRedis.enable) {
		GH.redisDelete(objRedis, function(redisData, err, value) {
			if (redisData) {
				console.log('delete failed');
			}
			console.log('delete success');
		});
	}

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

router.post('/search', function(req, res) {
	var result 			= [];
	var search 			= [];
	var msg 			= 'Invalid params';
	var status 			= false;
	var jakTime 		= 25200;
	var d 				= Math.floor(new Date() / 1000)+jakTime;
	var byDate 			= true;
	var nws_status 		= 1;
	let start_index 	= req.body.start_index ? req.body.start_index : 0;
	let record_count 	= req.body.record_count ? req.body.record_count : 10;
	let date_published 	= req.body.nws_date_published ? req.body.nws_date_published : d;
	let query 			= {nws_status:nws_status,nws_topics:{$regex:'.*' + req.body.nws_topics.toLowerCase() + '.*'}};

	var objRedis 				= {};
	objRedis.enable 			= cacheRedis.search.enable;
	objRedis.prefix 			= 'search';
	objRedis.params 			= {};
	objRedis.params.topics 		= req.body.nws_topics;
	objRedis.params.status		= nws_status;
	objRedis.params.start_index = start_index ? start_index : 0;
	objRedis.params.record_count= record_count ? record_count : 10;

	News.searchNews(query, start_index, record_count, date_published, byDate, function(err, search) {
		if (search.length > 0) {
			for (let k in search) {
				var msg 				= 'Success'
				var status 				= true;
				var result 				= {numFound: search.length, message: msg, return: status, response: search};
				if (objRedis.enable) {
					objRedis.result = JSON.stringify(result);
					GH.redisSave(objRedis);
				}
				res.json(result);
			}
		}
		else {
			var result 	= {numFound: 0, message: msg, return: status, response: search};
			res.json(result)
		}
	});
});

router.post('/filter', function(req, res) {
	var result 			= [];
	var filter 			= [];
	var msg 			= 'Invalid params';
	var status 			= false;
	var jakTime 		= 25200;
	var d 				= Math.floor(new Date() / 1000)+jakTime;
	var byDate 			= true;
	var nws_status 		= 1;
	var filter_status 	= req.body.status;
	let start_index 	= req.body.start_index ? req.body.start_index : 0;
	let record_count 	= req.body.record_count ? req.body.record_count : 10;
	let date_published 	= req.body.nws_date_published ? req.body.nws_date_published : d;
	var query 			= {nws_status:nws_status};
	if (filter_status == 0) { //draft
		var query 		= {nws_status:nws_status,nws_is_draft:1};
	}
	else if (filter_status == 1) { //delete
		var nws_status 	= 2
		var query 		= {nws_status:nws_status};
	}
	else if (filter_status == 2) { //publish
		var query 		= {nws_status:nws_status,nws_is_publish:1};
	}
	else {
		var result 	= {numFound: 0, message: msg, return: status, response: filter};
		res.json(result);
		return false;
	}

	var objRedis 				= {};
	objRedis.enable 			= cacheRedis.filter.enable;
	objRedis.prefix 			= 'filter';
	objRedis.params 			= {};
	objRedis.params.topics 		= req.body.nws_topics;
	objRedis.params.status		= nws_status;
	objRedis.params.start_index = start_index ? start_index : 0;
	objRedis.params.record_count= record_count ? record_count : 10;

	News.searchNews(query, start_index, record_count, date_published, byDate, function(err, filter) {
		if (filter.length > 0) {
			for (let k in filter) {
				var msg 				= 'Success'
				var status 				= true;
				var result 				= {numFound: filter.length, message: msg, return: status, response: filter};
				if (objRedis.enable) {
					objRedis.result = JSON.stringify(result);
					GH.redisSave(objRedis);
				}
				res.json(result);
			}
		}
		else {
			var result 	= {numFound: 0, message: msg, return: status, response: filter};
			res.json(result)
		}
	});
});

module.exports = router;