/*
 * GET user info popup.
 */
exports.chatMsg = function(req, res) {
  var user = req.session.user;
  if(user) {
    console.log("user - " + user);
    errorMessage = "";
    res.render('chat', { title: 'Chat App', loggedInUser: user });
  }
  else {
    res.redirect('/');
  }
}
