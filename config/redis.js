require('dotenv').config();

module.exports = {
	redisDbHost: process.env.REDIS_HOST,
	redisDbPassword: process.env.REDIS_PASSWORD,
	redisDbNumber: process.env.REDIS_DB,
	redisDbPort: process.env.REDIS_PORT,
	redisDbNested: 'kmprn:api:'
};