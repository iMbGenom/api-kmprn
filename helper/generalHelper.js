let redis           = require('redis');
var SHA256          = require('crypto-js/sha256');
let configRedis     = require('./../config/redis');
let redisUser       = configRedis.redisDbUser;
let redisPassword   = configRedis.redisDbPassword;
let redisHost       = configRedis.redisDbHost;
let redisDatabase   = configRedis.redisDbNumber;
let redisPort       = configRedis.redisDbPort;
let redisNested     = configRedis.redisDbNested;

// var client = redis.createClient(redisPort, redisHost, {no_ready_check: true});
var client = redis.createClient({host:redisHost, no_ready_check:true, auth_pass:redisPassword});
client.select(redisDatabase);
client.auth(redisPassword, function (err) {
    if (err) {
      res.json(err);
    }
});

client.on('connect', function() {
    console.log('Connected to Redis (' + redisHost + ':' + redisPort + ')');
});

module.exports = {
  redisSave: function(objRedis) {
    if (objRedis.enable) {
      var redisKey   = objRedis.prefix + SHA256(objRedis.params);
      if (objRedis.expire) {
        client.set(redisNested + redisKey, objRedis.result, 'EX', objRedis.ttl);
      }
      else {
        client.set(redisNested + redisKey, objRedis.result, redis.print);
      }
    }
  },
  redisFetch: function(objRedis, callback) {
    if (objRedis.enable) {
      var redisKey   = objRedis.prefix + SHA256(objRedis.params);
      client.get(redisNested + redisKey, function(err, value) {
        callback(value);
      });
    }
  },
  redisDelete: function(objRedis, callback) {
    if (objRedis.enable) {
      var redisKey   = objRedis.prefix + SHA256(objRedis.params);
      client.del(redisNested + redisKey, function(err, value) {
        callback(value);
      });
    }
  },
  isNumeric: function(text) {
    result = !isNaN(parseFloat(text)) && isFinite(text);

    return result;
  },
  isBadWords: function(text) {
    var status = false;
    if (text) {
      var space     = text.replace(/\s+/g, '');
      var lower     = space.toLowerCase();
      const badList = [/lele/, /kampret/, /anjing/, /babi/];

      if (badList) {
        const isMatch = badList.some(rx => rx.test(lower));
        if (isMatch) {
          var status = true;
        }
      }
    }

    return status;
  }
};
