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
    ball.y = 10;
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
  }
});

// Ending credits
levels.push({
  start: function start(engine) {
    engine.showText("You have escaped the circularity");
  },
  step: function step(engine) {
    // Do NOT call engine.step()
  }
});

})();