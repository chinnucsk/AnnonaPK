/**
 * Module dependencies.
 */

var express = require('express'),
    http = require('http'),
    path = require('path'),
    passport = require('passport'),
    index = require('./routes/index'),
    user = require('./routes/user'),
    hightlight = require('./routes/highlight'),
    analyzeApk = require('./routes/api/analyze_apk'),
    search = require('./routes/api/search'),
    download = require('./routes/api/download'),
    list = require('./routes/api/list'),
    fs = require('fs'),
    mkdirp = require('mkdirp');

var dbSetup = require('./store/setup');
var pass = require('./config/pass');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon(__dirname + '/public/images/icon.png'));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

// app.use(express.static(path.join(__dirname, '../apk')));
//console.log(path.join(__dirname, 'apk'))

app.use(express.bodyParser());

// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/apk', function(req, res) {
  res.redirect('/');
});

app.get('/apk/*.java', hightlight.hightlight);
app.use('/apk',express.directory(path.join(__dirname, '../apk')), {icons:true});
app.use('/apk',express.static(path.join(__dirname, '../apk')));

app.get('/', index.index);
app.get('/analyze', index.index);
app.get('/search', index.search);
app.get('/browse', index.browse);
app.get('/pricing', index.pricing);
app.get('/apkinfo', index.apkinfo);

// GET /auth/twitter
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Twitter authentication will involve redirecting
//   the user to twitter.com.  After authorization, the Twitter will redirect
//   the user back to this application at /auth/twitter/callback
app.get('/auth/twitter',
  passport.authenticate('twitter'),
  function(req, res){
    // The request will be redirected to Twitter for authentication, so this
    // function will not be called.
});

// GET /auth/twitter/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { failureRedirect: '/user/login' }),
  function(req, res) {
    res.redirect('/user/profile');
});

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve
//   redirecting the user to google.com.  After authorization, Google
//   will redirect the user back to this application at /auth/google/callback
app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.profile',
                                            'https://www.googleapis.com/auth/userinfo.email'] }), 
  function(req, res){
    // The request will be redirected to Google for authentication, so this
    // function will not be called.
}); 

// GET /auth/google/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/user/login' }), 
  function(req, res) {
    res.redirect('/user/profile');
}); 

// GET /auth/facebook
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Facebook authentication will involve
//   redirecting the user to facebook.com.  After authorization, Facebook will
//   redirect the user back to this application at /auth/facebook/callback
app.get('/auth/facebook',
  passport.authenticate('facebook', { scope : 'email'}),
  function(req, res){
    res.redirect('/user/profile');
    // The request will be redirected to Facebook for authentication, so this
    // function will not be called.
  });

// GET /auth/facebook/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { failureRedirect: '/user/login' }),
  function(req, res) {
    res.redirect('/user/profile');
  });


app.get('/user/profile', user.profile);
app.get('/api/user/profile', user.profileApi);

app.post('/user/register', user.register); 
app.get('/user/login', user.getLogin);
app.post('/user/login', user.postLogin); 

app.get('/user/logout', user.postLogin); 

app.get('/api/apk/search', search.index);
app.get('/api/apk/download', download.index);
app.get('/api/apk/list', list.index);

// we need the fs module for moving the uploaded files
app.post('/api/apk/analyze', analyzeApk.run);

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
