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

var Sprite = function Sprite() {
  /**
   * The coordinates of the center of this object
   */
  this.center = new Int16Array(2);
};

/**
 * @constructor
 */
var Obstacle = function Obstacle() {
  Sprite.call(this);
};
Obstacle.prototype = Object.create(Sprite.prototype);

// Must be implemented by descendant class
Obstacle.prototype.contact = null;

/**
 * Bounce if necessary.
 *
 * @return {boolean} `true` If bounced, `false` otherwise.
 */
Obstacle.prototype.bounce = function bounce(ball, inner) {
//  if (!this.contact(ball)) {
//    return false;
//  }
  var axisX = ball.center[0] - this.center[0];
  var axisY = ball.center[1] - this.center[1];
  if (inner) {
    axisX = - axisX;
    axisY = - axisY;
  }
  // FIXME: Norm can be shared with `contact`
  var norm = Math.sqrt(axisX * axisX + axisY * axisY);
  axisX /= norm;
  axisY /= norm;
  var symX = 2 * axisX - ball.speed[0];
  var symY = 2 * axisY - ball.speed[1];
  console.log("Bounce", "axisX", axisX, "axisY", axisY,
              "speedX", ball.speed[0],
              "speedY", ball.speed[1],
              "symX", symX, "symY", symY);
// [15:40:33.827] Bounce axisX 0 axisY -1 speedX 0 speedY 1 symX 0 symY -3
  norm = Math.sqrt(Util.square(symX) + Util.square(symY));
  ball.speed[0] = symX / norm;
  ball.speed[1] = symY / norm;
  console.log("=>", "norm", norm,
    "new speedX", symX / norm, ball.speed[0],
    "new speedY", symY / norm, ball.speed[1]);
  return true;
};


/**
 * The player-controlled pad
 */
var Pad = new Obstacle();
Pad.posRad = Math.PI / 2;// Position in radians
Pad.destRad = Math.PI / 2; // Destination in radians
Pad.radius = 10;

/**
 * The ball
 */
var Ball = new Obstacle();
Ball.radius = 5;
Ball.velocity = 0.1;
Ball.speed = new Float32Array(2);
Ball.speed[1] = 1;
Ball.destOffset = new Uint32Array(2);

var Field = new Obstacle();

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
    Ball.center[0] += Ball.speed[0] * ( Ball.velocity * delta );
    Ball.center[1] += Ball.speed[1] * ( Ball.velocity * delta );
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
    var padX = Pad.center[0] = radius * Math.cos(Pad.posRad);
    var padY = Pad.center[1] = radius * Math.sin(Pad.posRad);
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
    ctx.arc(midX + Ball.center[0], midY + Ball.center[1], Ball.radius, 0, Math.PI * 2);
    ctx.fill();
  },
  handleCollisions: function handleCollisions() {
    var delta = Date.now() - Game._previousFrameStamp;
    var radius = Math.min(Config.width, Config.height) / 2;
    var padX = Pad.center[0];
    var padY = Pad.center[1];

    var axisX, axisY;

    // Check whether we have hit the border
    var sqBallToCenter = Ball.center[0] * Ball.center[0] + Ball.center[1] * Ball.center[1];
    if (sqBallToCenter >= radius * radius) {
      console.log("Hit on the border!");
      Field.bounce(Ball, true);
      /*
      axisX = Ball.center[0] / sqBallToCenter;
      axisY = Ball.center[1] / sqBallToCenter;
      Util.symmetry(Ball.speed[0], Ball.speed[1], axisX, axisY, 0, Ball);
*/
      // Adjusting position immediately
      Ball.center[0] += Ball.speed[0] * ( Ball.velocity * delta );
      Ball.center[1] += Ball.speed[1] * ( Ball.velocity * delta );
    }

    // Check for bounce
    var ballToPad = Math.sqrt(Util.square(Ball.center[0] - padX) + Util.square(Ball.center[1] - padY));
    if (ballToPad <= Pad.radius + Ball.radius) {
      console.log("Bouncing", JSON.stringify(Ball));

      Pad.bounce(Ball, false);
      /*
      axisX = (Ball.center[0] - padX) / ballToPad;
      axisY = (Ball.center[1] - padY) / ballToPad;
      Util.symmetry(Ball.speed[0], Ball.speed[1], axisX, axisY, (Math.random() - 0.5) / 2, Ball);
*/
      // Adjusting position immediately
      Ball.center[0] += Ball.speed[0] * ( Ball.velocity * delta );
      Ball.center[1] += Ball.speed[1] * ( Ball.velocity * delta );
      console.log("Bouncing =>", Ball.center[0], Ball.center[1], JSON.stringify(Ball));
//      throw new Error();
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
  if (window.stopGame) { // FIXME: For debugging purposes
    throw new Error();
  }
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