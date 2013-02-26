(function InitLevels() {



// Exports

var Circular;
if ("Circular" in window) {
  Circular = window.Circular;
} else {
  Circular = window.Circular = {};
}
var levels = Circular.levels = [];



// Starting credits
levels.push({
  start: function start(engine) {
    var eltText = engine.showText("You have been trapped in the circularity");
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
    engine.showText("To exit, bounce the particle towards the center");
    engine.addEventListener("textShown", function onshown() {
      engine.removeEventListener("textShown", onshown);
      window.setTimeout(function () { engine.hideText(); }, 5000);
    });

    var ball = engine.addBall();
    ball.x = 0;
    ball.y = 15;
    ball.dx = 0;
    ball.dy = 1;

    var target = engine.addArea();
    target.x = 0;
    target.y = 0;
    target.radiusPixels = 5;
    target.fillStyle = "green";
    target.strokeColor = "green";

    var superHandleCollision = target.handleCollision;
    target.handleCollision = function handleCollision(ball) {
      if (superHandleCollision.call(this, ball)) {
        console.log("Level is complete");
        engine.levelComplete(true);
      }
    };

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
    engine.showText("Often, you will need to avoid obstacles");
    engine.addEventListener("textShown", function onshown() {
      engine.removeEventListener("textShown", onshown);
      window.setTimeout(function () { engine.hideText(); }, 5000);
    });

    var ball = engine.addBall();
    ball.x = 0;
    ball.y = 50;
    ball.dx = 0;
    ball.dy = 1;

    var target = engine.addArea();
    target.x = 0;
    target.y = 0;
    target.radiusPixels = 5;
    target.strokeStyle = "green";

    var superHandleCollision = target.handleCollision;
    target.handleCollision = function handleCollision(ball) {
      if (superHandleCollision.call(this, ball)) {
        console.log("Level is complete");
        engine.levelComplete(true);
      }
    };


    var obstacles = [[0, 25], [0, -25], [25, 0], [-25, 0]];
    for (var i = 0; i < obstacles.length; ++i) {
      var obstacle = engine.addArea();
      var coor = obstacles[i];
      obstacle.x = coor[0];
      obstacle.y = coor[1];
      obstacle.radiusPixels = 5;
      obstacle.isBouncing = true;
      obstacle.strokeStyle = "white";
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
    engine.showText("They move, too");
    engine.addEventListener("textShown", function onshown() {
      engine.removeEventListener("textShown", onshown);
      window.setTimeout(function () { engine.hideText(); }, 5000);
    });

    var ball = engine.addBall();
    ball.x = 0;
    ball.y = 50;
    ball.dx = 0;
    ball.dy = 1;

    var target = engine.addArea();
    target.x = 0;
    target.y = 0;
    target.radiusPixels = 5;
    target.fillStyle = "green";

    var superHandleCollision = target.handleCollision;
    target.handleCollision = function handleCollision(ball) {
      if (superHandleCollision.call(this, ball)) {
        console.log("Level is complete");
        engine.levelComplete(true);
      }
    };

    var obstacles = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
    for (var i = 0; i < obstacles.length; ++i) {
      var obstacle = engine.addArea();
      var angle = obstacles[i];
      obstacle.x = Math.cos(angle) * 25;
      obstacle.y = Math.sin(angle) * 25;
      obstacle.radiusPixels = 5;
      obstacle.isBouncing = true;
      obstacle.strokeStyle = "white";
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
    engine.showText("Clear a path");
    engine.addEventListener("textShown", function onshown() {
      engine.removeEventListener("textShown", onshown);
      window.setTimeout(function () { engine.hideText(); }, 5000);
    });

    var ball = engine.addBall();
    ball.x = 0;
    ball.y = 50;
    ball.dx = .1;
    ball.dy = .9;

    var target = engine.addArea();
    target.x = 0;
    target.y = 0;
    target.radiusPixels = 5;
    target.strokeStyle = "green";

    var superHandleCollision = target.handleCollision;
    target.handleCollision = function handleCollision(ball) {
      if (superHandleCollision.call(this, ball)) {
        console.log("Level is complete");
        engine.levelComplete(true);
      }
    };

    var obstacle;
    var angle;
    var i;

    for (i = 0; i < 4; ++i) {
      obstacle = engine.addArea();
      angle = Math.PI * i / 2;
      obstacle.x = Math.cos(angle) * 10;
      obstacle.y = Math.sin(angle) * 10;
      obstacle.radiusPixels = 5;
      obstacle.isBouncing = true;
      obstacle.strokeStyle = "white";
      obstacle.isDestructible = true;
    }

    for (i = 0; i < 8; ++i) {
      obstacle = engine.addArea();
      angle = Math.PI * i / 4;
      obstacle.x = Math.cos(angle) * 25;
      obstacle.y = Math.sin(angle) * 25;
      obstacle.radiusPixels = 5;
      obstacle.isBouncing = true;
      obstacle.strokeStyle = "white";
      obstacle.isDestructible = true;
    }

    for (i = 0; i < 16; ++i) {
      obstacle = engine.addArea();
      angle = Math.PI * i / 8;
      obstacle.x = Math.cos(angle) * 40;
      obstacle.y = Math.sin(angle) * 40;
      obstacle.radiusPixels = 5;
      obstacle.isBouncing = true;
      obstacle.strokeStyle = "white";
      obstacle.isDestructible = true;
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