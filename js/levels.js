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
  target.radiusPercent = .03;
  target.minPixelRadius = 5;
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
  obstacle.radiusPercent = .02;
  obstacle.minPixelRadius = 2;
  obstacle.isBouncing = true;
  obstacle.fillStyle = "white";
  return obstacle;
};

var addDestructible = function addDestructible(engine, x, y) {
  var obstacle = engine.addArea();
  obstacle.x = x;
  obstacle.y = y;
  obstacle.radiusPixels = .02;
  obstacle.minPixelRadius = 2;
  obstacle.isBouncing = true;
  obstacle.strokeStyle = "white";
  obstacle.isDestructible = true;
  return obstacle;
};


// Level 1

levels.push({
  start: function start(engine) {
    engine.showText(
      [["To aid us in our escape, we only had the Particle. We had to bounce it to the center.", 5000]]);

    var ball = engine.addBall();
    ball.x = 0;
    ball.y = 20;
    ball.dx = 0;
    ball.dy = 1;

    var target = addTarget(engine);
    engine.run(this);
  },
  step: function step(engine) {
    engine.step();
  },
  toString: function toString() {
    return "It begins";
  },
  unlocked: true
});

// Level 2: Obstacle course
levels.push({
  start: function start(engine, img) {
    engine.showText(
      [["There were obstacles. Fortunately, the Particle was agile enough to bounce past them.", 5000]]);

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
    engine.showText("The particles moved, as if defending the core.");
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
    var elapsed = engine.timeSinceStart;
    for (var i = 0; i < this.obstacles.length; ++i) {
      var angle = elapsed / 1000 + i * Math.PI / 2;
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
    engine.showText(
      [["Ahead of us, there was no path. Was the Particle strong enough to clear one?", 5000]]);

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
    engine.showText("As we progressed, we encountered cores of increasing complexity.");
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

levels.push({
  obstacles: null,
  start: function start(engine) {
    engine.showText(
      [["The core, moving again, as if defending itself.", 5000]]);

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
    var init = [[4, 10], [8, 25], [16, 40]];
    var obstacles = [];
    for (i = 0; i < init.length; ++i) {
      var bound = init[i][0];
      var radius = init[i][1];
      for (j = 0; j < bound; ++j) {
        angle = ( Math.PI * 2 * j ) / bound;
        var x = Math.cos(angle) * radius;
        var y = Math.sin(angle) * radius;
        if (i > 0 && index++%4 == 0) {
          obstacle = addObstacle(engine, x, y);
        } else {
          obstacle = addDestructible(engine, x, y);
        }
        obstacle.initialAngle = angle;
        obstacle.radiusPos = radius;
        obstacle.rank = i;
        obstacles.push(obstacle);
      }
    }
    this.obstacles = obstacles;
    engine.run(this);
  },
  step: function step(engine) {
    var elapsed = engine.timeSinceStart;
    for (var i = 0; i < this.obstacles.length; ++i) {
      var deltaAngle = elapsed / 1000;
      var obstacle = this.obstacles[i];
      var initialAngle = obstacle.initialAngle;
      var radius = obstacle.radiusPos;
      var angle;
      if (obstacle.rank % 2 == 0) {
        angle = initialAngle + deltaAngle;
      } else {
        angle = initialAngle - deltaAngle;
      }
      obstacle.x = Math.cos(angle) * radius;
      obstacle.y = Math.sin(angle) * radius;
    }
    engine.step();
  },
  toString: function toString() {
    return "United, they move";
  }
});

// Ending credits
levels.push({
  start: function start(engine) {
    engine.showText("We had escaped the circularity. For a time.");
  },
  step: function step(engine) {
    // Do NOT call engine.step()
  },
  toString: function toString() {
    return "Ending credits";
  }
});

})();