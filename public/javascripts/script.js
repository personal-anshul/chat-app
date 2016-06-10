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
    userId: null
  };
  msg.content = $('#input-message').val();
  msg.userId = $('#loggedIn-user').html();
  if(msg.content !== "") {
    socket.emit('event of chat on client', msg);
    $('#messages').append($('<p class="col-xs-12">').html("<div class='pull-right para-message'><b>" + msg.userId + ": </b>" +  msg.content + "</div>"));
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

//socket handler to load chats
socket.on('event of chat on server', function (data) {
  if($('#loggedIn-user').html() == data.userId) {
    $('#messages').append($('<p class="col-xs-12">').html("<div class='pull-right para-message'><b>" + data.userId + ": </b>" + data.content + "</div>"));
  }
  else {
    $('#messages').append($('<p class="col-xs-12">').html("<div class='pull-left para-message'><b>" + data.userId + ": </b>" + data.content + "</div>"));
  }
  window.scrollTo(0, document.body.scrollHeight);
});

//socket handler to hide spinner
socket.on('hide spinner', function (data) {
  setTimeout(function () {
    $('.spinner').hide();
  }, 1000);
});

//socket handler to hide spinner
socket.on('hide load chat', function (data) {
  $('.load-chat').addClass('hide');
});

//socket handler to update typing userinfo
socket.on('update typing userinfo', function (user) {
  $('#typing-user').html(user + ' is typing..');
  setTimeout(function () {
    $('#typing-user').html('');
  }, 1000);
});

// socket.on('no user', function (event) {
//   if(window.location.href.indexOf('chat') != -1) {
//     window.location.href = window.location.href.split('chat')[0];
//   }
// });
