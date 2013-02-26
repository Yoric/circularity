/**
 * Device configuration
 */
(function() {

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
      if (listeners) {
        for (var listener of listeners) {
          listener();
        }
      }
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
    listeners.add(listener);
    listener();
  },
  removeEventListener: function removeEventListener(kind, listener) {
    listeners.remove(listener);
  },
  width: 0,
  height: 0,
  diagonal: 0
};

var listeners = new Set();

// Export
if (!("Circular" in window)) {
  window.Circular = {};
}
window.Circular.Config = Config;

})();