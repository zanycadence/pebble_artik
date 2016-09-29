var rocky = require('rocky');
var temperature;
var timeSinceLast = 5;

rocky.on('message', function(event){
  var message = event.data;
  
  if (message.temperature) {
    temperature = message.temperature;
    rocky.requestDraw();
  }
});


function drawTemp(ctx, temp){
  var tempString = 'TI SensorTag: ' + temp.fahrenheit + '°F ';
  
  ctx.fillStyle = 'lightgray';
  ctx.textAlign = 'center';
  ctx.font = '14px Gothic';
  ctx.fillText(tempString, ctx.canvas.unobstructedWidth/2, 2);
}


function fractionToRadian(fraction) {
  return fraction * 2 * Math.PI;
}

function drawHand(ctx, cx, cy, angle, length, color) {
  // Find the end points
  var x2 = cx + Math.sin(angle) * length;
  var y2 = cy - Math.cos(angle) * length;

  // Configure how we want to draw the hand
  ctx.lineWidth = 8;
  ctx.strokeStyle = color;

  // Begin drawing
  ctx.beginPath();

  // Move to the center point, then draw the line
  ctx.moveTo(cx, cy);
  ctx.lineTo(x2, y2);

  // Stroke the line (output to display)
  ctx.stroke();
}

rocky.on('draw', function(event) {
  var ctx = event.context;
  var d = new Date();

  // Clear the screen
  ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
  
  if (temperature){
    drawTemp(ctx, temperature);
  }
  
  // Determine the width and height of the display
  var w = ctx.canvas.unobstructedWidth;
  var h = ctx.canvas.unobstructedHeight;

  // Determine the center point of the display
  // and the max size of watch hands
  var cx = w / 2;
  var cy = h / 2;

  // -20 so we're inset 10px on each side
  var maxLength = (Math.min(w, h) - 20) / 2;

  // Calculate the minute hand angle
  var minuteFraction = (d.getMinutes()) / 60;
  var minuteAngle = fractionToRadian(minuteFraction);

  // Draw the minute hand
  drawHand(ctx, cx, cy, minuteAngle, maxLength, "white");

  // Calculate the hour hand angle
  var hourFraction = (d.getHours() % 12 + minuteFraction) / 12;
  var hourAngle = fractionToRadian(hourFraction);

  // Draw the hour hand
  drawHand(ctx, cx, cy, hourAngle, maxLength * 0.6, "sunsetorange");
});

rocky.on('minutechange', function(event) {
  timeSinceLast++;
  if (timeSinceLast >= 5){    
    rocky.postMessage({'fetch': true, 'post': true});
    timeSinceLast = 0;
  }
  
  
  // Request the screen to be redrawn on next pass
  rocky.requestDraw();
});
