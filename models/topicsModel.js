let mongoose 	= require('mongoose');

let topicsSchema = mongoose.Schema({
	tpc_desc:{
		type: String,
		required: true
	},
	tpc_created_by:{
		type: String
	},
	tpc_updated_by:{
		type: String
	},
	tpc_deleted_by:{
		type: String
	},
	tpc_date_created:{
		type: Number
	},
	tpc_date_updated:{
		type: Number
	},
	tpc_date_deleted:{
		type: Number
	},
	tpc_status:{
		type: Number,
		// default: 1
	}
});

let Topics = module.exports = mongoose.model('Topics', topicsSchema);

module.exports.getAllTopics = function(callback, limit) {
	let result 	= Topics.find(callback).limit(limit);
	let msg 	= 'success';
	let data 	= { 'response': result, 'message': msg };
    // callback(result);
	Topics.find(callback).limit(limit);
}

module.exports.getTopicsById = function(query, start_index, record_count, date_published, byDate, callback, limit) {
	var urutan 	= { tpc_date_created: -1 };
	if (byDate) {
		console.log('by date');
		Topics.find(query, callback).sort(urutan).limit(record_count);
	}
	else {
		console.log('by skip');
		Topics.find(query, callback).sort(urutan).skip(start_index).limit(record_count);
	}
}

module.exports.updateTopicsById = function(query, topics, callback) {
	Topics.updateOne(query, topics, callback);
}

module.exports.deleteTopics = function(query, topics, callback) {
	Topics.updateOne(query, topics, callback);
}