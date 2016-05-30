//Module dependencies.
var express = require('express'),
  routes = require('./routes'),
  chat = require('./routes/chat'),
  http = require('http'),
  path = require('path'),
  cookieParser = require('cookie-parser'),
  methodOverride = require('method-override'),
  session = require('client-sessions'),
  bodyParser = require('body-parser'),
  //db client
  MongoClient = require('mongodb').MongoClient,
  //express initialization
  app = express(),
  msg  = {
    content: null,
    user_id: null
  },
  sess,
  //used info
  users = {
    user_id: null,
    name: null
  };

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
  cookieName: 'session',
  duration: 10 * 60 * 1000,
  activeDuration: 2 * 60 * 1000
}));
app.use(app.router);
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

//server
var serve = http.createServer(app),
  ioSocket = require('socket.io')(serve);
serve.listen(app.get('port'), function () {
  console.info('Server is listening on port ' + app.get('port'));
});

//routes
app.get('/', function(req, res) {
  if(req.session && req.session.userData) {
    //TO DO : check whether data is valid
    res.redirect('/chat');
  }
  else {
    res.render('index', { title: 'Login', errorMsg: errorMessage });
    errorMessage = "";
  }
});
app.get('/chat', function(req, res) {
  if(req.session && req.session.userData) {
    errorMessage = "";
    //TO DO : check whether data is valid
    res.render('chat', { title: 'Home', user: users });
  }
  else {
    res.redirect('/');
  }
});
app.get('/logout', function(req, res) {
  req.session.reset();
  errorMessage = "";
  res.redirect('/');
});
app.post('/', function(req, res) {
  //handle user info on form submission
  users.user_id = req.body.userID;
  users.name = req.body.userName;
  msg.user_id = users.user_id;
  var url = 'mongodb://localhost:27017/chat_app',
    password = isValid(req.body.userPassword) ? req.body.userPassword : req.body.userNewPassword;
  //connection with db
  MongoClient.connect(url, function (err, db) {
    if(err){
      console.warn(err.message);
    }
    else {
      var collection = db.collection('user_info');
      if(!isValid(users.user_id)) {
        collection.findOne({}, {sort:{'_id': -1}},  function(err, lastUser) {
          var tempId = parseInt(lastUser.user_id.toString().indexOf('_') == -1 ? 0 : lastUser.user_id.toString().split('_')[1]) + 1;
          users.user_id = users.name.split(' ')[0] + "_" + tempId;
          collection.insert({
            user_id: users.user_id,
            user_name: users.name,
            password: password,
            date: new Date().valueOf()
            }, function (err, o) {
              if (err) {
                console.warn(err.message);
              }
              else {
                console.info("User inserted into db with ID: " + users.user_id);
                // sets a cookie with the user's info
                req.session.userData = users;
                res.redirect('/chat');
              }
          });
        });
      }
      else {
        collection.findOne({"user_id": users.user_id}, function(err, user) {
          errorMessage = 'User doesn\'t exists. Try again.';
          if(!isValid(user)) {
            res.redirect('/');
            return;
          }
          if(user.password == password) {
            errorMessage = "";
            users.name = user.user_name;
            console.info("User exists in db with name: " + users.name);
            // sets a cookie with the user's info
            req.session.userData = users;
            res.redirect('/chat');
          }
          else {
            console.info("Password doesn't match with " + password + " since it shud be: " + user.password + " for user: " + user.user_name);
            errorMessage = 'User ID and Password doesn\'t match. Try again.';
            res.redirect('/');
          }
        });
      }
    }
  });
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
        msg.user_id = chat.user_id; //TO DO : need to get user name using this id
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
    console.log("chat message- " + message);
    MongoClient.connect(url, function (err, db) {
      if(err){
        console.warn(err.message);
      }
      else {
        var collection = db.collection('chat_msg');
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
