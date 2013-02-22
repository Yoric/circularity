(function() {

var console = window.console;

var eltCanvas = document.getElementById("canvas");
var canvasContext = eltCanvas.getContext("2d");


var previousFrame = null;

var Input = {
  mouseX: 0,
  mouseY: 0,
  changed: false
};

/**
 * The player-controlled pad
 */
var Pad = {
  posRad: Math.PI / 2,
  destRad: Math.PI / 2,
  radius: 10
};

/**
 * The ball
 */
var Ball = {
  x: 0,
  y: 0,
  radius: 5,
  velocity: 0.1,
  dx: 0,
  dy: 1
};

var Util = {
  square: function(x) {
    return x*x;
  }
};

var onmousemove = function onmousemove(event) {
  event.stopPropagation();
  Input.mouseX = event.clientX;
  Input.mouseY = event.clientY;
  Input.changed = true;
};

eltCanvas.addEventListener("mousemove", onmousemove);

// Set the clip
var init = function init() {
  console.log("Clip init");
  var width = Config.width;
  var height = Config.height;
  var ctx = canvasContext;
  var radius = Math.min(width, height) / 2;
  var midX = width / 2;
  var midY = height / 2;
  ctx.beginPath();
  ctx.fillStyle = "black";
  ctx.strokeStyle = "blue";
  ctx.arc(midX, midY, radius, 0, Math.PI * 2);
  ctx.clip();
}

var step = function step() {
  Statistics.fps.begin();
  Statistics.ms.begin();

  var now = Date.now();
  var delta = now - previousFrame;

  var width = Config.width;
  var height = Config.height;
  var ctx = canvasContext;

  var radius = Math.min(width, height) / 2;
  var midX = width / 2;
  var midY = height / 2;

// Update the destination and position of the paddle
  // FIXME: We may not need to update the destination at every frame
  // FIXME: We may wish to have different speeds for the paddle
  if (Input.changed) {
    if (Input.mouseX == midX) {
      if (Input.mouseY >= midY) {
        Pad.destRad = Math.PI / 2;
      } else {
        Pad.destRad = - Math.PI / 2;
      }
    } else {
      var div = (Input.mouseY - midY) / (Input.mouseX - midX);
      if (Input.mouseX >= midX) {
        Pad.destRad = Math.atan(div);
      } else {
        Pad.destRad = Math.PI + Math.atan(div);
      }
    }
    Input.changed = false;
  }
  if (Pad.destRad > Pad.posRad) {
    Pad.posRad = Math.min(Pad.destRad, Pad.posRad + 0.02 * delta);
  } else {
    Pad.posRad = Math.max(Pad.destRad, Pad.posRad - 0.02 * delta);
  }

// Update position of the ball
  Ball.x += Ball.dx * ( Ball.velocity * delta );
  Ball.y += Ball.dy * ( Ball.velocity * delta );
  var ballX = midX + Ball.x;
  var ballY = midY + Ball.y;

// Clear and display game zone
  ctx.beginPath();
  ctx.fillStyle = "black";
  ctx.strokeStyle = "blue";
  ctx.arc(midX, midY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

// Display paddle
  var padX = radius * Math.cos(Pad.posRad);
  var padY = radius * Math.sin(Pad.posRad);
  ctx.beginPath();
  ctx.fillStyle = "white";
  ctx.arc(midX + padX, midY + padY, Pad.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

// Display ball
  console.log("Ball", ballX, ballY);
  ctx.beginPath();
  ctx.arc(ballX, ballY, Ball.radius, 0, Math.PI * 2);
  ctx.fill();

// Check for game over
  if (Ball.x * Ball.x + Ball.y * Ball.y >= radius * radius) {
    throw new Error("Game over");
  }

// Check for bounce
  var distance = Math.sqrt(Util.square(Ball.x - padX) + Util.square(Ball.y - padY));
  if (distance <= Pad.radius + Ball.radius) {
    var axisX = (Ball.x - padX) / distance;
    var axisY = (Ball.y - padY) / distance;
    console.log("Axis", axisX, axisY);
    var bounceX = 2 * axisX - Ball.dx;
    var bounceY = 2 * axisY - Ball.dy;
    var bounceNorm = Math.sqrt(Util.square(bounceX) + Util.square(bounceY));
    console.log("Bouncing", Ball.dx, Ball.dy, " => ", bounceX, bounceY);
    Ball.dx = bounceX / bounceNorm;
    Ball.dy = bounceY / bounceNorm;
  }

  Statistics.fps.end();
  Statistics.ms.end();

  previousFrame = now;
  requestAnimationFrame(step);
};


// Configure
var Config = window.Circular.Config;
Config.init(eltCanvas);
Config.addEventListener("change", init);
init();

var Statistics = window.Circular.Statistics;

var requestAnimationFrame =
   window.requestAnimationFrame
|| window.mozRequestAnimationFrame
|| window.webkitRequestAnimationFrame
|| window.ieRequestAnimationFrame;

previousFrame = Date.now();

// Launch
requestAnimationFrame(step);

})();