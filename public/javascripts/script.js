//dependencies
var socket = io();
$(document).ready(function(){
  window.scrollTo(0, document.body.scrollHeight);
});

//On chat submit
$('#btn-send-message').on("click", function () {
  window.scrollTo(0, document.body.scrollHeight);
  var msg  = {
    content: null,
    user_id: null
  };
  msg.content = $('#input-message').val();
  msg.user_id = $('#loggedIn-user').html();
  if(msg.content !== "") {
    socket.emit('chat', msg);
    $('#messages').append($('<p class="col-xs-12">').html("<div class='col-xs-push-2 col-xs-10 para-message'><b>" + msg.user_id + ": </b>" +  msg.content + "</div>"));
    $('#input-message').val('');
  }
  return false;
});

//bind chat submit if user press enter key
$('#input-message').on("keypress", function(event) {
  if(event.keyCode === 13) {
    $('#btn-send-message').click();
  }
});

$('.radio-user').on("change", function () {
  if($('.radio-new-user').is(":checked")) {
    $('#form-new-user').show();
    $('#form-existing-user').hide();
  }
  else if($('.radio-existing-user').is(":checked")) {
    $('#form-existing-user').show();
    $('#form-new-user').hide();
  }
});

//load chats
socket.on('chat', function (data) {
  if($('#loggedIn-user').html() == data.user_id) {
    $('#messages').append($('<p class="col-xs-12">').html("<div class='col-xs-push-2 col-xs-10 para-message'><b>" + data.user_id + ": </b>" + data.content + "</div>"));
  }
  else {
    $('#messages').append($('<p class="col-xs-12">').html("<div class='col-xs-10 para-message'><b>" + data.user_id + ": </b>" + data.content + "</div>"));
  }
  window.scrollTo(0, document.body.scrollHeight);
});
