/**
 * Device configuration
 */
(function() {

"use strict";

var console = window.console;

var Config = {
  init: function(eltCanvas) {
    var adjustSizeInProgress = null;
    var adjustSizeHelper = function adjustSizeHelper() {
      var backgroundRect = eltCanvas.getBoundingClientRect();
      var width = Math.round(backgroundRect.width);
      var height = Math.round(backgroundRect.height);
      var diagonal =  Math.sqrt(width * width, height * height);
      eltCanvas.setAttribute("width", width);
      eltCanvas.setAttribute("height", height);
      adjustSizeInProgress = null;
      Config.width = width;
      Config.height = height;
      Config.diagonal = diagonal;
      var set = listeners[":screenChanged"];
      set.forEach(function(listener) {
          listener();
      });
    };
    var adjustSize = function adjustSize() {
      if (adjustSizeInProgress) {
        return;
      }
      adjustSizeInProgress = window.setTimeout(adjustSizeHelper, 70);
    };
    adjustSizeHelper();
    window.addEventListener("resize", adjustSize);
  },
  addEventListener: function addEventListener(kind, listener) {
    var set = listeners[":" + kind];
    if (set == null) {
      throw new Error("Event kind " + kind + " does not exist");
    }
    if (set.indexOf(listener) == -1) {
      set.push(listener);
    }
    listener();
  },
  removeEventListener: function removeEventListener(kind, listener) {
    var set = listeners[":" + kind];
    if (set == null) {
      throw new Error("Event kind " + kind + " does not exist");
    }
    var index = set.indexOf(listener);
    if (index != -1) {
      delete set[index];
    }
  },
  width: 0,
  height: 0,
  diagonal: 0
};


var listeners = {
  ":screenChanged": []
};

// Export
if (!("Circular" in window)) {
  window.Circular = {};
}
window.Circular.Config = Config;

})();