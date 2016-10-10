var clientId = 'YOUR_CLIENT_ID_HERE';
var redirectUri = 'http://literate-string.surge.sh/auth.html';
var artikBase = 'https://accounts.artik.cloud/authorize?client_id=';
var artikCloud = 'https://api.artik.cloud/v1.1/messages';



Pebble.addEventListener('showConfiguration', function(){
  var configUrl = artikBase + clientId + '&response_type=token&redirect_uri=' + redirectUri;
  Pebble.openURL(configUrl);
});

Pebble.addEventListener('webviewclosed', function(e){
  var configData = JSON.parse(decodeURIComponent(e.response));
  console.log(configData.items.length);
  
  window.localStorage.setItem('devices', JSON.stringify(configData.items));
  
  window.localStorage.setItem('pebble_did', configData.pebble.id);
  window.localStorage.setItem('pebble_token', configData.pebble.token);
});



function getDeviceData(url, id, token, type, callback){
  var xhr = new XMLHttpRequest();
  xhr.onload = function(){
    callback(id, this.responseText);
  };
  xhr.open(type, url);
  xhr.setRequestHeader('Authorization', 'Bearer ' + token);
  xhr.send();
}


function postLoc(url, data, callback){
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', 'Bearer ' + window.localStorage.getItem('pebble_token'));
  xhr.onreadystatechange = function(){
    if (xhr.readyState == 4 && xhr.status == 200){
      callback(xhr.responseText);
    }
  }
  console.log(JSON.stringify(data));
  xhr.send(JSON.stringify(data));
}

Pebble.on('message', function(event){
  //get the passed message data
  var message = event.data;
  if (message.post) {
      navigator.geolocation.getCurrentPosition(function(pos){
      var postData = {
          'sdid': window.localStorage.getItem('pebble_did'),
          'ts': new Date().valueOf(),
          'type': 'message',
          'data' : {
            'lat' : pos.coords.latitude,
            'long' : pos.coords.longitude 
        }
      }
      postLoc(artikCloud, postData, function(respText){
        console.log(JSON.stringify(respText));
      });
    }, function(err){
      console.log("Error getting location");
    },
      {
        timeout: 15000,
          maximumAge: 600000
      });
  }
  
  if (message.fetch){
    console.log("device data update requested...");
    var devicesQueried = [];
    var messages = [];
    var devices = JSON.parse(window.localStorage.getItem('devices'));
    for (var i = 0; i < devices.length; i++){
      if (devicesQueried.indexOf(devices[i].id) === -1){
        var url = artikCloud + '/snapshot?sdid=' + devices[i].id;
        devicesQueried.push(devices[i].id);
        getDeviceData(url, devices[i].id, devices[i].token, 'GET', function(id, respText){
          
          var deviceData = JSON.parse(respText);
          for (var j = 0; j < devices.length; j++){
            if (devices[j].id === id){
              messages.push(devices[j].field + " : " + Math.round(deviceData.data[devices[j].field].value));
              if (messages.length === devices.length){
                console.log("sending messages to watch...");
                Pebble.postMessage({
                  messages: messages
                });
              }
            }
          }
          
        });
      }
    }
    
    
  }
});

