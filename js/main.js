// Must be loaded after levels.js and engine.js
(function() {

var console = window.console;
var Circular = window.Circular;

var levels = Circular.levels;

var startLevel = 0;

var run = function run() {
  var eltBackground = document.getElementById("background");
  var i = startLevel;
  var img = null;
  var loop = function loop() {
    console.log("Loop", "level", i, "from", levels.length, new Error().stack);
    eltBackground.innerHTML = "";
    var level = levels[i++];
    console.log("Next level is", "" + level);
    var engine = new Circular.Engine();
    engine.addEventListener("levelComplete", function(event) {
      // FIXME: Zoom in
      img = engine.getImage();
      if (event.victory) {
        loop();
      } else {
        try {
          engine.showText("The pull of the circularity is too strong. There is no escape.");
        } catch (ex) {
          console.error("Error", ex.stack);
          throw ex;
        }
      }
    });
    level.start(engine, img);
    engine.run(level);
  };
  window.setTimeout(loop, 0);
};

// Debugging code
if (window.location.search.length > 1) {
  (function() {
    var args = window.location.search.substr(1).split("&");
    var i;
    for (i = 0; i < args.length; ++i) {
      var arg = args[i];
      if (arg.startsWith("level=")) {
        try {
          startLevel = parseInt(arg.substr("level=".length));
          console.log("Start level set to", startLevel);
        } catch (ex) {
          console.log("Could not parse as level= arg", arg, ex);
        }
      } else {
        console.log("Could not understand arg", arg);
      }
    }
  })();
}

run();

})();