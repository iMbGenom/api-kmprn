require('dotenv').config();

module.exports = {
	mongoDbHost: process.env.MONGO_HOST,
	mongoDbUser: process.env.MONGO_USER,
	mongoDbPassword: process.env.MONGO_PASSWORD,
	mongoDbName: process.env.MONGO_NAME,
	port: 3004
};