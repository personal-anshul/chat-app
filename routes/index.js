/*
 * GET login page.
 */
 exports.index = function(req, res) {
   var user = req.session.user;
   if(user) {
     res.redirect('/chat');
   }
   else {
     res.render('index', { title: 'Chat App', errorMsg: errorMessage });
   }
 }

 /*
  * GET logout feature.
  */
 exports.logout = function(req, res) {
   req.session.reset();
   res.redirect('/');
 }
