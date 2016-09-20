var smileySymbols = [
  ":)",
  ":(",
  ";(",
  ";)",
  ":D",
  ":d",
  ":p",
  ":P",
  ":^)",
  "man",
  "woman",
  "couple",
  "laugh",
  "happy",
  "smile",
  "bsmile",
  "tongue",
  "cheeky",
  "sad",
  "toosad",
  "wink",
  "winksmile",
  "grin",
  "evil",
  "cool",
  "supercool",
  "angry",
  "red",
  "devil",
  "devilanger",
  "shocked",
  "amazed",
  "baffled",
  "noclue",
  "confuse",
  "confused",
  "neutral",
  "speechless",
  "hipster",
  "hipstermood",
  "wonderhappy",
  "wondersad",
  "sleepy",
  "sleeping",
  "frustrate",
  "abuse",
  "cry",
  "cryshout",
  "imin",
  "you",
  "imout",
  "he",
  "blocked",
  "no",
  "yes",
  "right"
],
objDiv = document.getElementById("messages");

//restrict use of browser's back button
window.onpopstate = function(e) {
  window.history.forward();
};

//hide/close user list when ESC is pressed
$(window).on('keyup', function (event) {
  if(event.keyCode == 27) {
    if(document.getElementById('smiley-panel').className.indexOf('in') != -1) {
      $('#btn-smiley').click();
    }
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

$('#btn-smiley').on("click", function () {
  setTimeout(function() {
    $('div.modal-backdrop').removeClass('modal-backdrop');
    $('.modal-backdrop').hide();
  }, 10);
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
  if($('#chat-with-user-info').attr("data-info") != $(this).attr("data-info")) {
    $('li').removeClass('active');
    $('#messages').html('');
    $('#input-message').val('');
    $('#btn-send-message, #btn-attachment, #btn-smiley, #input-message').removeAttr('disabled');
    $('.spinner').show();
    $('#user-list').removeClass('in');
    $('#chat-with-user-info').attr("data-info", $(this).attr("data-info"));
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
    fileType: null,
    createdOn: null
  };
  var content = $('#input-message').val().trim().slice(0, 150);
  $('#hidden-element').html(content);
  if(content.indexOf('(') != -1 && content.indexOf(')') != -1) {
    content = content.replace(/[(]/g, "<span class='temp-vector'>");
    content = content.replace(/[)]/g, "</span>");
    $('#hidden-element').html(content);
    var data = document.getElementsByClassName('temp-vector');
    for(i = 0; i < data.length; i++) {
      if(smileySymbols.indexOf(data[i].innerHTML) != -1) {
        if(smileySymbols.indexOf(data[i].innerHTML) > 7) {
          $(data[i]).addClass('vector-' + data[i].innerHTML);
        }
        else {
          switch (smileySymbols.indexOf(data[i].innerHTML)) {
            case 0:
              $(data[i]).addClass('vector-smile');
              break;
            case 1:
              $(data[i]).addClass('vector-sad');
              break;
            case 2:
              $(data[i]).addClass('vector-cry');
              break;
            case 3:
              $(data[i]).addClass('vector-wink');
              break;
            case 4:
              $(data[i]).addClass('vector-laugh');
              break;
            case 5:
              $(data[i]).addClass('vector-happy');
              break;
            case 6:
              $(data[i]).addClass('vector-tongue');
              break;
            case 7:
              $(data[i]).addClass('vector-cheeky');
              break;
            default:
          }
        }
        data[i].innerHTML = "";
      }
      else {
        data[i].innerHTML = "(" + data[i].innerHTML + ")";
      }
    }
    if(!(data.length == 1 && (content.indexOf('<span') == 0 && content.indexOf('</span>') == content.length - 7))) {
      $('.temp-vector').addClass('small-vector');
    }
    $('.temp-vector').removeClass('temp-vector');
  }
  else {
    var smileyClass = "";
    if(content.length > 2) {
      smileyClass = "small-vector";
    }
    content = content.replace(":)", "<span class='vector-smile " + smileyClass + "'></span>");
    content = content.replace(":(", "<span class='vector-sad " + smileyClass + "'></span>");
    content = content.replace(";(", "<span class='vector-cry " + smileyClass + "'></span>");
    content = content.replace(";)", "<span class='vector-wink " + smileyClass + "'></span>");
    content = content.replace(":D", "<span class='vector-laugh " + smileyClass + "'></span>");
    content = content.replace(":d", "<span class='vector-happy " + smileyClass + "'></span>");
    content = content.replace(":p", "<span class='vector-tongue " + smileyClass + "'></span>");
    content = content.replace(":P", "<span class='vector-cheeky " + smileyClass + "'></span>");
    content = content.replace(":^)", "<span class='vector-wonderhappy " + smileyClass + "'></span>");
    $('#hidden-element').html(content);
  }
  msg.content = $('#hidden-element').html();
  msg.fromUser = $('#loggedIn-user').attr('data-info');
  msg.toUser = $('#chat-with-user-info').attr("data-info");
  msg.createdOn = new Date().setMinutes(new Date().getMinutes() + 330).valueOf();
  $('#hidden-element').html('');
  if(msg.content !== "") {
    socket.emit('event of chat on client', msg);
    socket.emit('pending-chat', msg.toUser, msg.fromUser);
    socket.emit('remove typing userinfo');
    if(checkPageStatus()) {
      var chatTime = new Date(msg.createdOn).toJSON().split('T');
      $('#messages').append($('<p class="col-xs-12">').html("<div class='pull-right para-message'><b>" + $('.userId-detail .user-name').html() + ": </b><span class='selectable'>" +  msg.content + "</span><small class='msg-time'>" + chatTime[0] + "," + chatTime[1].split('.')[0] + "</small></div>"));
      $('#input-message').val('');
    }
  }
  objDiv.scrollTop = objDiv.scrollHeight;
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
  $('#invalid-dp').html("");
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
    $("#invalid-dp").html("");
    $("#invalid-dp").html("<p>Voila!! This is how you will look. Nice dp.</p>").removeClass("error-msg");
  }
  else {
    $("#dp-preview").fadeOut("fast").removeAttr('src');
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
    $("#no-preview-msg").html("");
    $("#file-uploaded").fadeIn("fast").attr('src', URL.createObjectURL(event.target.files[0]));
  }
  else {
    $("#file-uploaded").fadeOut("fast").removeAttr('src');
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

//describe smiley on hover
$('.smiley-icons').on('mouseover', function (event) {
  $('.smiley-meaning').html("<small>" + $(this).attr('data-info') + "</small>");
});

//remove smiley description on mouse leave
$('#smiley-section').on('mouseleave', function (event) {
  $('.smiley-meaning').html('<small>no selection..</small>');
});

//broadcast smiley as messages
$('.smiley-icons').on('click', function (event) {
  $('#btn-smiley').click();
  $('.smiley-meaning').html("<small>no selection..</small>");
  $('#input-message').val($('#input-message').val() + "(" + $(this).attr('data-value') + ")");
  setTimeout(function () {
    $('#input-message').focus();
  }, 500);
});
