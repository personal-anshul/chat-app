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
  msg  = {
    content: null,
    user_id: null
  },
  //session variable
  sess;

//generic method to get if given variable has some value
function isValid(value) {
  if(value == "" || value == null || value == undefined) {
    return false;
  }
  else {
    return true;
  }
}

/*Global variable*/
//used info
users = {
  user_id: null,
  name: null
};
//validation msg
errorMessage = null;

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
app.get('/', routes.index);
app.get('/chat', chat.chatMsg);
app.post('/', function(req, res) {
  //handle user info on form submission
  sess = req.session;
  users.user_id = req.body.userID;
  users.name = req.body.userName;
  msg.user_id = users.user_id;
  var url = 'mongodb://localhost:27017/chat_app',
    password = isValid(req.body.userPassword) ? req.body.userPassword : req.body.userNewPassword;
  MongoClient.connect(url, function (err, db) {
    if(err){
      console.warn(err.message);
    }
    else {
      var collection = db.collection('user_info');
      if(!isValid(users.user_id)) {
        var userData = collection.find().sort({"_id": -1}).limit(1).stream();
        userData.on("data", function(item) {
          users.user_id = (item.user_id.toString().indexOf('_') == -1 ? 0 : item.user_id.split('_')[1]);
          users.user_id = parseInt(users.user_id) + 1;
          collection.insert({
            user_id: users.name + "_" + users.user_id,
            user_name: users.name,
            password: password,
            date: new Date().valueOf()
            }, function (err, o) {
               if (err) {
                 console.warn(err.message);
               }
               else {
                 console.info("user inserted into db: " + users.user_id);
                 // sets a cookie with the user's info
                 if(sess) {
                   sess.userIdentity =  users.name + "_" + users.user_id;
                 }
               }
           });
        });
      }
      else {
        var userRecord = collection.find({"user_id": users.user_id}, {"user_name": 1, "password": 1, "_id": 0}).stream();
        errorMessage = 'User doesn\'t exists. Try again.';
        userRecord.on("data", function(item) {
          if(item.password == password) {
            errorMessage = "";
            users.name = item.user_name;
            console.info("user already exists in db: " + users.name);
            // sets a cookie with the user's info
            if(sess) {
              sess.userIdentity = users.user_id;
            }
          }
          else {
            console.info("Password doesn't matches with " + password);
            errorMessage = 'User ID and Password doesn\'t match. Try again.';
          }
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
