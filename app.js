
/**
 * Module dependencies.
 */

var express = require('express')
  , routes  = require('./routes')
  , user    = require('./routes/user')
  , tweets  = require('./routes/tweets')
  , http    = require('http')
  , path    = require('path')
  , url     = require('url')
  , request = require('request');

var app = express();

/**
 * App configuration
 */

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

/**
 * Application Routes
 */

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/tweets/:username', tweets.haiku);

/**
 * Create the server!
 */

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
