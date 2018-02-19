let express         = require('express');
let app             = express();
let bodyParser      = require('body-parser');
let mongoose        = require('mongoose');

// - - -  C O N F I G - - -
let config      = require('./config/main');
let sakataDb    = config.mongoDbName;
let sakataPort  = config.port;
// - - - E N D  C O N F I G - - -

// - - - C O R S - - -
// app.use(cors({
//         // credential:true,
//         // origin:true
//       }));
// app.use((req, res, next) => {
//     res.append('Access-Control-Allow-Origin', ['*']);
//     next();
// });
app.disable('x-powered-by');
app.use(function(req, res, next) {
  var _send = res.send;
  var sent = false;
  res.send = function(data) {
      if (sent) return;
      _send.bind(res)(data);
      sent = true;
  };
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers',
                'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
// - - - E N D  C O R S - - -

// - - - U T I L I T Y - -
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// - - - E N D  U T I L I T Y - -


// - - - M O N G O - - -
// connection
mongoose.connect('mongodb://'+config.mongoDbHost+'/'+sakataDb, {
});
var db = mongoose.connection;
// error
db.on('error', console.error.bind(console, 'connection error:'));
// connection open
db.once('open', () => {
  console.log(`Connected to Mongo (`+sakataDb+`) at: ${new Date()}`)
});
// - - - E N D  M O N G O - - -

// - - -  R O U T E S - - -
// start here
app.get('/', function(req, res) {
  res.send('version 1.0');
})
// route file
let newsRoute     = require('./routes/newsRoute');
let topicsRoute   = require('./routes/topicsRoute');
app.use('/news/', newsRoute);
app.use('/topics/', topicsRoute);
// - - - E N D  R O U T E S - - -


// - - - S E R V E R - - -
app.listen(sakataPort);
console.log('Running on port ' + sakataPort);
// - - - E N D  S E R V E R - - -