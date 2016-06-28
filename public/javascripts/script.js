//dependencies
var socket = io();

//scroll page till bottom
$(document).ready(function() {
  window.scrollTo(0, document.body.scrollHeight);
});

//encryption
function getCode(stringData) {
  var series = "1325849170636298",
    alphabets = "qwertyuiopasdfghjklzxcvbnm_1234567890!@#%^&*",
    code = "", temp;
  for(i = 0; i < stringData.length; i++) {
    temp = alphabets[parseInt(alphabets.indexOf(stringData[i])) + parseInt(series[i])];
    code = code + (temp == undefined ? "$" + stringData[i] : temp);
  }
  return code;
}

//decryption
function readCode(stringData) {
  var series = "1325849170636298",
    alphabets = "qwertyuiopasdfghjklzxcvbnm_1234567890!@#%^&*",
    code = "", temp;
  for(i = 0, j = 0; i < stringData.length; i++, j++) {
    if(stringData[i] == "$") {
      temp = stringData[++i];
    }
    else {
      temp = alphabets[parseInt(alphabets.indexOf(stringData[i])) - parseInt(series[j])];
    }
    code = code + temp;
  }
  return code;
}

//get query string from url
function getParameterByName(name, url) {
  if (!url) {
    url = window.location.href;
  }
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

//check if userID is specified to load chat
function checkUserIdForChat() {
  var id = getParameterByName('id');
  if(id) {
    $('.spinner').show();
    $('#messages').html('');
    setTimeout(function () {
      var user = $('li[data-info="' + getCode(id) + '"]').attr('data-value');
      $('li[data-info="' + getCode(id) + '"]').addClass('active');
      $('#input-message').val('');
      $('#btn-send-message, #btn-attachment, #input-message').removeAttr('disabled');
      socket.emit('load related chat', user);
      $('.spinner').hide();
    }, 5000)
  }
}

//check if user is in proper window to get chat msg and chat have already been initiated
function checkPageStatus() {
  if($('#messages').html().indexOf('Oops.. There is no chat between you both yet.') != -1) {
    $('#messages').html('');
  }
  if($('#messages').html().indexOf('Select user from top right hamgurber menu to start chat with them.') == -1) {
    return true;
  }
  else {
    return false;
  }
}

//change post request to add user detail
function addUserInURL(e) {
  if(document.getElementById('textbox-attach-file').value) {
    var fileType = document.getElementById('textbox-attach-file').value.split('.'),
      currentDateTime = new Date(new Date().setMinutes(new Date().getMinutes() + 330)).valueOf();
    if(fileType.length == 2) {
      document.getElementById("uploadForm").method = "post";
      document.getElementById("uploadForm").action = "/api/photo?id=" + readCode($('#chat-with-user-info').attr("data-info")) + "&span=" + currentDateTime;
      socket.emit('file received', fileType[1], currentDateTime);
      setTimeout(function() {
        $('#submit-form').click();
      }, 100);
      return true;
    }
    else {
      $('#invalid-upload').html("<p>Provide a valid file name. File name should not have period(.) in it and should have proper file extension, it's mandatory. (Ex: my-file.txt)</p>");
      return false;
    }
  }
  else {
    return false;
  }
}

//update dp
function uploadDisplayImage() {
  if(document.getElementById('input-attach-dp').value) {
    var fileType = document.getElementById('input-attach-dp').value.split('.'),
      currentDateTime = new Date(new Date().setMinutes(new Date().getMinutes() + 330)).valueOf();
    if(fileType.length == 2) {
      document.getElementById("uploadDp").action = "/api/dp?span=" + currentDateTime + "&id=" + readCode($('#chat-with-user-info').attr('data-info'));
      socket.emit('update dp', currentDateTime);
      setTimeout(function() {
        $('#submit-dp-form').click();
      }, 100);
      return true;
    }
    else {
      $('#invalid-dp').html("<p>Provide a valid file name. File name should not have period(.) in it and should have proper file extension, it's mandatory. (Ex: my_dp.png)</p>");
      return false;
    }
  }
  else {
    return false;
  }
}

//Suppress browser's default right click menu
$('html').on('contextmenu', function(){
  return false;
});

//hide/close user list when ESC is pressed
$(window).on('keyup', function (event) {
  if(event.keyCode == 27) {
    if(document.getElementById('user-list').className.indexOf('in') != -1) {
      $('#btn-toggle-user-list').click();
    }
    if($('#input-message').val() !== "") {
      $('#input-message').val('');
    }
  }
});

//load custom scroll bar when user list is opened
$('#btn-toggle-user-list').on('click', function () {
  setTimeout(function () {
    $("#scrollbar-panel").tinyscrollbar();
  }, 500);
})

//show/hode login/signup sections as radio button selected
$('.radio-user').on("change", function () {
  $('.error-msg').html('');
  $('#login-panel').removeClass('login-panel').addClass('login');
  if($('.radio-new-user').is(":checked")) {
    document.getElementById("form-new-user").reset();
    $('#form-new-user').show();
    $('#form-existing-user').hide();
    $('.modal-title').html('Sign Up <small>( Please provide your details )</small>');
    $('#login-panel').removeClass('login').addClass('login-panel');
    setTimeout(function() {
      $('#user-name').focus();
    }, 200);
  }
  else if($('.radio-existing-user').is(":checked")) {
    document.getElementById("form-existing-user").reset();
    $('#form-new-user').hide();
    $('#form-existing-user').show();
    $('.modal-title').html('Login <small>( Please provide your identity )</small>');
    $('#login-panel').removeClass('login').addClass('login-panel');
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
    // $('#loggedIn-user').css({"border": "2px solid #3498DB", "padding": "0 10px", "transition": "all 0.8s linear" });
  }, 1500);
  setTimeout(function() {
    // $('#loggedIn-user').css({"border": "2px solid #222", "padding": "0", "transition": "all 1s linear"});
  }, 3000);
});

//Select user to start chat
$('#nav-user-list').delegate('li', 'click', function(elm) {
  var userInfo = $(this).attr('data-value').trim();
  if(readCode($('#chat-with-user-info').attr("data-info")) != readCode($(this).attr("data-info"))) {
    $('li').removeClass('active');
    $('#messages').html('');
    $('#input-message').val('');
    $('#btn-send-message, #btn-attachment, #input-message').removeAttr('disabled');
    $('.spinner').show();
    $('#user-list').removeClass('in');
    $(this).addClass('active');
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
    toUser: null,
    fromUser: null,
    createdOn: null
  };
  msg.content = $('#input-message').val().trim().slice(0, 150);
  msg.fromUser = readCode($('#loggedIn-user').attr('data-info'));
  msg.toUser = readCode($('#chat-with-user-info').attr("data-info"));
  msg.createdOn = new Date().setMinutes(new Date().getMinutes() + 330).valueOf();
  socket.emit('pending-chat', msg.toUser, msg.fromUser);
  if(msg.content !== "") {
    socket.emit('event of chat on client', msg);
    socket.emit('remove typing userinfo');
    if(checkPageStatus()) {
      var chatTime = new Date(new Date().setMinutes(new Date().getMinutes() + 330)).toJSON().split('T');
      $('#messages').append($('<p class="col-xs-12">').html("<div class='pull-right para-message'><b>" + msg.fromUser + ": </b><span class='selectable'>" +  msg.content + "</span><small class='msg-time'>" + chatTime[0] + "," + chatTime[1].split('.')[0] + "</small></div>"));
      $('#input-message').val('');
    }
  }
  window.scrollTo(0, document.body.scrollHeight);
  return false;
});

//bind enter key event with input msg field
$('#input-message').on("keypress", function(event) {
  if(event.keyCode === 13) {
    if(!event.shiftKey) {
      event.preventDefault();
      $('#btn-send-message').click();
    }
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

//get the current display img
$('#btn-display-picture').on("click", function(event) {
  $("#dp-preview").fadeIn("fast").attr("src", "/dp/" + $('#user-display-pic').attr('data-info'));
});

//get the friend's display img
$('#btn-friend-display-picture').on("click", function(event) {
  $("#friend-dp-preview").fadeIn("fast").attr("src", "/dp/" + $('#friend-display-picture').attr('data-info'));
});

//read the dp attached
$('#input-attach-dp').on("change", function(event) {
  var tmppath = URL.createObjectURL(event.target.files[0]);
  if(event.target.files[0].type.indexOf('image/') == 0) {
    $("#dp-preview").fadeIn("fast").attr('src', URL.createObjectURL(event.target.files[0]));
    $('#submit-upload-dp').removeAttr("disabled");
    $("#invalid-dp").html("<p>Voila!! This is how you will look. Nice dp.</p>").removeClass("error-msg");
  }
  else {
    $("#invalid-dp").html("<em>Ouch!! It's not a valid image.</em>").addClass("error-msg");
    $('#submit-upload-dp').attr("disabled", "disabled");
  }
});

//remove all details whiling closing the upload popup
$('#close-upload-dp').on("click", function () {
  setTimeout(function() {
    $("#dp-preview").fadeOut("fast").attr('src', "");
    $('#submit-upload-dp').attr("disabled", "disabled");
    $('#invalid-dp').html("");
    document.getElementById('input-attach-dp').value = "";
  }, 200);
});

//read the file attached
$('#textbox-attach-file').on("change", function(event) {
  var tmppath = URL.createObjectURL(event.target.files[0]);
  if(event.target.files[0].type.indexOf('image/') == 0) {
    $("#file-uploaded").fadeIn("fast").attr('src', URL.createObjectURL(event.target.files[0]));
  }
  else {
    $("#no-preview-msg").html("<em>Ouch!! Preview is not available.</em>");
  }
  $('#submit-upload-popup').removeAttr("disabled");
  $('#invalid-upload').html("");
});

//remove all details whiling closing the upload popup
$('#close-upload-popup').on("click", function () {
  setTimeout(function() {
    $("#file-uploaded").fadeOut("fast").attr('src', "");
    $('#submit-upload-popup').attr("disabled", "disabled");
    $('#invalid-upload').html("");
    document.getElementById('textbox-attach-file').value = "";
    $("#no-preview-msg").html("");
  }, 200);
});

//close notification bar
$("#close-notification").on("click", function () {
  $('#file-received-notification').removeClass('file-animation').removeClass('show-file-notification');
  document.title = "Windbag";
});

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
      document.title = data.fromUser + " is saying...";
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
          $('#messages').append($('<p class="col-xs-12">').html("<div class='pull-right para-message'><b>" + data.fromUser + ": </b><span class='selectable'>" + data.content + "</span><small class='msg-time'>" + chatTime[0] + "," + chatTime[1].split('.')[0] + "</small></div>"));
        }
      }
      else {
        if(data.content == null) {
          $('#messages').append($('<p class="col-xs-12">').html("<div class='col-xs-12 file-shared-notification'>" + data.fromUser + " has shared a file with you. Click <a class='link-download' target='_blank' href='/download?id=" + data.fromUser + "&name=" + data.toUser + "&span=" + data.createdOn + "&type=" + data.fileType + "'>here</a> to see. <small class='msg-time'>" + chatTime[0] + "," + chatTime[1].split('.')[0] + "</small></div>"));
        }
        else {
          $('#messages').append($('<p class="col-xs-12">').html("<div class='pull-left para-message'><b>" + data.fromUser + ": </b><span class='selectable'>" + data.content + "</span><small class='msg-time'>" + chatTime[0] + "," + chatTime[1].split('.')[0] + "</small></div>"));
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
    document.title = userSent + " is saying...";
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
  document.write('<p class="server-error">Server is not responding, connection failed. We regret the inconvenience.</p>');
});

//handler if user session has been expired
socket.on('user session is expired', function (data) {
  if(readCode($('#loggedIn-user').attr('data-info')) == data) {
    // window.location.href = '/';
  }
});
