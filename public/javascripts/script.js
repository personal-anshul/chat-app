//dependencies
var socket = io(),
  userDetail = {
    user_id: null,
    name: null
  };

//On chat submit
$('#btn-send-message').on("click", function () {
  window.scrollTo(0, document.body.scrollHeight);
  var msg  = {
    content: null,
    user_id: null
  };
  userDetail.user_id = $('#loggedInUserID').html();
  console.log("user_id from chat page- " + userDetail.user_id);
  msg.content = $('#input-message').val();
  msg.user_id = userDetail.user_id;
  if(msg.content != "") {
    socket.emit('chat', msg);
    $('#messages').append($('<p class="para-message">').html("<b>" + msg.user_id + ": </b>" +  msg.content));
    $('#input-message').val('');
  }
  return false;
});

//load chats
socket.on('chat', function (data) {
  $('#messages').prepend($('<p class="para-message">').html("<b>" + data.user_id + ": </b>" + data.content));
});

//bind chat submit if user press enter key
$('#input-message').on("keypress", function(event) {
  if(event.keyCode === 13) {
    $('#btn-send-message').click();
  }
});

//toggle login and registration section
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
