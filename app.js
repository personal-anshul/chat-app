//Module dependencies.
var express = require('express'),
  routes = require('./routes'),
  chat = require('./routes/chat'),
  http = require('http'),
  bcrypt = require('bcryptjs'),
  path = require('path'),
  cookieParser = require('cookie-parser'),
  methodOverride = require('method-override'),
  bodyParser = require('body-parser'),
  //express initialization
  app = express();

/*Global variable*/
global.errorMessage = null;
global.newUser = null;
global.url = 'mongodb://localhost:27017/chat_app';
global.MongoClient = require('mongodb').MongoClient;

//generic method to check if given variable has some value
function isValid(value) {
  if(value == "" || value == null || value == undefined) {
    return false;
  }
  else {
    return true;
  }
}

// initializing express-session middleware
var Session = require('express-session');
var SessionStore = require('session-file-store')(Session);
var session = Session({
  store: new SessionStore({path: __dirname+'/tmp/sessions'}),
  secret: '!@#456123$%^789&*()',
  resave: true,
  saveUninitialized: true
});

// view engine setup
app.set('port', 1992);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

//express configuration
app.use(express.json());
app.use(express.favicon("public/images/favicon.ico"));
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());
app.use(session);
app.use(app.router);
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

//server
var serve = http.createServer(app);
serve.listen(app.get('port'), function () {
  console.info('Windbag is running on port ' + app.get('port'));
});

// creating socket io app
var ios = require('./'),
  ioSocket = require('socket.io')(serve),
  ioSession = ios(session);
ioSocket.use(ioSession);

//routes
app.get('/', routes.index);
app.get('/logout', routes.logout);
app.get('/chat', chat.chatMsg);
app.post('/', function(req, res) {
  var password = isValid(req.body.userPassword) ? req.body.userPassword : req.body.userNewPassword,
    //used info
    users = {
      user_id: null,
      name: null
    };
  users.user_id = req.body.userID;
  users.name = req.body.userName;
  global.MongoClient.connect(global.url, function (err, db) {
    if(err){
      console.warn(err.message);
    }
    else {
      var collection = db.collection('user_info');
      if(!isValid(users.user_id)) {
        collection.findOne({"$query": {}, "$orderby": {"_id": -1}}, function(err, user) {
          var tempId = parseInt(user.user_id.toString().indexOf('_') == -1 ? 0 : user.user_id.split('_')[1]) + 1;
          users.user_id = users.name + "_" + tempId;
          collection.insert({
            user_id: users.user_id,
            user_name: users.name,
            password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
            date: new Date().valueOf()
          },
          function (err, o) {
            if (err) {
              console.warn(err.message);
            }
            else {
              console.info("user inserted into db: " + users.user_id);
              req.session.user = users.user_id;
              newUser = users.name;
              res.redirect('/chat');
            }
          });
        });
      }
      else {
        collection.findOne({"$query": {"user_id": users.user_id}}, function(err, user) {
          global.errorMessage = 'User doesn\'t exists. Try again.';
          if(user) {
            if(bcrypt.compareSync(password, user.password)) {
              global.errorMessage = "";
              users.name = user.user_name;
              console.info("user already exists in db: " + users.name);
              req.session.user = user.user_id;
              res.redirect('/chat');
            }
            else {
              console.info("Password doesn't matches with " + password);
              global.errorMessage = 'User ID and Password doesn\'t match. Try again.';
              res.redirect('/');
            }
          }
          else {
            res.redirect('/');
          }
        });
      }
    }
  });
});

//io connection event handler
ioSocket.on('connection', function (socket) {
  console.info((socket.handshake.session.user ? socket.handshake.session.user : 'anonymous_user') + ' connected..');
  //event handler to load chat on connection
  global.MongoClient.connect(global.url, function (err, db) {
    if(err){
      console.warn(err.message);
    }
    else {
      if(socket.handshake.session.user) {
        db.collection('user_info').findOne({"$query": {"user_id": socket.handshake.session.user}}, function(err, user) {
          if(user) {
            var collection = db.collection('chat_msg'),
              cursor = collection.find(),
              stream = null,
              //chat msg
              msg  = {
                content: null,
                user_id: null
              };
            cursor.count({}, function(err, c) {
              stream = cursor.skip(c-10).limit(10).stream();
              stream.on('data', function (chat) {
                msg.content = chat.content;
                msg.user_id = chat.user_id;
                socket.emit('event of chat on server', msg);
              });
              socket.emit('hide spinner');
            });
          }
          else {
            socket.emit('hide spinner');
            socket.handshake.session.user = null;
          }
        });
      }
      else {
        socket.emit('hide spinner');
        // socket.emit('no user', socket.handshake.session.user);
      }
    }
  });

  //event handler for socket disconnect
  socket.on('disconnect', function () {
    console.info((socket.handshake.session.user ? socket.handshake.session.user : 'anonymous_user') + ' disconnected..');
  });

  //event handler to load all chat messages
  socket.on('event of load more chats', function () {
    global.MongoClient.connect(global.url, function (err, db) {
      if(err){
        socket.emit('hide spinner');
        console.warn(err.message);
      }
      else {
        if(socket.handshake.session.user) {
          db.collection('user_info').findOne({"$query": {"user_id": socket.handshake.session.user}}, function(err, user) {
            if(user) {
              var collection = db.collection('chat_msg'),
                stream = collection.find().stream(),
                //chat msg
                chatMsg  = {
                  content: null,
                  user_id: null
                };
              stream.on('data', function (chat) {
                chatMsg.content = chat.content;
                chatMsg.user_id = chat.user_id;
                socket.emit('event of chat on server', chatMsg);
              });
              socket.emit('hide spinner');
            }
            else {
              socket.handshake.session.user = null;
              socket.emit('hide spinner');
            }
          });
        }
        else {
          socket.emit('hide spinner');
          // socket.emit('no user', socket.handshake.session.user);
        }
      }
    });
  });

  //event handler to save and broadcast chat messages
  socket.on('event of chat on client', function (message) {
    global.MongoClient.connect(global.url, function (err, db) {
      if(err){
        console.warn(err.message);
      }
      else {
        if(socket.handshake.session.user) {
          db.collection('user_info').findOne({"$query": {"user_id": socket.handshake.session.user}}, function(err, user) {
            if(user) {
              var collection = db.collection('chat_msg');
              collection.insert({
                content: message.content,
                user_id: socket.handshake.session.user,
                date: new Date().valueOf()
               },
               function (err, o) {
                if (err) {
                  console.warn(err.message);
                }
                else {
                  console.info("chat message inserted into db: " + message.content);
                  socket.broadcast.emit('event of chat on server', message);
                }
              });
            }
            else {
              socket.handshake.session.user = null;
            }
          });
        }
      }
    });
  });
});
