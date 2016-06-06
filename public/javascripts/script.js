//dependencies
var socket = io(),
  user_id = null;
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
  user_id = $('#loggedIn-user').html();
  msg.user_id = user_id;
  if(msg.content !== "") {
    socket.emit('chat', msg);
    $('#messages').append($('<p class="para-message">').html("<b>" + msg.user_id + ": </b>" +  msg.content));
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
  user_id = data.user_id;
  $('#messages').append($('<p class="para-message">').html("<b>" + user_id + ": </b>" + data.content));
});
