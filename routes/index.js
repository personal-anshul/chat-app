/*
 * GET home page.
 */
 exports.index = function(req, res) {
   if(users.name) {
     res.redirect('/chat');
   }
   else {
     res.render('index', { title: 'Chat App', errorMsg: errorMessage });
   }
 }
