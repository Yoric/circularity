// Must be loaded after levels.js and engine.js
(function() {

var console = window.console;
var Circular = window.Circular;

var levels = Circular.levels;

var run = function run() {
  var eltBackground = document.getElementById("background");
  var i = 0;
  var loop = function loop() {
    console.log("Loop", "level", i, "from", levels.length, new Error().stack);
    eltBackground.innerHTML = "";
    var level = levels[i++];
    var engine = new Circular.Engine();
    engine.addEventListener("levelComplete", loop);
    level.start(engine);
    engine.run(level);
  };
  window.setTimeout(loop, 0);
};

run();

})();