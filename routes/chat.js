/*
 * GET user info popup.
 */
exports.chatMsg = function(req, res) {
  var user = req.session.user;
  if(user) {
    global.errorMessage = "";
    global.MongoClient.connect(global.url, function (err, db) {
      if(err){
        res.end('<p class="server-error" style="background:rgba(234,201,244,0.7);border:1px solid #8d00b7;border-radius:5px;box-shadow:2px 1px 5px #A55CBB;color:#5D4764;font-weight:bold;margin:10% auto 0;padding:20px;text-align:center;width:50%;">Server is not responding, connection failed. We regret the inconvenience.</p>');
      }
      else {
        var collection = db.collection('user_info');
        collection.findOne({"$query": {"userId": user}}, function(err, isUser) {
          if(isUser && isUser.isConnected) {
            var isNewUser = global.newUser;
            global.newUser = null;
            res.render('chat', {
              title: 'Windbag',
              loggedInUser: user,
              loggedInUserInfo: global.getCode(user),
              userEmail: req.session.userEmail,
              userNameShort: (req.session.newUser.length > 10 ? req.session.newUser.slice(0,10) + "..." : req.session.newUser),
              isNewUser: isNewUser,
              typingUser: global.userInfoTyping
            });
          }
          else if(isUser && isUser.isConnected == 0) {
            global.errorMessage = "You are logged out.";
            req.session.destroy();
            res.redirect('/');
          }
          else {
            global.errorMessage = "User has been removed by Admin.";
            req.session.destroy();
            res.redirect('/');
          }
        });
      }
    });
  }
  else {
    res.redirect('/');
  }
}
