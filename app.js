//Module dependencies.
var express = require('express'),
  routes = require('./routes'),
  chat = require('./routes/chat'),
  http = require('http'),
  path = require('path'),
  cookieParser = require('cookie-parser'),
  methodOverride = require('method-override'),
  session = require('express-session'),
  bodyParser = require('body-parser'),
  //db client
  MongoClient = require('mongodb').MongoClient,
  //express initialization
  app = express(),
  //login used id
  users = {
    user_id: null,
    name: null
  },
  msg  = {
    content: null,
    user_id: null
  },
  //session variable
  sess;

// view engine setup
app.set('port', 1992);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
//express configuration
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride());
app.use(express.cookieParser());
app.use(session({
  secret:"123!@#456$%^789&*(0)",
  resave: false,
  saveUninitialized: false,
  maxAge: 50 * 60 * 1000
}));
app.use(app.router);
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

//server
var serve = http.createServer(app),
  ioSocket = require('socket.io')(serve);
serve.listen(app.get('port'), function () {
  console.info('Express server listening on port ' + app.get('port'));
});

//routes
app.get('/', function (req, res) {
  sess = req.session;
  console.log("sess.userIdentity: " + req.app.get('userInfo').name);
  if(req.app.get('userInfo').name) {
    res.redirect('/chat');
  }
  else {
    res.render('index', { title: 'Chat App' });
  }
});
app.get('/chat',function (req, res) {
  console.log("sess.userIdentity: " + req.app.get('userInfo').name);
  if(req.app.get('userInfo').name) {
    var userName = req.app.get('userInfo');
    res.render('chat', { title: 'Chat App', loggedInUser: userName.name });
  }
  else {
    res.redirect('/');
  }
});
app.post('/', function(req, res) {
  //handle user info on form submission
  sess = req.session;
  users.user_id = req.body.userID;
  users.name = req.body.userName;
  msg.user_id = users.user_id;
  var url = 'mongodb://localhost:27017/chat_app',
    location = req.body.userLocation;
  MongoClient.connect(url, function (err, db) {
    if(err){
      console.warn(err.message);
    }
    else {
      var collection = db.collection('user_info');
      if(users.user_id == "" || users.user_id == null || users.user_id == undefined) {
        var userData = collection.find().sort({"_id": -1}).limit(1).stream();
        userData.on("data", function(item) {
          users.user_id = (item.user_id.toString().indexOf('_') == -1 ? 0 : item.user_id.split('_')[1]);
          users.user_id = parseInt(users.user_id) + 1;
          collection.insert({
            user_id: users.name + "_" + users.user_id,
            user_name: users.name,
            location: location,
            date: new Date().valueOf()
            }, function (err, o) {
               if (err) {
                 console.warn(err.message);
               }
               else {
                 userData = null; collection = null;
                 console.info("user inserted into db: " + users.user_id);
                 // sets a cookie with the user's info
                 if(sess) {
                   sess.userIdentity =  users.name + "_" + users.user_id;
                 }
                 console.log("sess.userIdentity: " + sess.userIdentity);
               }
           });
        });
      }
      else {
        var userName = collection.find({"user_id": users.user_id}, {"user_name": 1, "_id": 0}).stream();
        userName.on("data", function(item) {
          users.name = item.user_name;
          console.info("user already exists in db: " + users.name);
          // sets a cookie with the user's info
          if(sess) {
            sess.userIdentity = users.user_id;
          }
          console.log("sess.userIdentity: " + sess.userIdentity);
        });
      }
    }
  });
  res.redirect('/chat');
});
app.configure(function() {
  app.set('userInfo', users);
});
//io connection event handler
ioSocket.on('connection', function (socket) {
    console.info('a user connected..');
    var url = 'mongodb://localhost:27017/chat_app';
    MongoClient.connect(url, function (err, db) {
        if(err){
            console.warn(err.message);
        }
        else {
          var collectionUser = db.collection('user_info'),
            collection = db.collection('chat_msg'),
            stream = collection.find().sort({"_id": -1}).limit(10).stream();
          stream.on('data', function (chat) {
            msg.content = chat.content;
            msg.user_id = chat.user_id;
            socket.emit('chat', msg);
          });
        }
    });

    //socket disconnect event handler
    socket.on('disconnect', function () {
        console.info('user disconnected..');
    });

    //socket chat event handler
    socket.on('chat', function (message) {
      MongoClient.connect(url, function (err, db) {
        if(err){
          console.warn(err.message);
        }
        else {
          var collection = db.collection('chat_msg');
          if(sess) {
            message.user_id = sess.userIdentity;
            users.user_id = sess.userIdentity;
          }
          collection.insert({
            content: message.content,
            user_id: message.user_id,
            date: new Date().valueOf()
           }, function (err, o) {
            if (err) {
              console.warn(err.message);
            }
            else {
              console.info("chat message inserted into db: " + message.content);
            }
          });
        }
      });
      socket.broadcast.emit('chat', message);
    });

});
