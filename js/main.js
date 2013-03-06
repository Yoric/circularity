// Must be loaded after levels.js and engine.js
(function() {

var console = window.console;
var Circular = window.Circular;

var requirements = new Circular.Blocker();

// Initialize the database
var indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB;

requirements.add("db");

var db;

var fail = function fail(event) {
  console.log("Could not open database", event);
};

var request = indexedDB.open("circularity", 2);
request.onsuccess = function onsuccess(event) {
  db = event.target.result;
  requirements.remove("db");
};
request.onupgradeneeded = function onupgradeneeded(event) {
  console.log("Updating database");
  var db = event.target.result;
  // Association: level (number) => {unlocked: boolean, best: number}
  db.createObjectStore("levelInfo",
    {keyPath: "level"});
};
request.onfailure = fail;
request.onblocked = fail;


var levels = Circular.levels;

// Opening

var credits = function credits(cb) {
  var engine = new Circular.Engine();
  engine.showText(
    ["The pull was strong. The Circularity had taken us.",
     "We had to escape."], cb);
};

var showTime = function showTime(ms) {
  var totalSeconds = Math.ceil(ms / 1000);
  var totalMinutes = Math.floor(totalSeconds / 60);
  var totalHours = Math.floor(totalHours / 60);
  var text = "";
  var seconds = totalSeconds % 60;
  if (seconds > 0) {
    if (seconds < 10) {
      text += "0" + seconds;
    } else {
      text += seconds;
    }
    text += '"';
  }
  var minutes = totalMinutes % 60;
  if (minutes > 0) {
    if (minutes < 10) {
      text += "0" + minutes;
    } else {
      text += minutes;
    }
    text += "'";
  }
  var hours = totalHours;
  if (hours > 0) {
    text += hours + "h";
  }
  return text;
};

var menu = function menu() {
  console.log("Building menu");
  var transaction = db.
    transaction(["levelInfo"]).
    objectStore("levelInfo");


  var eltMenu = document.getElementById("menu");
  var gotoLevel = function gotoLevel(i) {
    return function() {
      window.setTimeout(function() {
        console.log("Moving to level", i);
        eltMenu.classList.remove("shown");
        eltMenu.classList.add("hidden");
        eltMenu.addEventListener("transitionend", function() {
          eltMenu.innerHTML = "";
        });
        nextLevel = i;
        loop();
      }, 100);
    };
  };

  eltMenu.innerHTML = "";
  eltMenu.classList.remove("hidden");
  eltMenu.classList.add("shown");
  var list = document.createElement("ul");
  var number = 0;
  var furthest = 0;
  var blockers = new Circular.Blocker();
  for (var i = 0; i < levels.length; ++i) {
    console.log("Building menu item for level", i);
    blockers.add(i);
    var request = transaction.get(i);
    request.onsuccess = (function(i){
      console.log("Building onsuccess", i);
      return function onsuccess(event) {
        console.log("Transaction succeeded", i);
        var info = event.target.result;
        var li = document.createElement("li");
        li.classList.add("hidden");
        li.classList.add("mayappear");
        blockers.remove(i);
        if (info == null) {
          console.log("Could not find information on level", i);
          li.textContent = "◦ locked ◦";
        } else {
          console.log("Found information on level", info);
          ++number;
          if (i > furthest) {
            furthest = i;
          }
          var text = " ◦ " + levels[i].toString();
          if (info.time > 0) {
            text += " ⦿ " + showTime(info.time);
          }
          text += " ◦";
          li.textContent = text;
          li.addEventListener("click", gotoLevel(i));
        }
        list.appendChild(li);
        window.setTimeout(function() {
          li.classList.add("shown");
          li.classList.remove("hidden");
        }, (i + 1) * 100);
      };
    })(i);
    request.onerror = (function(i){
      return function onerror(event) {
        console.log("Transaction failed", i, event);
      };
    })(i);
  }

  var eltNewGame = document.createElement("li");
  eltNewGame.classList.add("hidden");
  eltNewGame.classList.add("mayappear");
  eltNewGame.addEventListener("click", gotoLevel(0));
  eltNewGame.textContent = "New Game";
  list.appendChild(eltNewGame);

  window.setTimeout((function(li) {
    return function() {
      li.classList.add("shown");
      li.classList.remove("hidden");
    };
  })(eltNewGame));

  blockers.addEventListener("ready", function() {
    if (number == 1) {
      gotoLevel(0)();
      return;
    }
    eltMenu.appendChild(list);
  });
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
      var currentLevel = nextLevel;
      if ("nextLevel" in event) {
        nextLevel = event.nextLevel;
      } else {
        ++nextLevel;
      }

      var blockers = new Circular.Blocker();

      var store = db.
            transaction(["levelInfo"], "readwrite").
            objectStore("levelInfo");

      // Update best score if necessary
      blockers.add("score");
      var score = engine.timeSinceStart;
      var request = store.get(currentLevel);
      request.onsuccess = function onsuccess(event) {
        if (event.target.result) {
          console.log("Previous best time", event.target.result.time, "current", score);
          if (event.target.result.time == -1 || score < event.target.result.time) {
            console.log("Writing new time");
            store.put({level: currentLevel, time: score});
          }
        } else {
          console.log("First time we beat this level, writing time", score);
          store.put({level: currentLevel, time: score});
        }
        blockers.remove("score");
      };
      request.onerror = function onerror(e) {
        console.log("Could not read level info", currentLevel, e);
        blockers.remove("score");
      };

      // Unlock next level
      blockers.add("unlock");
      request = store.get(nextLevel);
      request.onsuccess = function onsuccess(event) {
        if (event.target.result) {
          console.log("level already unlocked");
          blockers.remove("unlock");
        } else {
          console.log("unlocking level");
          store.put({level: nextLevel, time: -1});
          engine.showText("Entering: " + levels[nextLevel], function() {
            blockers.remove("unlock");
          });
        }
      };
      request.onerror = function onerror(e) {
        console.log("unlocking from error handler");
        store.put({level: nextLevel, time: -1});
        blockers.remove("unlock");
      };

      // Loop
      blockers.addEventListener("ready", loop);
    } else {
      engine.showText(
        ["We went too deep and the pull of the Circularity was too strong. There was no escape.", 2000], menu);
    }
  });
  level.start(engine);
  engine.run(level);
};

var run = function run() {
  console.log("run", "starting");
  requirements.addEventListener("ready", function() {
    console.log("run", "ready");
    if (nextLevel < 0) {
      // Credits, start menu
      credits(menu);
    } else {
      // Go directly to a given level
      window.setTimeout(loop, 0);
    }
  });
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