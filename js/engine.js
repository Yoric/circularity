(function() {

"use strict";

var requestAnimationFrame =
   window.requestAnimationFrame
|| window.mozRequestAnimationFrame
|| window.webkitRequestAnimationFrame
|| window.ieRequestAnimationFrame;

// Utility function
var square = function square(x) {
  return x * x;
};

/**
 * @constructor
 */
var Engine = function Engine() {
  // A map from the various kinds of events to their observers
  this._listeners = {
    ":levelComplete": [],
    ":textShown": [],
    ":textHidden": []
  };

  // The balls
  this._balls = [];
  this._areas = [];
  this._previousFrameStamp = null;
  this._pad = new Pad();
  this._border = new Border();
  this._step = null;
  this._complete = false;
};

Engine.prototype = {
  /**
   * Call this to notify that the level is complete
   *
   * @param {boolean} victory If true, the player won, otherwise, the player lost
   */
  levelComplete: function levelComplete(victory) {
    console.log("Informing that level is complete");
    if (this._complete) {
      return;
    }
    this._step = function() { }; // Level is complete, nothing left to do
    this._complete = true;
    this._fireEvent(":levelComplete", {kind: "levelComplete", victory: victory});
  },


  // Handling events
  _fireEvent: function _fireEvent(key, event) {
    console.log("Informing observers of event", key);
    var set = this._listeners[key];
    if (!set) {
      console.error("Event key", key, "does not exist");
    }
    set.forEach(function(listener) {
      listener(event);
    });
  },
  addEventListener: function addEventListener(kind, listener) {
    var set = this._listeners[":" + kind];
    if (set == null) {
      throw new Error("Event kind " + kind + " does not exist");
    }
    if (set.indexOf(listener) == -1) {
      set.push(listener);
    }
  },
  removeEventListener: function removeEventListener(kind, listener) {
    var set = this._listeners[":" + kind];
    if (set == null) {
      throw new Error("Event kind " + kind + " does not exist");
    }
    var index = set.indexOf(listener);
    if (index != -1) {
      delete set[index];
    }
  },

  // Displaying text
  showText: function showText(text) {
    var eltText;
    var self = this;
    if (!this._eltText) {
      var eltBackground = document.getElementById("background");
      this._eltText = eltText = document.createElement("div");
    } else {
      eltText = this._eltText;
    }
    eltBackground.appendChild(eltText);
    eltText.textContent = text;
    eltText.classList.add("mayappear");
    eltText.classList.add("hidden");
    window.setTimeout(function() {
      eltText.classList.remove("hidden");
      eltText.classList.add("shown");
      eltText.addEventListener("transitionend", onshown);
      eltText.addEventListener("webkitTransitionEnd", onshown);
    });
    var onshown = function onshown() {
      eltText.removeEventListener("transitionend", onshown);
      eltText.removeEventListener("webkitTransitionEnd", onshown);
      self._fireEvent(":textShown", null);
    };
  },
  hideText: function hideText() {
    var eltText = this._eltText;
    if (!eltText) {
      return;
    }
    var self = this;
    eltText.classList.remove("shown");
    eltText.classList.add("hidden");
    var onhidden = function onhidden() {
      eltText.removeEventListener("transitionend", onhidden);
      eltText.removeEventListener("webkitTransitionEnd", onhidden);
      self._fireEvent(":textHidden", null);
    };
    eltText.addEventListener("transitionend", onhidden);
    eltText.addEventListener("webkitTransitionEnd", onhidden);
  },

  // Sprites
  /**
   * @return Ball
   */
  addBall: function addBall() {
    var ball = new Ball();
    this._balls.push(ball);
    return ball;
  },
  addArea: function addArea() {
    var area = new Area();
    this._areas.push(area);
    return area;
  },

  // Running the game (should be called by the level)
  run: function run(level) {
    var self = this;
    this._step = function() {
      Statistics.fps.begin();
      level.step(self);
      Statistics.fps.end();
      requestAnimationFrame(self._step);
    };
    var config = function config() {
      if (self._complete) {
        Config.removeEventListener("screenChanged", config);
        return;
      }
      console.log("Updating radius of just about everything");
      var radius = Math.min(Config.width, Config.height) / 2;
      self._pad.updateRadius(radius);
      self._balls.forEach(function (ball) {
        ball.updateRadius(radius);
      });
      self._areas.forEach(function (area) {
        area.updateRadius(radius);
      });
      self._border.updateRadius(radius);
    };
    Config.addEventListener("screenChanged", config);
    this._previousFrameStamp = Date.now();
    requestAnimationFrame(this._step);
  },

  // One step of the game (should be called by the level)
  step: function() {
    var now = Date.now();

    var midX = Config.width / 2;
    var midY = Config.height / 2;
    var delta = now - this._previousFrameStamp;

    var pad = this._pad;

    ////// Handle inputs
    if (Input.changed) {
      if (Input.mouseX == midX) {
        if (Input.mouseY >= midY) {
          pad.destRad = Math.PI / 2;
        } else {
          pad.destRad = - Math.PI / 2;
        }
      } else {
        var div = (Input.mouseY - midY) / (Input.mouseX - midX);
        if (Input.mouseX >= midX) {
          pad.destRad = Math.atan(div);
        } else {
          pad.destRad = Math.PI + Math.atan(div);
        }
      }
      Input.changed = false;
    }

    ////// Handle movements

    // FIXME: Minimize pad movements
    if (pad.destRad > pad.posRad) {
      pad.posRad = Math.min(pad.destRad, pad.posRad + 0.02 * delta);
    } else {
      pad.posRad = Math.max(pad.destRad, pad.posRad - 0.02 * delta);
    }

    for (var i = 0; i < this._balls.length; ++i) {
      var ball = this._balls[i];
      ball.x += ball.dx * ( ball.velocity * delta) ;
      ball.y += ball.dy * ( ball.velocity * delta) ;
    }

    ////// Handle display
    var ctx = canvasContext;
    // Clear and display game zone
    ctx.clearRect(0, 0, Config.width, Config.height);

    ctx.save();
    ctx.translate(midX, midY);
    var radius = Math.min(Config.width, Config.height) / 2;

    // Display center
    for (i = 0; i < this._areas.length; ++i) {
      this._areas[i].show(ctx);
    }

    // Display border
    this._border.show(ctx);

    // Display paddle
    var padX = this._pad.x = radius * Math.cos(this._pad.posRad);
    var padY = this._pad.y = radius * Math.sin(this._pad.posRad);
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.strokeStyle = "white";
// FIXME Optimization: Pre-compute this as an image
    ctx.arc( padX, padY, this._pad.radiusPixels, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Display ball
    for (i = 0; i < this._balls.length; ++i) {
      this._balls[i].show(ctx);
    }

    ////// Handle collisions
    var destructions = false;
    for (i = 0; i < this._balls.length; ++i) {
      ball = this._balls[i];
      // FIXME: Collision with the pad
      this._pad.handleCollision(ball);
      this._border.handleCollision(ball);
      for (var j = 0; j < this._areas.length; ++j) {
        var area = this._areas[j];
        area.handleCollision(ball);
        if (area.isDestroyed) {
          destructions = true;
        }
      }
      // FIXME: Collision with other balls
    }

    // FIXME: This won't scale if we have too many areas
    if (destructions) {
      var newAreas = [];
      for (j = 0; j < this._areas.length; ++j) {
        area = this._areas[j];
        if (!area.isDestroyed) {
          newAreas.push(area);
        }
      }
      this._areas = newAreas;
    }


    ctx.restore();

    this._previousFrameStamp = now;
  },

  getImage: function getImage() {
    return canvasContext.getImageData(0, 0, Config.width, Config.height);
  }
};

/**
 * @constructor
 */
var Sprite = function Sprite() {
  /**
   * The coordinates of the center of this object
   */
  this.x = 0;
  this.y = 0;

  /**
   * The radius
   */
  this.radiusPixels = 0;
  this.radiusPercent = null;

  this.fillStyle = null;
  this.strokeStyle = null;
  this.isBouncing = false;
  this.isAround = false;
  this.isDestructible = false;
  this.isDestroyed = false;
};
Sprite.prototype = {
  /**
   * If necessary, recompute the radius of the sprite
   * (used whenver the screen size changes)
   */
  updateRadius: function updateRadius(globalRadius) {
    console.log("Updating radius of", "" + this, globalRadius, this.radiusPercent);
    if (this.radiusPercent == null) {
      return;
    }
    this.radiusPixels = Math.floor(globalRadius * this.radiusPercent);
  },

  show: function show(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radiusPixels, 0, Math.PI * 2);
    if (this.fillStyle) {
      ctx.fillStyle = this.fillStyle;
      ctx.fill();
    }
    if (this.strokeStyle) {
      ctx.strokeStyle = this.strokeStyle;
      ctx.stroke();
    }
  },

  /**
   * Detect collisions and, if necessary, bounce
   *
   * @param {boolean} inner If true, the ball is inside the object
   */
  handleCollision: function handleCollision(ball) {
    var axisX = this.x - ball.x;
    var axisY = this.y - ball.y;

    // Distance between centers
    var sqActualDistance = axisX * axisX + axisY * axisY;

    // The distance at which there is a collision
    var sqBounceDistance;
    var bounce;
    if (this.isAround) {
      sqBounceDistance = square(this.radiusPixels - ball.radiusPixels);
      bounce = sqBounceDistance <= sqActualDistance;
    } else {
      sqBounceDistance = square(this.radiusPixels + ball.radiusPixels);
      bounce = sqBounceDistance >= sqActualDistance;
      axisX = - axisX;
      axisY = - axisY;
    }
    if (bounce && this.isDestructible) {
      this.isDestroyed = true;
    }

    if (!bounce) {
      return false;
    }
    if (!this.isBouncing) {
      return true;
    }

    // Ok, we have a collision and we should bounce

    // Normalize axis
    var actualDistance = Math.sqrt(sqActualDistance);
    axisX /= actualDistance;
    axisY /= actualDistance;

    var symX = 2 * axisX - ball.dx;
    var symY = 2 * axisY - ball.dy;

    var symNorm = Math.sqrt(symX * symX + symY * symY);

    ball.dx = symX / symNorm;
    ball.dy = symY / symNorm;
    return true;
  },

  toString: function() {
    return "Sprite: " + this.name;
  },

  name: "unnamed sprite"
};

var Area = function Area() {
};
Area.prototype = {
  __proto__: Object.create(Sprite.prototype),
  name: "area"
};

var Ball = function Ball() {
  Sprite.call(this);
  this.dx = 0;
  this.dy = 1;
  this.velocity = 0.1;
  this.radiusPixels = 5;
  this.fillStyle = "white";
};
Ball.prototype = {
  __proto__: Object.create(Sprite.prototype),
  name: "ball"
};

var Pad = function Pad() {
  Sprite.call(this);
  this.posRad = Math.PI / 2;// Position in radians
  this.destRad = Math.PI / 2; // Destination in radians
  this.radiusPixels = 10;
  this.isBouncing = true;
};
Pad.prototype = {
  __proto__: Object.create(Sprite.prototype),
  name: "pad"
};

var Border = function Border() {
  Sprite.call(this);
  this.radiusPercent = 1;
  this.strokeStyle = "blue";
  this.isBouncing = true;
  this.isAround = true;
};
Border.prototype = {
  __proto__: Object.create(Sprite.prototype),
  name: "border"
};

var eltCanvas = document.getElementById("canvas");
var canvasContext = eltCanvas.getContext("2d");

var Input = {
  mouseX: 0,
  mouseY: 0,
  changed: false
};

var onmousemove = function onmousemove(event) {
  event.stopPropagation();
  Input.mouseX = event.clientX;
  Input.mouseY = event.clientY;
  Input.changed = true;
};

eltCanvas.addEventListener("mousemove", onmousemove);
document.getElementById("background").addEventListener("mousemove", onmousemove);

// Configure
var Circular;
if ("Circular" in window) {
  Circular = window.Circular;
} else {
  Circular = window.Circular = {};
}


var Config = window.Circular.Config;
Config.init(eltCanvas);

var Statistics = window.Circular.Statistics;

// Exports

Circular.Engine = Engine;

})();