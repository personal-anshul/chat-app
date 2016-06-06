/*
 * GET home page.
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

 exports.logout = function(req, res) {
   req.session.reset();
   res.redirect('/');
 }
