(function InitLevels() {



// Exports

var Circular;
if ("Circular" in window) {
  Circular = window.Circular;
} else {
  Circular = window.Circular = {};
}
var levels = Circular.levels = [];

var addTarget = function addTarget(engine) {
  var target = engine.addArea();
  target.x = 0;
  target.y = 0;
  target.radiusPixels = 10;
  target.strokeStyle = "green";

  var superHandleCollision = target.handleCollision;
  target.handleCollision = function handleCollision(ball) {
    if (superHandleCollision.call(this, ball)) {
      console.log("Level is complete");
      engine.levelComplete(true);
    }
  };
  return target;
};

var addObstacle = function addObstacle(engine, x, y) {
  var obstacle = engine.addArea();
  obstacle.x = x;
  obstacle.y = y;
  obstacle.radiusPixels = 5;
  obstacle.isBouncing = true;
  obstacle.fillStyle = "white";
  return obstacle;
};

var addDestructible = function addDestructible(engine, x, y) {
  var obstacle = engine.addArea();
  obstacle.x = x;
  obstacle.y = y;
  obstacle.radiusPixels = 5;
  obstacle.isBouncing = true;
  obstacle.strokeStyle = "white";
  obstacle.isDestructible = true;
  return obstacle;
};

// Starting credits
levels.push({
  start: function start(engine) {
    var eltText = engine.showText("The circularity has pulled you in. Escape.");
    engine.addEventListener("textShown", function onshown() {
      engine.removeEventListener("textShown", onshown);
      engine.addEventListener("textHidden", function onhidden() {
        engine.removeEventListener("textHidden", onhidden);
        engine.levelComplete(true);
      });
      engine.hideText();
    });
  },
  step: function step(engine) {
    // Nothing to do
  },
  toString: function toString() {
    return "Starting credits";
  }
});

// Level 1

levels.push({
  start: function start(engine) {
    engine.showText("To escape this circle, bounce the particle towards the center.");
    engine.addEventListener("textShown", function onshown() {
      engine.removeEventListener("textShown", onshown);
      window.setTimeout(function () { engine.hideText(); }, 5000);
    });

    var ball = engine.addBall();
    ball.x = 0;
    ball.y = 15;
    ball.dx = 0;
    ball.dy = 1;

    var target = addTarget(engine);
    engine.run(this);
  },
  step: function step(engine) {
    engine.step();
  },
  toString: function toString() {
    return "Tutorial";
  }
});

// Level 2: Obstacle course
levels.push({
  start: function start(engine, img) {
    engine.showText("Obstacles block your escape. Find your way around them.");
    engine.addEventListener("textShown", function onshown() {
      engine.removeEventListener("textShown", onshown);
      window.setTimeout(function () { engine.hideText(); }, 5000);
    });

    var ball = engine.addBall();
    ball.x = 0;
    ball.y = 50;
    ball.dx = 0;
    ball.dy = 1;

    var target = addTarget(engine);

    var obstacles = [[0, 25], [0, -25], [25, 0], [-25, 0]];
    for (var i = 0; i < obstacles.length; ++i) {
      var coor = obstacles[i];
      var obstacle = addObstacle(engine, coor[0], coor[1]);
    }

    engine.run(this);
  },
  step: function step(engine) {
    engine.step();
  },
  toString: function toString() {
    return "Obstacle course";
  }
});

// Level 3: Moving obstacles
levels.push({
  obstacles: [],
  start: function start(engine) {
    engine.showText("Some of these particles move.");
    engine.addEventListener("textShown", function onshown() {
      engine.removeEventListener("textShown", onshown);
      window.setTimeout(function () { engine.hideText(); }, 5000);
    });

    var ball = engine.addBall();
    ball.x = 0;
    ball.y = 50;
    ball.dx = 0;
    ball.dy = 1;

    var target = addTarget(engine);

    var superHandleCollision = target.handleCollision;
    target.handleCollision = function handleCollision(ball) {
      if (superHandleCollision.call(this, ball)) {
        console.log("Level is complete");
        engine.levelComplete(true);
      }
    };

    var obstacles = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
    for (var i = 0; i < obstacles.length; ++i) {
      var angle = obstacles[i];
      var obstacle = addObstacle(engine,
        Math.cos(angle) * 25, Math.sin(angle) * 25);
      this.obstacles.push(obstacle);
    }

    engine.run(this);
  },
  step: function step(engine) {
    var now = Date.now();
    var previous = engine._previousFrameStamp;
    for (var i = 0; i < this.obstacles.length; ++i) {
      var angle = now / 1000 + i * Math.PI / 2;
      this.obstacles[i].x = Math.cos(angle) * 25;
      this.obstacles[i].y = Math.sin(angle) * 25;
    }
    engine.step();
  },
  toString: function toString() {
    return "Moving obstacles";
  }
});

// Level 4: Bricks
levels.push({
  start: function start(engine, img) {
    engine.showText("There is no path. Maybe you can clear one.");
    engine.addEventListener("textShown", function onshown() {
      engine.removeEventListener("textShown", onshown);
      window.setTimeout(function () { engine.hideText(); }, 5000);
    });

    var ball = engine.addBall();
    ball.x = 0;
    ball.y = 50;
    ball.dx = .1;
    ball.dy = .9;

    var target = addTarget(engine);

    var obstacle;
    var angle;
    var i;

    for (i = 0; i < 4; ++i) {
      angle = Math.PI * i / 2;
      obstacle = addDestructible(engine,
        Math.cos(angle) * 10,
        Math.sin(angle) * 10);
    }

    for (i = 0; i < 8; ++i) {
      angle = Math.PI * i / 4;
      obstacle = addDestructible(engine,
        Math.cos(angle) * 25,
        Math.sin(angle) * 25);
    }

    for (i = 0; i < 16; ++i) {
      angle = Math.PI * i / 8;
      obstacle = addDestructible(engine,
        Math.cos(angle) * 40,
        Math.sin(angle) * 40);
    }

    engine.run(this);
  },
  step: function step(engine) {
    engine.step();
  },
  toString: function toString() {
    return "The Wall";
  }
});

levels.push({
  start: function start(engine) {
    engine.showText("United, they stand.");
    engine.addEventListener("textShown", function onshown() {
      engine.removeEventListener("textShown", onshown);
      window.setTimeout(function () { engine.hideText(); }, 5000);
    });

    var ball = engine.addBall();
    ball.x = 0;
    ball.y = 50;
    ball.dx = .1;
    ball.dy = .9;

    var target = addTarget(engine);

    var obstacle;
    var angle;
    var i, j;
    var index = 0;
    var obstacles = [[4, 10], [8, 25], [16, 40]];
    for (i = 0; i < obstacles.length; ++i) {
      var bound = obstacles[i][0];
      var radius = obstacles[i][1];
      for (j = 0; j < bound; ++j) {
        angle = ( Math.PI * 2 * j ) / bound;
        var x = Math.cos(angle) * radius;
        var y = Math.sin(angle) * radius;
        if (i > 0 && index++%4 == 0) {
          obstacle = addObstacle(engine, x, y);
        } else {
          obstacle = addDestructible(engine, x, y);
        }
      }
    }
    engine.run(this);
  },
  step: function step(engine) {
    engine.step();
  },
  toString: function toString() {
    return "United, they stand";
  }
});

// Ending credits
levels.push({
  start: function start(engine) {
    engine.showText("Congratulations. You have escaped the circularity");
  },
  step: function step(engine) {
    // Do NOT call engine.step()
  },
  toString: function toString() {
    return "Ending credits";
  }
});

})();