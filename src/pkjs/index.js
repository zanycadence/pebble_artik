
var artikCloud = 'https://api.artik.cloud/v1.1/messages';
var locBearer = 'Bearer INSERT_PEBBLE_DEVICE_TOKEN';
var locId = 'INSERT_PEBBLE_DEVICE_ID';

var sensorTagBearer = 'Bearer INSERT_OTHER_SENSOR_TOKEN';
var sensorTagId = 'INSER_OTHER_SENSOR_ID';




function getSensorData(url, type, callback){
  var xhr = new XMLHttpRequest();
  xhr.onload = function(){
    callback(this.responseText);
  };
  xhr.open(type, url);
  xhr.setRequestHeader('Authorization', sensorTagBearer);
  xhr.send();
}

function postLoc(url, data, callback){
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', locBearer);
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
          'sdid': locId,
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

      var url = artikCloud + '/snapshot?sdid=' + sensorTagId;
      console.log(url);
      getSensorData(url, 'GET', function(respText){
        var sensorData = JSON.parse(respText);
        console.log(sensorData.data.Ambient_Temperature.value);
        Pebble.postMessage({
          'temperature': {
            'celsius' : Math.round(sensorData.data.Ambient_Temperature.value),
            'fahrenheit' : Math.round(sensorData.data.Ambient_Temperature.value * 9 / 5 + 32)
          }
        });
      });
  }
});
