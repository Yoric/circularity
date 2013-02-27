(function() {

"use strict";

var requestAnimationFrame =
   window.requestAnimationFrame
|| window.mozRequestAnimationFrame
|| window.webkitRequestAnimationFrame
|| window.ieRequestAnimationFrame
|| function fallbackRequestAnimationFrame(f) {
  window.setTimeout(f, 17);
};

// Internet Explorer does not define |classList|

if (!("classList" in (window.HTMLElement || window.Element).prototype)) {
  var ClassList = function ClassList(element) {
    this._element = element;
    this._classes = element.className.split(" ");
  };
  ClassList.prototype = {
    add: function add(className) {
      if (this._classes.indexOf(className) == -1) {
        this._classes.push(className);
        this._element.className = this._classes.join(" ");
      }
    },
    remove: function remove(className) {
      var index = this._classes.indexOf(className);
      if (index != -1) {
        delete this._classes[index];
        this._element.className = this._classes.join(" ");
      }
    }
  };

  Object.defineProperty(
    (window.HTMLElement || window.Element).prototype,
    "classList",
    {
      get: function() {
        return new ClassList(this);
      },
      enumerable: true,
      configurable: true
    }
  );
};


// Utility function
var square = function square(x) {
  return x * x;
};

var HALFPI = Math.PI / 2;
var TWOPI = Math.PI * 2;

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
  this._pad = new Pad();
  this._border = new Border();
  this._step = null;
  this._complete = false;
  this._health = 100;

  this._latestFrameStamp = null;
  this._latestStartStamp = null;
  this._now = null;
  this._timeAccumulated = 0;
};

Engine.prototype = {
  /**
   * The time elapsed since the call to |run|.
   * (time spent on pause does not count)
   */
  get timeSinceStart() {
    return this._timeAccumulated + this._now - this._latestStartStamp;
  },
  /**
   * The time elapsed since the last frame
   * (time spent on pause does not count)
   */
  get delta() {
    return this._now - this._latestFrameStamp;
  },
  /**
   * Call this to notify that the level is complete
   *
   * @param {boolean} victory If true, the player won, otherwise, the player lost
   */
  levelComplete: function levelComplete(victory) {
    console.log("Informing that level is complete", victory);
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
      eltBackground.appendChild(eltText);
    } else {
      eltText = this._eltText;
    }
    eltText.textContent = text;
    console.log("eltText", eltText);
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

  _handlePause: function _handlePause() {
    this._timeAccumulated = this.timeSinceStart;
    var self = this;
    console.log("Paused", new Error().stack);
    var onunpause = function onunpause(event) {
      console.log("Unpaused");
      window.removeEventListener("click", onunpause);
      Input.paused = false;
      window.setTimeout(function() {
         self._latestStartStamp = self._latestFrameStamp = Date.now();
          console.log("requestAnimationFrame", 3);
          requestAnimationFrame(self._step);
        }, 100);
    };
    window.addEventListener("click", onunpause);
  },

  // Running the game (should be called by the level)
  run: function run(level) {
    var self = this;
    self._latestStartStamp = Date.now();
    this._step = function() {
      if (Input.paused) {
        self._handlePause();
        return;
      }

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
    this._latestFrameStamp = Date.now();
    console.log("requestAnimationFrame", 2);
    requestAnimationFrame(this._step);
  },

  // One step of the game (should be called by the level)
  step: function() {
    if (Input.paused) {
      self._handlePause();
      return;
    }


    var now = this._now = Date.now();

    var midX = Config.width / 2;
    var midY = Config.height / 2;
    var radius = Math.min(Config.width, Config.height) / 2;

    var delta = this.delta;

    var pad = this._pad;

    ////// Handle inputs
    if (Input.changed) {
      if (Input.mouseX == midX) {
        if (Input.mouseY >= midY) {
          pad.destRad = HALFPI;
        } else {
          pad.destRad = - HALFPI;
        }
      } else {
        var div = (Input.mouseY - midY) / (Input.mouseX - midX);
        if (Input.mouseX >= midX) {
          pad.destRad = Math.atan(div);
          console.log("destRad1", pad.destRad);
        } else {
          pad.destRad = Math.PI + Math.atan(div);
          console.log("destRad2", pad.destRad);
        }
      }
      Input.changed = false;
    }

    ////// Handle movements

    /*
    console.log("Pad",
                "pos",  pad.posRad, 0 <= pad.posRad && pad.posRad <= TWOPI,
                "dest", pad.destRad, 0 <= pad.destRad && pad.destRad <= TWOPI);
*/
    if (pad.posRad != pad.destRad) {
      // Number of radians required to go from posRad to destRad by increasing posRad
      var deltaIncrease;
      // Number of radians required to go from posRad to destRad by decreasing posRad
      var deltaDecrease;
      if (pad.posRad < pad.destRad) {
        deltaIncrease = Math.min(pad.destRad - pad.posRad, pad.posRad + TWOPI - pad.destRad);
        deltaDecrease = Math.max(pad.posRad - pad.destRad, pad.destRad + TWOPI - pad.posRad);
        console.log("delta", "case 1", pad.posRad, pad.destRad, pad.destRad - pad.posRad, pad.posRad + TWOPI - pad.destRad, deltaIncrease, deltaDecrease);
      } else {
        deltaIncrease = Math.min(pad.posRad - pad.destRad, pad.destRad + TWOPI - pad.posRad);
        deltaDecrease = Math.max(pad.destRad - pad.posRad, pad.posRad + TWOPI - pad.destRad);
        console.log("delta", "case 2", pad.posRad, pad.destRad, - pad.destRad + pad.posRad, - pad.posRad + TWOPI + pad.destRad, deltaIncrease, deltaDecrease);
      }
      if (deltaIncrease < deltaDecrease) {
        // Increase
        console.log("Increase", pad.destRad,  pad.posRad + 0.005 * delta);
        pad.posRad = Math.min(pad.destRad, pad.posRad + 0.005 * delta);
      } else {
        // Decrease
        console.log("Decrease");
        pad.posRad = Math.max(pad.destRad, pad.posRad - 0.005 * delta);
      }
//      throw new Error();
    }

    pad.x = radius * Math.cos(this._pad.posRad);
    pad.y = radius * Math.sin(this._pad.posRad);

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

    // Display center
    for (i = 0; i < this._areas.length; ++i) {
      this._areas[i].show(ctx);
    }

    // Display border
    this._border.show(ctx);

    // Display paddle
    this._pad.show(ctx);

    // Display ball
    for (i = 0; i < this._balls.length; ++i) {
      this._balls[i].show(ctx);
    }

    ////// Handle collisions
    var destructions = false;
    var adjustHealth = false;
    for (i = 0; i < this._balls.length; ++i) {
      var collisions = 0;
      ball = this._balls[i];
      if (this._pad.handleCollision(ball)) collisions++;
      if (this._border.handleCollision(ball)) {
        ball.velocity = ball.velocity * 0.9;
        this._health -= 10;
        adjustHealth = true;
      }
      for (var j = 0; j < this._areas.length; ++j) {
        var area = this._areas[j];
        if (area.handleCollision(ball)) collisions++;
        if (area.isDestroyed) {
          destructions = true;
        }
      }
      // FIXME: Collision with other balls

      // Increase speed progressively
      if (collisions > 0) {
        ball.velocity += 0.001;
        this._health = Math.min(100, this._health + 1);
        adjustHealth = true;
      }
    }
    if (adjustHealth) {
      console.log("Health changed to", this._health, Math.floor(this._health * 255 / 100));
      this._border.strokeStyle = "rgb(0, 0, " + Math.floor(this._health * 255 / 100) + ")";
      this._border.lineWidth = Math.ceil(this._health / 10);
      if (this._health <= 0) {
        this.levelComplete(false);
      }
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

    this._latestFrameStamp = now;
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
  this.lineWidth = null;
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

  /**
   * Display a sprite
   */
  show: function show(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radiusPixels, 0, TWOPI);
    if (this.lineWidth) {
      ctx.lineWidth = this.lineWidth;
    }
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
  this.posRad = HALFPI;// Position in radians
  this.destRad = HALFPI; // Destination in radians
  this.radiusPixels = 20;
  this.isBouncing = true;
  this.fillStyle = "white";
};
Pad.prototype = {
  __proto__: Object.create(Sprite.prototype),
  name: "pad"
};

var Border = function Border() {
  Sprite.call(this);
  this.radiusPercent = 1;
  this.strokeStyle = "rgb(0, 0, 255)";
  this.isBouncing = true;
  this.isAround = true;
  this.lineWidth = 10;
};
Border.prototype = {
  __proto__: Object.create(Sprite.prototype),
  name: "border",
  handleCollision: function handleCollision(ball) {
    if (Sprite.prototype.handleCollision.call(this, ball)) {
      this.showCollision();
      return true;
    }
    return false;
  },
  showCollision: function showCollision() {
    if ("vibrate" in window.navigator) {
      window.navigator.vibrate(100);
    }
  }
};

var eltCanvas = document.getElementById("canvas");
var canvasContext = eltCanvas.getContext("2d");

var Input = {
  mouseX: 0,
  mouseY: 0,
  changed: false,
  paused: false
};

var onmousemove = function onmousemove(event) {
  event.stopPropagation();
  Input.mouseX = event.clientX;
  Input.mouseY = event.clientY;
  Input.changed = true;
};

eltCanvas.addEventListener("mousemove", onmousemove);
document.getElementById("background").addEventListener("mousemove", onmousemove);

var onblur = function onblur(event) {
  console.log("blur");
  Input.paused = true;
  event.stopPropagation();
};

window.addEventListener("blur", onblur);
document.addEventListener("blur", onblur);
eltCanvas.addEventListener("blur", onblur);

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
  Circular.Input = Input;
})();