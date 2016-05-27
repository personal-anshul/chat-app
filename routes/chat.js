/*
 * GET user info popup.
 */
exports.chatMsg = function(req, res) {
  console.log("user - " + users.name);
  if(users.name) {
    errorMessage = "";
    res.render('chat', { title: 'Chat App', loggedInUser: users.name });
  }
  else {
    res.redirect('/');
  }
}
