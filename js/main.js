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
  radius: 10,
  x: 0,
  y: 0
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
  },
  /**
   * Compute the symmetric of a unit vector
   *
   * x0, y0: Unit vector
   * x1, y1: Unit vector for the symmetri axis
   * obj: Object receiving symmetric as fields dx and dy
   */
  symmetry: function(x0, y0, x1, y1, random, obj) {
    var symX = 2 * x1 - x0 + random;
    var symY = 2 * y1 - y0 + random;
    var norm = Math.sqrt(Util.square(symX) + Util.square(symY));
    obj.dx = symX / norm;
    obj.dy = symY / norm;
  }
};

var onmousemove = function onmousemove(event) {
  event.stopPropagation();
  Input.mouseX = event.clientX;
  Input.mouseY = event.clientY;
  Input.changed = true;
};

eltCanvas.addEventListener("mousemove", onmousemove);


var Game = {
  // Cached variables

  _previousFrameStamp: Date.now(),

  handleMovement: function handleMovement() {
    var midX = Config.width / 2;
    var midY = Config.height / 2;
    var delta = Date.now() - Game._previousFrameStamp;

    // Update the destination and position of the paddle
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
  },
  handleDisplay: function handleDisplay() {
    var ctx = canvasContext;
    var width = Config.width;
    var height = Config.height;
    var midX = width / 2;
    var midY = height / 2;
    var radius = Math.min(midX, midY);

    // Clear and display game zone
    ctx.clearRect(0, 0, width, height);

// FIXME Optimization: Pre-compute this as an image
    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.strokeStyle = "blue";
    ctx.arc(midX, midY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Display paddle
    var padX = Pad.x = radius * Math.cos(Pad.posRad);
    var padY = Pad.y = radius * Math.sin(Pad.posRad);
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.strokeStyle = "white";
// FIXME Optimization: Pre-compute this as an image
    ctx.arc(midX + padX, midY + padY, Pad.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Display ball
// FIXME Optimization: Pre-compute this as an image
    ctx.beginPath();
    ctx.arc(midX + Ball.x, midY + Ball.y, Ball.radius, 0, Math.PI * 2);
    ctx.fill();
  },
  handleCollisions: function handleCollisions() {
    var delta = Date.now() - Game._previousFrameStamp;
    var radius = Math.min(Config.width, Config.height) / 2;
    var padX = Pad.x;
    var padY = Pad.y;

    var axisX, axisY;
    // Check for game over
    var sqBallToCenter = Ball.x * Ball.x + Ball.y * Ball.y;
    if (sqBallToCenter >= radius * radius) {
      console.log("Game over!");
      axisX = Ball.x / sqBallToCenter;
      axisY = Ball.y / sqBallToCenter;
      Util.symmetry(Ball.dx, Ball.dy, axisX, axisY, (Math.random() - 0.5) / 10, Ball);

      // Adjusting position immediately
      Ball.x += Ball.dx * ( Ball.velocity * delta );
      Ball.y += Ball.dy * ( Ball.velocity * delta );
    }

    // Check for bounce
    var ballToPad = Math.sqrt(Util.square(Ball.x - padX) + Util.square(Ball.y - padY));
    if (ballToPad <= Pad.radius + Ball.radius) {
      console.log("Bouncing", JSON.stringify(Ball));
      axisX = (Ball.x - padX) / ballToPad;
      axisY = (Ball.y - padY) / ballToPad;
      Util.symmetry(Ball.dx, Ball.dy, axisX, axisY, (Math.random() - 0.5) / 2, Ball);

      // Adjusting position immediately
      Ball.x += Ball.dx * ( Ball.velocity * delta );
      Ball.y += Ball.dy * ( Ball.velocity * delta );
      console.log("Bouncing =>", Ball.x, Ball.y, JSON.stringify(Ball));
    }
  },
  step: function step() {
    Statistics.fps.begin();
    Statistics.ms.begin();

    var now = Date.now();

    var width = Config.width = Config.width;
    var height = Config.height = Config.height;
    Game.radius = Math.min(width, height) / 2;
    Game.midX = width / 2;
    Game.midY = height / 2;

    Game.handleMovement();
    Game.handleDisplay();
    Game.handleCollisions();

    Statistics.fps.end();
    Statistics.ms.end();

    Game._previousFrameStamp = now;
    requestAnimationFrame(step);
  }
};
var step = function() {
  Game.step();
};


// Configure
var Config = window.Circular.Config;
Config.init(eltCanvas);

var Statistics = window.Circular.Statistics;

var requestAnimationFrame =
   window.requestAnimationFrame
|| window.mozRequestAnimationFrame
|| window.webkitRequestAnimationFrame
|| window.ieRequestAnimationFrame;

Game._previousFrameStamp = Date.now();

// Launch
requestAnimationFrame(step);

})();