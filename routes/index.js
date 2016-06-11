/*
 * GET login page.
 */
 exports.index = function(req, res) {
   var user = req.session.user;
   if(user) {
     global.MongoClient.connect(global.url, function (err, db) {
       if(err){
         console.warn(err.message);
       }
       else {
         var collection = db.collection('user_info');
         collection.findOne({"$query": {"userId": user}}, function(err, isUser) {
           if(isUser) {
             res.redirect('/chat');
           }
           else {
             global.errorMessage = "User has been removed by Admin.";
             req.session.destroy();
             res.render('index', { title: 'Windbag', errorMsg: global.errorMessage });
           }
         });
       }
     });
   }
   else {
     res.render('index', { title: 'Windbag', errorMsg: global.errorMessage });
   }
 }

 /*
  * GET logout feature.
  */
 exports.logout = function(req, res) {
   req.session.destroy();
   res.redirect('/');
 }
