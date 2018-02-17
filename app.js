let express         = require('express');
let app             = express();
let sakataPort      = 3004;

// - - -  R O U T E S - - -
// start here
app.get('/', function(req, res) {
	res.send('version 1.0');
})
// - - - E N D  R O U T E S - - -


// - - - S E R V E R - - -
app.listen(sakataPort);
console.log('Running on port ' + sakataPort);
// - - - E N D  S E R V E R - - -