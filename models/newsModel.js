let mongoose 	= require('mongoose');

let newsSchema = mongoose.Schema({
	// nws_id:{
	// 	type: String,
	// 	required: false
	// },
	nws_title:{
		type: String,
		// required: true
	},
	nws_body:{
		type: String,
		// required: true
	},
	nws_topics:{
		type: String
	},
	nws_type:{
		type: String
	},
	nws_author:{
		type: String
	},
	nws_reporter:{
		type: String
	},
	nws_contributor:{
		type: String
	},
	nws_editor:{
		type: String
	},
	nws_is_draft:{
		type: Number,
		default: 0
	},
	nws_date_drafted:{
		type: Number
	},
	nws_is_publish:{
		type: Number,
		default: 0
	},
	nws_date_published:{
		type: Number
	},
	nws_date_created:{
		type: Number
	},
	nws_date_updated:{
		type: Number
	},
	nws_date_deleted:{
		type: Number
	},
	nws_status:{
		type: Number,
		// default: 1
	}
});

let News = module.exports = mongoose.model('News', newsSchema);

module.exports.getAllNews = function(callback, limit) {
	let result 	= News.find(callback).limit(limit);
	let msg 	= 'success';
	let data 	= { 'response': result, 'message': msg };
    // callback(result);
	News.find(callback).limit(limit);
}

module.exports.getNewsById = function(query, start_index, record_count, date_published, byDate, callback, limit) {
	var urutan 	= { nws_date_published: -1 };
	// console.log(query);
	// console.log(urutan);
	// console.log(record_count);
	if (byDate) {
		// console.log('by date');
		News.find(query, callback).sort(urutan).limit(record_count);
	}
	else {
		// console.log('by skip');
		News.find(query, callback).sort(urutan).skip(start_index).limit(record_count);
	}
}

module.exports.deleteNews = function(query, news, callback) {
	News.updateOne(query, news, callback);
}

module.exports.searchNews = function(query, start_index, record_count, date_published, byDate, callback, limit) {
	var urutan 	= { nws_date_published: -1 };
	if (byDate) {
		// console.log('by date');
		News.find(query, callback).sort(urutan).limit(record_count);
	}
	else {
		// console.log('by skip');
		News.find(query, callback).sort(urutan).skip(start_index).limit(record_count);
	}
}