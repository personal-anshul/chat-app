/*
 * GET user info popup.
 */

exports.chatApp = function(req, res){
  var userName = req.app.get('userInfo');
  console.log(userName.name);
  res.render('chat', { title: 'Chat App', loggedInUser: userName.name });
};
