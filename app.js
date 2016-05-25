//Module dependencies.
var express = require('express');
var routes = require('./routes');
var chat = require('./routes/chat');
var http = require('http');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

//db client
var MongoClient = require('mongodb').MongoClient;
//express initialization
var app = express();
//login used id
var user = {
  user_id: null,
  name: null
};
var msg  = {
  content: null,
  user_id: null
};

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
app.use(cookieParser());
app.use(app.router);
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

//server
var serve = http.createServer(app);
var ioSocket = require('socket.io')(serve);
serve.listen(app.get('port'), function () {
  console.info('Express server listening on port ' + app.get('port'));
});

//routes
app.get('/', routes.index);
app.get('/chat', chat.chatApp);
app.post('/', function(req, res) {
  //handle user info on form submission
  user.user_id = req.body.userID;
  user.name = req.body.userName;
  msg.user_id = user.user_id;
  var url = 'mongodb://localhost:27017/chat_app',
    location = req.body.userLocation;
  MongoClient.connect(url, function (err, db) {
    if(err){
      console.warn(err.message);
    }
    else {
      var collection = db.collection('user_info');
      if(user.user_id == "" || user.user_id == null || user.user_id == undefined) {
        var userData = collection.find({}, {"user_id": 1, "_id": 0}).sort({"user_id": -1}).limit(1).stream();
        userData.on("data", function(item) {
          user.user_id = (item.user_id.toString().indexOf('_') == -1 ? 0 : item.user_id.split('_')[1]);
          user.user_id = parseInt(user.user_id) + 1;
          collection.insert({
            user_id: user.name + "_" + user.user_id,
            user_name: user.name,
            location: location,
            date: new Date().valueOf()
            }, function (err, o) {
               if (err) {
                 console.warn(err.message);
               }
               else {
                 console.info("user inserted into db: " + user.user_id);
               }
           });
        });
      }
      else {
        var userName = collection.find({"user_id": user.user_id}, {"user_name": 1, "_id": 0}).stream();
        userName.on("data", function(item) {
          console.log(item.user_name);
          user.name = item.user_name;
          console.info("user already exists in db: " + user.name);
        });
      }
    }
  });
  res.redirect('/chat');
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
          var collectionUser = db.collection('user_info');
          var collection = db.collection('chat_msg');
          var stream = collection.find().sort({"_id": -1}).limit(10).stream();
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
    socket.on('chat', function (msg) {
      MongoClient.connect(url, function (err, db) {
        if(err){
          console.warn(err.message);
        }
        else {
          var collection = db.collection('chat_msg');
          collection.insert({
            content: msg.content,
            user_id: msg.user_id,
            date: new Date().valueOf()
           }, function (err, o) {
            if (err) {
              console.warn(err.message);
            }
            else {
              console.info("chat message inserted into db: " + msg.content);
            }
          });
        }
      });
      socket.broadcast.emit('chat', msg);
    });

});
