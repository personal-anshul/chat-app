//dependencies
var socket = io();

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
    //remove query string info
    history.pushState(null, "Windbag", "chat");
    setTimeout(function () {
      var user = $('li[data-info="' + id + '"]').attr('data-value');
      $('li[data-info="' + id + '"]').addClass('active');
      $('#input-message').val('');
      $('#chat-with-user-info').attr("data-info", id);
      $('#btn-send-message, #btn-attachment, #btn-smiley, #input-message').removeAttr('disabled');
      socket.emit('load related chat', user);
      $('.spinner').hide();
    }, 5000)
  }
}

//check if user is in proper window to get chat msg and chat have already been initiated
function checkPageStatus() {
  if($('#messages').html().indexOf('There is no chat between you both yet.') != -1) {
    $('#messages').html('');
  }
  if($('#messages').html().indexOf('Select user from list to start chat with them.') == -1) {
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
      document.getElementById("uploadForm").action = "/api/photo?id=" + $('#chat-with-user-info').attr("data-info") + "&span=" + currentDateTime;
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
      document.getElementById("uploadDp").action = "/api/dp?span=" + currentDateTime + "&id=" + $('#chat-with-user-info').attr('data-info');
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
