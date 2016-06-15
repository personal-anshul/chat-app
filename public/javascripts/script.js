//dependencies
var socket = io();

//scroll page till bottom
$(document).ready(function(){
  window.scrollTo(0, document.body.scrollHeight);
});

//show/hode login/signup sections as radio button selected
$('.radio-user').on("change", function () {
  $('.error-msg').html('');
  if($('.radio-new-user').is(":checked")) {
    document.getElementById("form-new-user").reset();
    $('#form-new-user').show();
    $('#form-existing-user').hide();
    setTimeout(function() {
      $('#user-name').focus();
    }, 200);
  }
  else if($('.radio-existing-user').is(":checked")) {
    document.getElementById("form-existing-user").reset();
    $('#form-existing-user').show();
    $('#form-new-user').hide();
    setTimeout(function() {
      $('#user-id').focus();
    }, 200);
  }
});

//close user id popup
$('.closePopup').on("click", function () {
  $('#userId-popup').addClass('modal-userId-close');
  $('.modal-backdrop').addClass('close-modal-backdrop');
  $('#input-message').focus();
  setTimeout(function() {
    $('.modal-backdrop').hide();
    $('#loggedIn-user').css({"border": "2px solid #3498DB", "padding": "0 10px", "transition": "all 0.8s linear" });
  }, 1500);
  setTimeout(function() {
    $('#loggedIn-user').css({"border": "2px solid #222", "padding": "0", "transition": "all 1s linear"});
  }, 3000);
});

//Select user to start chat
$('#nav-user-list').delegate('li', 'click', function(elm) {
  var userInfo = $(this).attr('data-value').trim();
  if($('.chat-with-user').html().split('<br>')[0] != $(this).html().split('(')[0].trim()) {
    $('#messages').html('');
    $('#input-message').val('');
    $('#btn-send-message, #input-message').removeAttr('disabled');
    $('.spinner').show();
    $('#user-list').removeClass('in');
    socket.emit('load related chat', userInfo);
  }
  else {
    $('#user-list').removeClass('in');
  }
});

//On chat submit
$('#btn-send-message').on("click", function () {
  var msg  = {
    content: null,
    toUserId: null,
    fromUserId: null
  };
  msg.content = $('#input-message').val();
  msg.fromUserId = $('#loggedIn-user').html();
  msg.toUserId = $('.chat-with-user').html().split('<br>')[0];
  if(msg.content !== "") {
    socket.emit('event of chat on client', msg);
    socket.emit('remove typing userinfo');
    if($('#messages').html().indexOf('Oops.. There is no chat between you both yet.') != -1) {
      $('#messages').html('');
    }
    if($('#messages').html().indexOf('Select user from top right hamgurber menu to start chat with them.') == -1) {
      $('#messages').append($('<p class="col-xs-12">').html("<div class='pull-right para-message'><b>" + msg.fromUserId + ": </b>" +  msg.content + "</div>"));
      $('#input-message').val('');
    }
  }
  window.scrollTo(0, document.body.scrollHeight);
  return false;
});

//bind enter key event with input msg field
$('#input-message').on("keypress", function(event) {
  if(event.keyCode === 13) {
    $('#btn-send-message').click();
  }
  else {
    socket.emit('get typing userinfo');
  }
});

//remove typing label once users focusout from textbox
$('#input-message').on("focusout", function(event) {
  if($('#input-message').val() == "") {
    socket.emit('remove typing userinfo');
  }
});

//Load all chat msgs
$('.load-chat a').on("click", function () {
  $('.spinner').show();
  $('#messages').html('');
  $('.loaded-chat').addClass('show');
  $('.load-chat').removeClass('show');
  $('.load-chat').addClass('hide');
  socket.emit('event of load more chats');
});

//Make list empty before reload user list
socket.on('remove users from list', function() {
  $('#nav-user-list').html('');
});

//socket handler to load all users
socket.on('load all users', function (user) {
  if(user.userId != $('#loggedIn-user').html()) {
    if(user.isConnected == 1) {
      $('#nav-user-list').append('<li class="user-list-item" data-value="'+ user._id +'">' + user.userId + ' (' + user.email + ') - <span class="user-online">Online</span></li>');
    }
    else {
      $('#nav-user-list').append('<li class="user-list-item" data-value="'+ user._id +'">' + user.userId + ' (' + user.email + ') - <span class="user-offline">Offline</span></li>');
    }
  }
});

//socket handler to if no user to load
socket.on('no user to load', function () {
  $('#nav-user-list').append('<li class="user-list-item text-center" data-value=""> Ahh!! Looks like there is no User to chat.. </li>');
});

//socket handler to load user details with whom loggined user wanted to chat
socket.on('load user details for chat', function (userDetail, currentUser) {
  if($('#loggedIn-user').html() == currentUser) {
    $('.display-picture').css({"display": "inline-block"});
    $('.chat-with-user').html(userDetail);
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
});

//socket handler to hide load more chat link
socket.on('hide load all chat link', function (data) {
  $('.load-chat').removeClass("show");
  $('.load-chat').addClass("hide");
  $('.loaded-chat').removeClass("show");
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
    if($('#loggedIn-user').html() == typingFor && $('.chat-with-user').html().split('<br>')[0] == userTyping) {
      $('#typing-user').html("<span class='user-typing'>" + userTyping + ' is typing...</span>');
    }
    else {
      $('#typing-user').html('');
    }
  }
  else {
    if($('#loggedIn-user').html() == typingFor) {
      $('#typing-user').html('');
    }
  }
});

//socket handler to update list of all users to show online/offline status
socket.on('update all users', function (user) {
  if(user.userId != $('#loggedIn-user').html()) {
    if(user.isConnected == 1) {
      $('#nav-user-list').append('<li class="user-list-item" data-value="'+ user._id +'">' + user.userId + ' (' + user.email + ') - <span class="user-online">Online</span></li>');
    }
    else {
      $('#nav-user-list').append('<li class="user-list-item" data-value="'+ user._id +'">' + user.userId + ' (' + user.email + ') - <span class="user-offline">Offline</span></li>');
    }
  }
  if(user.userId == $('.chat-with-user').html().split('<br>')[0]) {
    var lastSeen = new Date(user.lastConnected).toJSON().split('T');
    if(user.isConnected == 1) {
      $('.user-last-seen').html('Online');
    }
    else {
      $('.user-last-seen').html("last seen at " + (lastSeen[0] == new Date().toJSON().split('T')[0] ? "today" : lastSeen[0]) + " " + lastSeen[1].slice(0,5));
    }
  }
});

//socket handler to load chats
socket.on('event of chat on server', function (data) {
  if(($('#loggedIn-user').html() == data.toUserId.trim() || $('#loggedIn-user').html() == data.fromUserId.trim())
    && ($('.chat-with-user').html().split('<br>')[0] == data.toUserId.trim() || $('.chat-with-user').html().split('<br>')[0] == data.fromUserId.trim())) {
    if($('#messages').html().indexOf('Oops.. There is no chat between you both yet.') != -1) {
      $('#messages').html('');
    }
    if($('#messages').html().indexOf('Select user from top right hamgurber menu to start chat with them.') == -1) {
      if($('#loggedIn-user').html() == data.fromUserId.trim()) {
        $('#messages').append($('<p class="col-xs-12">').html("<div class='pull-right para-message'><b>" + data.fromUserId + ": </b>" + data.content + "</div>"));
      }
      else {
        $('#messages').append($('<p class="col-xs-12">').html("<div class='pull-left para-message'><b>" + data.fromUserId + ": </b>" + data.content + "</div>"));
      }
    }
  }
  console.log('in')
  window.scrollTo(0, document.body.scrollHeight);
});
