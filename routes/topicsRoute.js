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
	let topics 			= new Topics();

	if (!req.body.tpc_desc) {
		var msg 		= 'Description cant be empty';
		var result 		= {response: result, message: msg, return: status};
		res.json(result);
		return false;
	}

	topics.tpc_desc 		= req.body.tpc_desc;
	topics.tpc_created_by 	= req.body.tpc_created_by ? req.body.tpc_created_by : 'Unknown';
	topics.tpc_date_created = req.body.tpc_date_created ? req.body.tpc_date_created : d;
	topics.tpc_updated_by 	= '';
	topics.tpc_date_updated = 0;
	topics.tpc_deleted_by 	= '';
	topics.tpc_date_deleted = 0;
	topics.tpc_status 		= req.body.tpc_status ? req.body.tpc_status : 0;

	topics.save(function(err) {
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

router.post('/update', function(req, res) {
	var result 			= [];
	var msg 			= 'Invalid params';
	var status 			= false;
	var jakTime 		= 25200;
	var d 				= Math.floor(new Date() / 1000)+jakTime;
	let topics 			= {};

	if (!req.body.tpc_desc) {
		var msg 		= 'Description cant be empty';
		var result 		= {response: result, message: msg, return: status};
		res.json(result);
		return false;
	}

	topics.tpc_desc 		= req.body.tpc_desc;
	topics.tpc_updated_by 	= req.body.tpc_updated_by ? req.body.tpc_updated_by : 'Unknown';
	topics.tpc_date_updated = req.body.tpc_date_updated ? req.body.tpc_date_updated : d;
	topics.tpc_status 		= req.body.tpc_status ? req.body.tpc_status : 0;
	let query 				= {_id:req.body.tpc_id};

	Topics.updateTopicsById(query, topics, function(err, topics) {
		if (err) {
			res.json(err);
			let data 	= {response: result, message: err, return: status};
			res.json(data);
		}
		if (topics.n == 0) {
			var msg 	= 'Empty result, topics already deleted';
			let data 	= {response: result, message: msg, return: status};
			res.json(data);
			return false;
		}
		else if (topics.n > 0 && topics.nModified > 0) {
			var msg 	= 'Success';
			let status 	= true
			let data 	= {response: result, message: msg, return: status};
			res.json(data);
		}
		else {
			var msg 	= 'Undefined / No updated';
			let status 	= true;
			let data 	= {response: result, message: msg, return: status};
			res.json(data);
			// return false;
		}
	});
});

router.post('/', function(req, res) {
	var result 			= [];
	var msg 			= 'Invalid params';
	var status 			= false;
	var jakTime 		= 25200;
	var d 				= Math.floor(new Date() / 1000)+jakTime;
	var byDate 			= true;

	if ((req.body.tpc_id == null || req.body.tpc_id == '')) {
		var msg 		= 'Topic Id cant be empty'
		var result 		= {response: result, message: msg, return: status};
		res.json(result);
	}

	var objRedis 		= {};
	objRedis.prefix 	= 'topics';
	objRedis.enable 	= cacheRedis.topics.enable;
	objRedis.expire 	= cacheRedis.topics.expire;
	objRedis.ttl 		= cacheRedis.topics.ttl;
	objRedis.params 	= req.body;

	var record_count 	= req.body.record_count ? req.body.record_count : 0;
	var start_index 	= req.body.start_index ? req.body.start_index : 0;
	var date_published 	= req.body.date_published ? req.body.date_published : d;
	// var date_published 	= req.body.date_published ? req.body.date_published : d.toISOString().replace(/T/, ' ').replace(/\..+/, '');
	let query 			= {_id:req.body.tpc_id,tpc_status:1,tpc_date_created:{$lte:date_published}};
	// let query 			= {tpc_status:1};
	var topics 			= [];

	var promise1 = new Promise(function(resolve, reject) {
	    if (objRedis.enable) { 
	    	resolve('succes');
	    }
	    else {              
	        reject('redis ' + objRedis.prefix + ' is ' + objRedis.enable);
	    }
	});

	let myGetTopicsById = function(p) {
		return new Promise(function(resolve, reject) {
			Topics.getTopicsById(query, start_index, record_count, date_published, byDate, function(err, topics) {
				if (topics.length > 0) {
					for (let k in topics) {
						var msg 				= 'Success'
						var status 				= true;
						var result 				= {numFound: topics.length, message: msg, return: status, response: topics};
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
					myGetTopicsById();
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
	Topics.getAllTopics(function(err, topics) {
		if (err) {
			res.json(err);
		}
		res.json(topics);
	});
});

router.post('/delete', function(req, res) {
	var result 			= [];
	var msg 			= 'Invalid params';
	var status 			= false;
	var tpc_id 			= req.body.tpc_id;
	var tpc_status 		= 1;
	let query 			= {tpc_status:tpc_status};
	let topics 			= {};
	topics.tpc_status 	= 2;

	var objRedis 				= {};
	objRedis.enable 			= cacheRedis.topics.enable;
	objRedis.prefix 			= 'topics';
	objRedis.params 			= {};
	objRedis.params._id 		= tpc_id;
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

	Topics.deleteTopics(query, topics, function(err, topics) {
		if (err) {
			res.json(err);
			let data 	= {response: result, message: err, return: status};
			res.json(data);
		}
		if (topics.n == 0) {
			var msg 	= 'Empty result, topics already deleted';
			let data 	= {response: result, message: msg, return: status};
			res.json(data);
			return false;
		}
		else if (topics.n > 0 && topics.nModified > 0) {
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