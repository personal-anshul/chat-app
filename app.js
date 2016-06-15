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

//post request for registration and login
app.post('/', function (req, res) {
  var password = isValid(req.body.userPassword) ? req.body.userPassword : req.body.userNewPassword,
    //used info
    users = {
      userId: null,
      name: null,
      email: null
    };
  users.email = isValid(req.body.userEmail) ? req.body.userEmail.toLowerCase() : undefined;
  users.userId = isValid(req.body.userID) ? req.body.userID.toLowerCase() : undefined;
  users.name = isValid(req.body.userName) ? req.body.userName.toLowerCase() : undefined;
  global.MongoClient.connect(global.url, function (err, db) {
    if(err){
      console.warn(err.message);
    }
    else {
      var collection = db.collection('user_info');
      if(!isValid(users.userId)) {
        collection.findOne({"$query": {}, "$orderby": {"_id": -1}}, function(err, user) {
          var tempId = parseInt(user.userId.toString().indexOf('_') == -1 ? 0 : user.userId.split('_')[1]) + 1;
          users.userId = users.name + "_" + tempId;
          collection.insert({
            _id: (new Date().valueOf() * 2) + "",
            userId: users.userId,
            email: users.email,
            userName: users.name,
            password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
            isConnected: 1,
            lastConnected: new Date().setMinutes(new Date().getMinutes() + 330).valueOf(),
            createdOn: new Date().setMinutes(new Date().getMinutes() + 330).valueOf()
          },
          function (err, o) {
            if (err) {
              console.warn(err.message);
              if (err.code === 11000) {
                global.errorMessage = 'Email already exists, please login with the same.';
                res.redirect('/');
              }
            }
            else {
              console.info("user inserted into db: " + users.userId);
              req.session.user = users.userId;
              global.newUser = users.name;
              req.session.newUser = users.name;
              res.redirect('/chat');
            }
          });
        });
      }
      else {
        global.newUser = null;
        collection.findOne({ $or: [{userId: users.userId},{email: users.userId}] }, function(err, user) {
          global.errorMessage = 'User doesn\'t exists. Try again.';
          if(user) {
            if(bcrypt.compareSync(password, user.password)) {
              if(user.isConnected == 1) {
                global.errorMessage = 'Already connected in other browser. please disconnect that before.';
                res.redirect('/');
              }
              else {
                db.collection('user_info').update(
                  { "userId": users.userId },
                  { $set:
                    {
                      "isConnected": 1,
                      lastConnected: new Date().setMinutes(new Date().getMinutes() + 330).valueOf()
                    }
                  },
                  function(err, success) {
                    console.info('isConnect updated.')
                  }
                );
                global.errorMessage = "";
                users.name = user.userName;
                console.info("user already exists in db: " + users.name);
                req.session.user = user.userId;
                req.session.newUser = users.name;
                res.redirect('/chat');
              }
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
  //show who is connected
  console.info((socket.handshake.session.user ? socket.handshake.session.user : 'anonymous_user') + ' connected..');

  //event handler to load chat on connection
  global.MongoClient.connect(global.url, function (err, db) {
    if(err){
      console.warn(err.message);
    }
    else {
      if(socket.handshake.session.user) {
        db.collection('user_info').findOne({"$query": {"userId": socket.handshake.session.user}}, function(err, user) {
          if(user) {
            socket.emit('remove users from list');
            db.collection('user_info').update(
              { "userId": socket.handshake.session.user },
              { $set:
                {
                  "isConnected": 1,
                  lastConnected: new Date().setMinutes(new Date().getMinutes() + 330).valueOf()
                }
              },
              function(err, success) {
                socket.broadcast.emit('remove users from list');
                console.info('isConnect updated.');
                var userStream = db.collection('user_info').find();
                userStream.count({}, function (err, c) {
                  if(c == 1) {
                    socket.emit('no user to load');
                  }
                  else {
                    userStream.stream().on('data', function (user) {
                      socket.emit('load all users', user);
                      socket.broadcast.emit('update all users', user);
                    });
                  }
                });
              }
            );
          }
          else {
            socket.handshake.session.user = null;
          }
        });
      }
      else {
        // socket.emit('no user', socket.handshake.session.user);
      }
    }
  });

  //event handler for socket disconnect
  socket.on('disconnect', function () {
    global.errorMessage = "";
    global.MongoClient.connect(global.url, function (err, db) {
      if(err){
        console.warn(err.message);
      }
      else {
        db.collection('user_info').update(
          { "userId": socket.handshake.session.user },
          { $set:
            {
              "isConnected": 0,
              lastConnected: new Date().setMinutes(new Date().getMinutes() + 330).valueOf()
            }
          },
          function(err, success) {
            socket.broadcast.emit('remove users from list');
            console.info('isConnect updated.');
            var userStream = db.collection('user_info').find().stream();
            userStream.on('data', function (user) {
              socket.broadcast.emit('update all users', user);
            });
          }
        );
      }
    });
    console.info((socket.handshake.session.user ? socket.handshake.session.user : 'anonymous_user') + ' disconnected..');
  });

  //event handler to broadcast info of user who is typing
  socket.on('get typing userinfo', function () {
    var userTyping = socket.handshake.session.user,
      userTypingFor = socket.handshake.session.friend;
    socket.broadcast.emit('update typing userinfo', userTyping, userTypingFor);
  });

  // remove typing userinfo once he/she moves out of textbox
  socket.on('remove typing userinfo', function () {
    var userTypingFor = socket.handshake.session.friend;
    socket.broadcast.emit('update typing userinfo', null, userTypingFor);
  })

  //event handler to load chat messages related to selected user
  socket.on('load related chat', function (friendUserId) {
    global.MongoClient.connect(global.url, function (err, db) {
      if(err){
        socket.emit('hide spinner');
        console.warn(err.message);
      }
      else {
        if(socket.handshake.session.user) {
          db.collection('user_info').findOne({"$query": {"_id": friendUserId}}, function(err, user) {
            if(user) {
              socket.handshake.session.friend = user.userId;
              var lastSeen = new Date(user.lastConnected).toJSON().split('T');
              var localDate = new Date().setMinutes(new Date().getMinutes() + 330);
              var userData = user.userId + ((user.isConnected == 1) ? "<br><small class='user-last-seen'>Online</small>" : ("<br><small class='user-last-seen'>last seen at " + (lastSeen[0] == new Date(localDate).toJSON().split('T')[0] ? "today" : lastSeen[0]) + " " + lastSeen[1].slice(0,5) + "</small>"));
              socket.emit('load user details for chat', userData, socket.handshake.session.user);
              socket.broadcast.emit('is user typing?');
              var collection = db.collection('chat_msg'),
                cursor = collection.find({
                  $or : [
                    {"toUser": socket.handshake.session.friend, "fromUser": socket.handshake.session.user},
                    {"fromUser": socket.handshake.session.friend, "toUser": socket.handshake.session.user}
                  ]
                }),
                stream = null,
                //chat msg
                msg  = {
                  content: null,
                  toUserId: null,
                  fromUserId: null
                };
              cursor.count({}, function(err, c) {
                if(c == 0) {
                  socket.emit('no chat to load');
                  socket.emit('hide load all chat link');
                }
                else {
                  stream = c < 10 ? cursor.stream() : cursor.skip(c-10).limit(10).stream();
                  stream.on('data', function (chat) {
                    msg.content = chat.content;
                    msg.toUserId = chat.toUser;
                    msg.fromUserId = chat.fromUser;
                    socket.emit('event of chat on server', msg);
                  });
                  if(c > 10) {
                    socket.emit('show load all chat link');
                  }
                  else {
                    socket.emit('hide load all chat link');
                  }
                }
              });
              socket.emit('hide spinner');
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
          db.collection('user_info').findOne({"$query": {"userId": socket.handshake.session.user}}, function(err, user) {
            if(user) {
              var collection = db.collection('chat_msg'),
                stream = collection.find().stream(),
                //chat msg
                chatMsg  = {
                  content: null,
                  toUserId: null,
                  fromUserId: null
                };
              stream.on('data', function (chat) {
                chatMsg.content = chat.content;
                chatMsg.toUserId = chat.toUser;
                chatMsg.fromUserId = chat.fromUser;
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
        if(socket.handshake.session.user && socket.handshake.session.friend) {
          db.collection('user_info').findOne({"$query": {"userId": socket.handshake.session.user}}, function(err, user) {
            if(user) {
              var collection = db.collection('chat_msg');
              collection.insert({
                content: message.content,
                fromUser: socket.handshake.session.user,
                toUser: socket.handshake.session.friend,
                createdOn: new Date().setMinutes(new Date().getMinutes() + 330).valueOf()
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
