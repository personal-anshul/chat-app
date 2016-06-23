/*
 * GET user info popup.
 */
exports.chatMsg = function(req, res) {
  //encryption
  function getCode(stringData) {
    var series = "1325849170636298",
      alphabets = "qwertyuiopasdfghjklzxcvbnm_1234567890!@#%^&*",
      code = "", temp;
    for(i = 0; i < stringData.length; i++) {
      temp = alphabets[parseInt(alphabets.indexOf(stringData[i])) + parseInt(series[i])];
      code = code + (temp == undefined ? "$" + stringData[i] : temp);
    }
    return code;
  }

  var user = req.session.user;
  if(user) {
    global.errorMessage = "";
    global.MongoClient.connect(global.url, function (err, db) {
      if(err){
        console.warn(err.message);
      }
      else {
        var collection = db.collection('user_info');
        collection.findOne({"$query": {"userId": user}}, function(err, isUser) {
          if(isUser) {
            var isNewUser = global.newUser;
            global.newUser = null;
            res.render('chat', {
              title: 'Windbag',
              loggedInUser: user,
              loggedInUserShort: (user.length > 10 ? user.slice(0,10) + "..." : user),
              loggedInUserInfo: getCode(user),
              userName: req.session.newUser,
              userNameShort: (req.session.newUser.length > 10 ? req.session.newUser.slice(0,10) + "..." : req.session.newUser),
              isNewUser: isNewUser,
              typingUser: global.userInfoTyping
            });
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
