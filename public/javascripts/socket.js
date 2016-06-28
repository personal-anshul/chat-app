//Make list empty before reload user list
socket.on('remove users from list', function() {
  $('#nav-user-list').html('');
});

//socket handler to load all users
socket.on('load all users', function (data, pendingChat) {
  var defaultImg = "onerror='this.src=\"/images/no-user.png\"'";
  if(data.userId != readCode($('#loggedIn-user').attr('data-info'))) {
    var statusBar = data.isConnected == 1 ? "<span class='user-status user-online'>Online</span>" : "<span class='user-status user-offline'>Offline</span>";
    $('#nav-user-list').append('<li class="user-list-item" data-info="' + getCode(data.userId) + '" data-value="'+ data._id +'"><img class="user-display-pic" src="/dp/' + data.dpName + '" alt="user"' + defaultImg + '/>' + data.userId + ' (' + data.email + ') - ' + statusBar + '<span class="chat-pending">' + pendingChat + '</span></li>');
    pendingChat == 0 ? null : $("li[data-info='" + getCode(data.userId) + "']" + " span.chat-pending").css({ "display": "inline-block"});
  }
  if(pendingChat) {
    $('#pending-chat-count').html(parseInt($('#pending-chat-count').html()) + pendingChat);
    if($('#pending-chat-count').html() == "0") {
      $('#pending-chat-count').css({ "display": "none"});
    }
    else {
      $('#pending-chat-count').css({ "display": "inline-block"});
    }
  }
});

//socket handler to if no user to load
socket.on('no user to load', function () {
  $('#nav-user-list').append('<li class="user-list-item text-center no-users-to-load"> Ahh!! Looks like there is no User to chat.. </li>');
});

//socket handler to load user details with whom loggined user wanted to chat
socket.on('load user details for chat', function (userDetail, currentUser) {
  if(readCode($('#loggedIn-user').attr('data-info')) == currentUser) {
    $('.display-picture').css({"display": "inline-block"});
    $('#chat-with-user-info').html(userDetail);
    $('#chat-with-user-info').attr("data-info", getCode(userDetail.split('<br>')[0]));
  }
});

//is user typing in chat box
socket.on('is user typing?', function () {
  if($('#input-message').val() != "") {
    socket.emit('get typing userinfo');
  }
  else {
    socket.emit('remove typing userinfo');
  }
});

//socket handler if there is no chat msg between selected users
socket.on('no chat to load', function() {
  $('#messages').html('<h1 class="text-center no-chat">Oops.. There is no chat between you both yet.</h1>');
});

//socket handler to show load more chat link
socket.on('show load all chat link', function (data) {
  $('.load-chat').removeClass("hide");
  $('.load-chat').addClass("show");
  $('.loaded-chat').removeClass("show");
  $('.loaded-chat').addClass("hide");
  $('#input-message').focus();
});

//socket handler to hide load more chat link
socket.on('hide load all chat link', function (data) {
  $('.load-chat').removeClass("show");
  $('.load-chat').addClass("hide");
  $('.loaded-chat').addClass("show");
  $('.loaded-chat').removeClass("hide");
  $('#input-message').focus();
});

//socket handler to hide spinner
socket.on('hide spinner', function (data) {
  setTimeout(function () {
    $('.spinner').hide();
  }, 500);
});

//socket handler to update typing userinfo
socket.on('update typing userinfo', function (userTyping, typingFor) {
  if(userTyping != null) {
    if(readCode($('#loggedIn-user').attr('data-info')) == typingFor && readCode($('#chat-with-user-info').attr("data-info")) == userTyping) {
      $('#typing-user').html("<span class='user-typing'>" + userTyping + ' is typing...</span>');
    }
    else {
      $('#typing-user').html('');
    }
  }
  else {
    if(readCode($('#loggedIn-user').attr('data-info')) == typingFor) {
      $('#typing-user').html('');
    }
  }
});

//socket handler to update list of all users to show online/offline status
socket.on('update all users', function (data, pendingChat) {
  if(data.userId != readCode($('#loggedIn-user').attr('data-info'))) {
    var statusBar = "";
      element = $("li[data-info='" + getCode(data.userId) + "']" + " span.user-status");
    if(element.length == 1) {
      if(data.isConnected == 1) {
        statusBar = "Online";
        element.removeClass('user-offline').addClass('user-online');
      }
      else {
        statusBar = "Offline";
        element.removeClass('user-online').addClass('user-offline');
      }
      element.html(statusBar);
    }
    else {
      var defaultImg = "onerror='this.src=\"/images/no-user.png\"'",
        statusBar = data.isConnected == 1 ? "<span class='user-status user-online'>Online</span>" : "<span class='user-status user-offline'>Offline</span>",
        pendingChat = 0;
      $('#nav-user-list').append('<li class="user-list-item" data-info="' + getCode(data.userId) + '" data-value="'+ data._id +'"><img class="user-display-pic" src="/dp/' + data.dpName + '" alt="user"' + defaultImg + '/>' + data.userId + ' (' + data.email + ') - ' + statusBar + '<span class="chat-pending">' + pendingChat + '</span></li>');
    }
  }
  if(data.userId == readCode($('#chat-with-user-info').attr("data-info"))) {
    var lastSeen = new Date(data.lastConnected).toJSON().split('T');
    if(data.isConnected == 1) {
      $('.user-last-seen').html('Online');
    }
    else {
      $('.user-last-seen').html("last seen at " + (lastSeen[0] == new Date(new Date().setMinutes(new Date().getMinutes() + 330)).toJSON().split('T')[0] ? "today" : lastSeen[0]) + " " + lastSeen[1].slice(0,5));
    }
  }
});

//socket handler to load chats
socket.on('event of chat on server', function (data) {
  //notification related code
  if(readCode($('#loggedIn-user').attr('data-info')) == data.toUser.trim() && readCode($('#chat-with-user-info').attr("data-info")) != data.fromUser.trim()) {
    if(data.content != null) {
      $('#file-received-notification .span-user').html(data.fromUser);
      $('#file-received-notification .span-msg').html(data.content);
      $('#pending-chat-count').html(parseInt($('#pending-chat-count').html()) + 1);
      $('#pending-chat-count').css({ "display": "inline-block"});
      document.getElementById('audio-notification').play();
      $.titleAlert(data.fromUser + " is saying...", {
        stopOnFocus: true,
        interval: 800
      });
      var element = $("li[data-info='" + getCode(data.fromUser.trim()) + "']" + " span.chat-pending");
      element.html(parseInt(element.html()) + 1);
      element.css({ "display": "inline-block"});
      $('#file-received-notification').removeClass('file-animation').addClass('show-file-notification');
      setTimeout(function () {
        $('#file-received-notification').addClass('file-animation');
      }, 600);
    }
  }
  //chat display if chat is meant for logged-in user
  if((readCode($('#loggedIn-user').attr('data-info')) == data.toUser.trim() && readCode($('#chat-with-user-info').attr("data-info")) == data.fromUser.trim())
    || (readCode($('#chat-with-user-info').attr("data-info")) == data.toUser.trim() && readCode($('#loggedIn-user').attr('data-info')) == data.fromUser.trim())) {
    if(checkPageStatus()) {
      var chatTime = new Date(data.createdOn).toJSON().split('T');
      if(readCode($('#loggedIn-user').attr('data-info')) == data.fromUser.trim()) {
        if(data.content == null) {
          $('#messages').append($('<p class="col-xs-12">').html("<div class='col-xs-12 file-shared-notification'>You have shared a file with " + data.toUser + ". Click <a class='link-download' target='_blank' href='/download?id=" + data.fromUser + "&name=" + data.toUser + "&span=" + data.createdOn + "&type=" + data.fileType + "'>here</a> to see. <small class='msg-time'>" + chatTime[0] + "," + chatTime[1].split('.')[0] + "</small></div>"));
        }
        else {
          var spanClass = (data.fileType == "smiley") ? 'vector-' + data.content : 'selectable';
          $('#messages').append($('<p class="col-xs-12">').html("<div class='pull-right para-message'><b>" + data.fromUser + ": </b><span class='" + spanClass + "'>" + (data.fileType == "smiley" ? "": data.content) + "</span><small class='msg-time'>" + chatTime[0] + "," + chatTime[1].split('.')[0] + "</small></div>"));
        }
      }
      else {
        if(data.content == null) {
          $('#messages').append($('<p class="col-xs-12">').html("<div class='col-xs-12 file-shared-notification'>" + data.fromUser + " has shared a file with you. Click <a class='link-download' target='_blank' href='/download?id=" + data.fromUser + "&name=" + data.toUser + "&span=" + data.createdOn + "&type=" + data.fileType + "'>here</a> to see. <small class='msg-time'>" + chatTime[0] + "," + chatTime[1].split('.')[0] + "</small></div>"));
        }
        else {
          var spanClass = (data.fileType == "smiley") ? 'vector-' + data.content : 'selectable';
          $('#messages').append($('<p class="col-xs-12">').html("<div class='pull-left para-message'><b>" +  data.fromUser + ": </b><span class='" + spanClass + "'>" + (data.fileType == "smiley" ? "": data.content) + "</span><small class='msg-time'>" + chatTime[0] + "," + chatTime[1].split('.')[0] + "</small></div>"));
        }
      }
    }
  }
  window.scrollTo(0, document.body.scrollHeight);
});

//socket handler to display file received
socket.on("notify file received", function(userSent, userReceived, fileType, currentDateTime) {
  socket.emit('pending-chat', userReceived, userSent);
  var chatTime = new Date(new Date().setMinutes(new Date().getMinutes() + 330)).toJSON().split('T');
  if(readCode($('#loggedIn-user').attr('data-info')) == userReceived && readCode($('#chat-with-user-info').attr("data-info")) != userSent) {
    $('#file-received-notification .span-user').html(userSent);
    $('#file-received-notification .span-msg').html('shared a file with you.');
    document.getElementById('audio-notification').play();
    $.titleAlert(userSent + " is saying...", {
      stopOnFocus: true,
      interval: 800
    });
    $('#pending-chat-count').html(parseInt($('#pending-chat-count').html()) + 1);
    $('#pending-chat-count').css({ "display": "inline-block"});
    var element = $("li[data-info='" + getCode(userSent) + "']" + " span.chat-pending");
    element.html(parseInt(element.html()) + 1);
    element.css({ "display": "inline-block"});
    $('#file-received-notification').removeClass('file-animation').addClass('show-file-notification');
    setTimeout(function () {
      $('#file-received-notification').addClass('file-animation');
    }, 600);
  }
  if(checkPageStatus()) {
    if(readCode($('#loggedIn-user').attr('data-info')) == userSent && readCode($('#chat-with-user-info').attr("data-info")) == userReceived) {
      $('#messages').append($('<p class="col-xs-12">').html("<div class='col-xs-12 file-shared-notification'>You have shared a file with " + userReceived + ". Click <a class='link-download' target='_blank' href='/download?id=" + userSent + "&name=" + userReceived + "&span=" + currentDateTime + "&type=" + fileType + "'>here</a> to see. <small class='msg-time'>" + chatTime[0] + "," + chatTime[1].split('.')[0] + "</small></div>"));
    }
    else if(readCode($('#loggedIn-user').attr('data-info')) == userReceived && readCode($('#chat-with-user-info').attr("data-info")) == userSent) {
      $('#messages').append($('<p class="col-xs-12">').html("<div class='col-xs-12 file-shared-notification'>" + userSent + " has shared a file with you. Click <a class='link-download' target='_blank' href='/download?id=" + userSent + "&name=" + userReceived + "&span=" + currentDateTime + "&type=" + fileType + "'>here</a> to see. <small class='msg-time'>" + chatTime[0] + "," + chatTime[1].split('.')[0] + "</small></div>"));
    }
  }
  window.scrollTo(0, document.body.scrollHeight);
});

//update notification count if new chat comes
socket.on('update notification count', function (userTo, userFrom) {
  if(readCode($('#loggedIn-user').attr('data-info')) == userTo) {
    var element = $("li[data-info='" + getCode(userFrom) + "']" + " span.chat-pending");
    $('#pending-chat-count').html(parseInt($('#pending-chat-count').html()) - parseInt(element.html()));
    if($('#pending-chat-count').html() == "0") {
      $('#pending-chat-count').css({ "display": "none"});
    }
    else {
      $('#pending-chat-count').css({ "display": "inline-block"});
    }
    element.html('0');
    element.css({ "display": "none"});
  }
});

//get current user's display image
socket.on('load display image', function (fileName) {
  $('#user-display-pic').attr("src", "/dp/" + fileName).attr('data-info', fileName);
});

//update all dps
socket.on('load dp', function (fileName, friendUserId) {
  setTimeout(function () {
    $('#friend-display-picture').attr("src", "/dp/" + fileName).attr('data-info', fileName);
  }, 200);
});

//update all dps
socket.on('dp changed', function (fileName, friendUserId) {
  if(friendUserId == readCode($('#chat-with-user-info').attr("data-info"))) {
    setTimeout(function () {
      $('#friend-display-picture').attr("src", "/dp/" + fileName).attr('data-info', fileName);
    }, 15200);
  }
});

//update dp for all users available in user list
socket.on('update dp of user list', function(data) {
  setTimeout(function () {
    var element = $('li.user-list-item[data-info="' + getCode(data.userId) + '"] img.user-display-pic');
    element.attr("src", '/dp/' + data.dpName);
  }, 15000);
});

//handle issue : server connection fail
socket.on('connection closed', function() {
  // document.write('<p class="server-error">Server is not responding, connection failed. We regret the inconvenience.</p>');
});

//handler if user session has been expired
socket.on('user session is expired', function (data) {
  if(readCode($('#loggedIn-user').attr('data-info')) == data) {
    // window.location.href = '/';
  }
});
