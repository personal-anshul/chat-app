//Module dependencies.
var express = require('express'),
  routes = require('./routes'),
  chat = require('./routes/chat'),
  http = require('http'),
  bcrypt = require('bcryptjs'),
  path = require('path'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  multer  =   require('multer'),
  // required for file serving
  fs = require('fs'),
  //express initialization
  app = express(),
  //upload file from local disk to server
  storage = multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, './uploads');
    },
    filename: function (req, file, callback) {
      var fileExtension = file.originalname.split('.'),
        fileName = req.session.user + "-" + req.query.id + "-" + req.query.span;
      callback(null, fileName + "." + fileExtension[fileExtension.length - 1]);
    }
  }),
  upload = multer({ storage : storage}).single('dataFile');
  storageDp = multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, './public/dp');
    },
    filename: function (req, file, callback) {
      var fileName = req.session.user + "-" + getCode(req.session.user) + "-" + req.query.span;
      callback(null, fileName);
    }
  }),
  uploadDP = multer({ storage : storageDp}).single('dataFile');

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

//encryption
global.getCode = function(stringData) {
  var series = "1325849170636298",
    alphabets = "qwertyuiopasdfghjklzxcvbnm_1234567890!@#%^&*",
    code = "", temp;
  for(i = 0; i < stringData.length; i++) {
    temp = alphabets[parseInt(alphabets.indexOf(stringData[i])) + parseInt(series[i])];
    code = code + (temp == undefined ? "$" + stringData[i] : temp);
  }
  return code;
}

// initializing express-session middleware
var Session = require('express-session');
var SessionStore = require('session-file-store')(Session);
var session = Session({
  store: new SessionStore({path: __dirname + '/tmp/sessions'}),
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
//post request to upload data file
app.post('/api/photo', function(req,res){
  upload(req,res,function(err) {
    if(err) {
      return res.end("Error uploading file.");
    }
    res.redirect("/chat?id=" + req.query.id);
  });
});
//post request to upload data file
app.post('/api/dp', function(req,res){
  uploadDP(req,res,function(err) {
    if(err) {
      return res.end("Error uploading dp.");
    }
    if(req.query.id) {
      res.redirect("/chat?id=" + req.query.id);
    }
    else {
      res.redirect("/chat");
    }
  });
});
//post request to download data file
app.get('/download', function(req, res){
  var file = __dirname + "/uploads/";
  if(req.query.id == req.session.user || req.query.name == req.session.user) {
    file = file + req.query.id + "-" + req.query.name + "-" + req.query.span + "." + req.query.type;
  }
  //provide file name
  var filename = path.basename(file);
  res.setHeader('Content-disposition', 'attachment; filename=file_' + filename.split('-')[2]);
  var filestream = fs.createReadStream(file);
  filestream.pipe(res);
});
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
      socket.emit('connection closed');
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
            dpName: null,
            isConnected: 1,
            lastConnected: new Date().setMinutes(new Date().getMinutes() + 330).valueOf(),
            createdOn: new Date().setMinutes(new Date().getMinutes() + 330).valueOf()
          },
          function (err, o) {
            if (err) {
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
                  }
                );
                global.errorMessage = "";
                users.name = user.userName;
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
      socket.emit('connection closed');
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
                var userStream = db.collection('user_info').find().sort({"userName": 1});
                userStream.count({}, function (err, c) {
                  if(c == 1) {
                    socket.emit('no user to load');
                  }
                  else {
                    userStream.stream().on('data', function (user) {
                      if(socket.handshake.session.user == user.userId) {
                        socket.emit('load display image', user.dpName);
                      }
                      db.collection('pending_chat').findOne({
                        "$query": { "userTo": socket.handshake.session.user, "userFrom": user.userId }},
                        function(err, data) {
                          if(data) {
                            socket.emit('load all users', user, data.pendingChat);
                            socket.broadcast.emit('update all users', user);
                          }
                          else {
                            socket.emit('load all users', user, 0);
                            socket.broadcast.emit('update all users', user);
                          }
                        }
                      );
                    });
                  }
                });
              }
            );
          }
          else {
            socket.emit('user session is expired', socket.handshake.session.user);
            delete socket.handshake.session.user;
          }
        });
      }
      else {
        socket.emit('user session is expired', socket.handshake.session.user);
        delete socket.handshake.session.user;
      }
    }
  });

  //event handler for socket disconnect
  socket.on('disconnect', function () {
    global.errorMessage = "";
    global.MongoClient.connect(global.url, function (err, db) {
      if(err){
        socket.emit('connection closed');
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
            var userStream = db.collection('user_info').find().sort({"userName": 1}).stream();
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
  });

  //event handler to load chat messages related to selected user
  socket.on('load related chat', function (friendUserId) {
    global.MongoClient.connect(global.url, function (err, db) {
      if(err){
        socket.emit('hide spinner');
        socket.emit('connection closed');
      }
      else {
        if(socket.handshake.session.user) {
          db.collection('user_info').findOne({"$query": {"_id": friendUserId}}, function(err, user) {
            if(user) {
              socket.emit('load dp', user.dpName, user.userId);
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
                }).sort({ createdOn: 1}),
                stream = null;
              cursor.count({}, function(err, c) {
                if(c == 0) {
                  socket.emit('no chat to load');
                  socket.emit('hide load all chat link');
                }
                else {
                  if(c > 10) {
                    socket.emit('show load all chat link');
                  }
                  else {
                    socket.emit('hide load all chat link');
                  }
                  stream = c < 10 ? cursor.stream() : cursor.skip(c-10).limit(10).stream();
                  stream.on('data', function (chat) {
                    socket.emit('event of chat on server', chat);
                  });
                  db.collection('pending_chat').update(
                    { "userTo": socket.handshake.session.user, "userFrom": socket.handshake.session.friend },
                    { $set: { "pendingChat": 0 } },
                    function(err, success) {
                      socket.emit('update notification count', socket.handshake.session.user, socket.handshake.session.friend);
                    }
                  );
                }
              });
              socket.emit('hide spinner');
            }
            else {
              socket.emit('user session is expired', socket.handshake.session.user);
              delete socket.handshake.session.user;
            }
          });
        }
        else {
          socket.emit('user session is expired', socket.handshake.session.user);
          delete socket.handshake.session.user;
        }
      }
    });
  });

  //event handler to load all chat messages
  socket.on('event of load more chats', function () {
    global.MongoClient.connect(global.url, function (err, db) {
      if(err){
        socket.emit('hide spinner');
        socket.emit('connection closed');
      }
      else {
        if(socket.handshake.session.user) {
          db.collection('user_info').findOne({"$query": {"userId": socket.handshake.session.user}}, function(err, user) {
            if(user) {
              var stream = db.collection('chat_msg').find({
                  $or : [
                    {"toUser": socket.handshake.session.friend, "fromUser": socket.handshake.session.user},
                    {"fromUser": socket.handshake.session.friend, "toUser": socket.handshake.session.user}
                  ]
                }).sort({ createdOn: 1}).stream();
              stream.on('data', function (chat) {
                socket.emit('event of chat on server', chat);
              });
              db.collection('pending_chat').update(
                { "userTo": socket.handshake.session.user, "userFrom": socket.handshake.session.friend },
                { $set: { "pendingChat": 0 } },
                function(err, success) {
                  socket.emit('update notification count', socket.handshake.session.user, socket.handshake.session.friend);
                }
              );
              socket.emit('hide spinner');
            }
            else {
              socket.emit('user session is expired', socket.handshake.session.user);
              delete socket.handshake.session.user;
            }
          });
        }
        else {
          socket.emit('user session is expired', socket.handshake.session.user);
          delete socket.handshake.session.user;
        }
      }
    });
  });

  //event handler to save and broadcast chat messages
  socket.on('event of chat on client', function (message) {
    global.MongoClient.connect(global.url, function (err, db) {
      if(err){
        socket.emit('connection closed');
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
                fileType: null,
                createdOn: message.createdOn
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
              socket.emit('user session is expired', socket.handshake.session.user);
              delete socket.handshake.session.user;
            }
          });
        }
        else {
          socket.emit('user session is expired', socket.handshake.session.user);
          delete socket.handshake.session.user;
        }
      }
    });
  });

  //event handler to save pending chat notifications
  socket.on('pending-chat', function (userTo, userFrom) {
    global.MongoClient.connect(global.url, function (err, db) {
      if(err){
        socket.emit('connection closed');
      }
      else {
        var collection = db.collection('pending_chat');
        collection.findOne({"$query": { "userTo": userTo, "userFrom": userFrom }}, function(err, data) {
          if(data) {
            collection.update(
              { "userTo": userTo, "userFrom": userFrom },
              { $set: { "pendingChat": parseInt(data.pendingChat) + 1 } },
              function(err, success) { }
            );
          }
          else {
            collection.insert({
              userTo: userTo,
              userFrom: userFrom,
              pendingChat: 1,
              createdOn: new Date().setMinutes(new Date().getMinutes() + 330).valueOf()
            },
            function (err, o) {
              if (err) {
                console.warn(err.message);
              }
              else {
                console.info("Pending Chat count updated to : 1");
              }
            });
          }
        });
      }
    });
  });

  //update DP of friend
  socket.on('update dp', function (currentDateTime) {
    if(socket.handshake.session.user) {
      global.MongoClient.connect(global.url, function (err, db) {
        if(err){
          socket.emit('connection closed');
        }
        else {
          var collection = db.collection('user_info'),
            dpName = socket.handshake.session.user + "-" + getCode(socket.handshake.session.user) + "-" + currentDateTime;
          collection.findOne({"$query": {"userId": socket.handshake.session.user}}, function(err, user) {
            if(user) {
              collection.update(
                { "userId": socket.handshake.session.user },
                { $set: { "dpName": dpName} },
                function(err, success) {
                  collection.find().stream().on('data', function (user) {
                    socket.broadcast.emit('update dp of user list', user);
                  });
                }
              );
              socket.broadcast.emit('dp changed', dpName, socket.handshake.session.user);
            }
            else {
              socket.emit('user session is expired', socket.handshake.session.user);
              delete socket.handshake.session.user;
            }
          });
        }
      });
    }
  });

  //event handler for file received
  socket.on('file received', function (fileType, currentDateTime) {
    var userSent = socket.handshake.session.user,
      userReceived = socket.handshake.session.friend;
    global.MongoClient.connect(global.url, function (err, db) {
      if(err){
        socket.emit('connection closed');
      }
      else {
        if(userSent && userReceived) {
          db.collection('user_info').findOne({"$query": {"userId": userSent}}, function(err, user) {
            if(user) {
              var collection = db.collection('chat_msg');
              collection.insert({
                content: null,
                fromUser: userSent,
                toUser: userReceived,
                fileType: fileType,
                createdOn: currentDateTime
               },
               function (err, o) {
                if (err) {
                  console.warn(err.message);
                }
                else {
                  console.info("file received, entry inserted into db.");
                  socket.broadcast.emit('notify file received', userSent, userReceived, fileType, currentDateTime);
                }
              });
            }
            else {
              socket.emit('user session is expired', socket.handshake.session.user);
              delete socket.handshake.session.user;
            }
          });
        }
        else {
          socket.emit('user session is expired', socket.handshake.session.user);
          delete socket.handshake.session.user;
        }
      }
    });
  });
});
