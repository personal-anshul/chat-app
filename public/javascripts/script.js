//dependencies
var socket = io();

//scroll page till bottom
$(document).ready(function(){
  window.scrollTo(0, document.body.scrollHeight);
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
  msg.toUserId = $('.chat-with-user').html();
  if(msg.content !== "") {
    socket.emit('event of chat on client', msg);
    socket.emit('remove typing userinfo');
    $('#messages').append($('<p class="col-xs-12">').html("<div class='pull-right para-message'><b>" + msg.fromUserId + ": </b>" +  msg.content + "</div>"));
    $('#input-message').val('');
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
})

//Load all chat msgs
$('.load-chat').on("click", function () {
  $('.spinner').show();
  $('#messages').html('');
  $('.loaded-chat').addClass('show');
  $('.load-chat').addClass('hide');
  socket.emit('event of load more chats');
});

$('#nav-user-list').delegate('li', 'click', function(elm) {
  $('#messages').html('');
  $('.spinner').show();
  var userInfo = $(this).html().split('(')[0];
  $('#user-list').removeClass('in');
  $('.chat-with-user').html(userInfo);
  socket.emit('load related chat', userInfo.trim());
});

//socket handler to load chats
socket.on('event of chat on server', function (data) {
  if($('#loggedIn-user').html() == data.toUserId.trim() || $('#loggedIn-user').html() == data.fromUserId.trim()) {
    if($('#loggedIn-user').html() == data.fromUserId.trim()) {
      $('#messages').append($('<p class="col-xs-12">').html("<div class='pull-right para-message'><b>" + data.fromUserId + ": </b>" + data.content + "</div>"));
    }
    else {
      $('#messages').append($('<p class="col-xs-12">').html("<div class='pull-left para-message'><b>" + data.fromUserId + ": </b>" + data.content + "</div>"));
    }
  }
  window.scrollTo(0, document.body.scrollHeight);
});

//socket handler if there is no chat msg between selected users
socket.on('no chat to load', function() {
  $('#messages').html('<h1 class="text-center no-chat">No chat to load</h1>');
});

socket.on('remove users from list', function() {
  $('#nav-user-list').html('');
  console.log('in')
});

//socket handler to load all users
socket.on('load all users', function (user) {
  if(user.userId != $('#loggedIn-user').html()) {
    if(user.isConnected == 1) {
      $('#nav-user-list').append('<li class="user-list-item">' + user.userId + ' (' + user.email + ') - <span class="user-online">Online</span></li>');
    }
    else {
      $('#nav-user-list').append('<li class="user-list-item">' + user.userId + ' (' + user.email + ') - <span class="user-offline">Offline</span></li>');
    }
  }
});

//socket handler to update list of all users
socket.on('update all users', function (user) {
  if(user.userId != $('#loggedIn-user').html()) {
    if(user.isConnected == 1) {
      $('#nav-user-list').append('<li class="user-list-item">' + user.userId + ' (' + user.email + ') - <span class="user-online">Online</span></li>');
    }
    else {
      $('#nav-user-list').append('<li class="user-list-item">' + user.userId + ' (' + user.email + ') - <span class="user-offline">Offline</span></li>');
    }
  }
});

//socket handler to hide spinner
socket.on('hide spinner', function (data) {
  setTimeout(function () {
    $('.spinner').hide();
  }, 1000);
});

//socket handler to hide spinner
socket.on('show load chat', function (data) {
  $('.load-chat').show();
});

//socket handler to update typing userinfo
socket.on('update typing userinfo', function (userTyping, typingFor) {
  if(userTyping != null) {
    if($('#loggedIn-user').html() == typingFor && $('.chat-with-user').html().trim() == userTyping) {
      $('#typing-user').html(userTyping + ' is typing..');
    }
  }
  else {
    if($('#loggedIn-user').html() == typingFor) {
      $('#typing-user').html('');
    }
  }
});
