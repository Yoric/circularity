// Must be loaded after levels.js and engine.js
(function() {

var console = window.console;
var Circular = window.Circular;

var levels = Circular.levels;

var db;

var credits = function credits(cb) {
  var engine = new Circular.Engine();
  engine.showText(
    ["The pull was strong. The Circularity had taken us.",
     "We had to escape."], cb);
};

var menu = function menu() {
  var eltMenu = document.getElementById("menu");
  var gotoLevel = function gotoLevel(i) {
    return function() {
      console.log("Moving to level", i);
      eltMenu.classList.remove("shown");
      eltMenu.classList.add("hidden");
      eltMenu.addEventListener("transitionend", function() {
        eltMenu.innerHTML = "";
      });
      nextLevel = i;
      loop();
    };
  };

  eltMenu.innerHTML = "";
  eltMenu.classList.remove("hidden");
  eltMenu.classList.add("shown");
  var list = document.createElement("ul");
  var number = 0;
  var li;
  for (var i = 0; i < levels.length; ++i) {
    var level = levels[i];
    if (!level.unlocked) {
      continue;
    }
    ++number;
    li = document.createElement("li");
    li.textContent = level.toString();
    li.classList.add("unlocked");
    li.classList.add("hidden");
    li.classList.add("mayappear");
    li.addEventListener("click", gotoLevel(i));
    list.appendChild(li);
    window.setTimeout((function(li) {
      return function() {
        li.classList.add("shown");
        li.classList.remove("hidden");
      };
    })(li), i * 100);
  }
//  if (number == 1) {
//    gotoLevel(0)();
//    return;
//  }
  li = document.createElement("li");
  li.addEventListener("click", gotoLevel(0));
  li.textContent = "(continue)";
  li.classList.add("locked");
  li.classList.add("hidden");
  li.classList.add("mayappear");
  window.setTimeout((function(li) {
    return function() {
      li.classList.add("shown");
      li.classList.remove("hidden");
    };
  })(li), i * 100);
  list.appendChild(li);
  eltMenu.appendChild(list);
};

var nextLevel = -1;
var eltBackground = document.getElementById("background");
var loop = function loop() {
  console.log("Loop", "level", nextLevel, "from", levels.length, new Error().stack);
  eltBackground.innerHTML = "";
  var level = levels[nextLevel];
  var engine = new Circular.Engine();
  engine.addEventListener("levelComplete", function(event) {
    if (event.victory) {
      if ("nextLevel" in event) {
        nextLevel = event.nextLevel;
      } else {
        ++nextLevel;
      }
      loop();
    } else {
      engine.showText("We went too deep and the pull of the Circularity was too strong. There was no escape.");
    }
  });
  level.start(engine);
  engine.run(level);
};

var run = function run() {
  // Starting credits
  console.log("Running, with nextLevel", nextLevel);
  if (nextLevel < 0) {
    credits(menu);
  } else {
    window.setTimeout(loop, 0);
  }
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
          nextLevel = parseInt(arg.substr("level=".length));
          console.log("Start level set to", nextLevel);
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