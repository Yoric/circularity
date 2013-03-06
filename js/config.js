/**
 * Device configuration
 */
(function() {

"use strict";

// Configure
var Circular;
if ("Circular" in window) {
  Circular = window.Circular;
} else {
  Circular = window.Circular = {};
}


var console = window.console;

console.log("Initializing config");

var Config = function Config() {
  Circular.Emitter.call(this, ["screenChanged"]);
  this.width = 0;
  this.height = 0;
  this.diagonal = 0;
};

Config.prototype = {
  __proto__: Object.create(Circular.Emitter.prototype),
  addEventListener: function addEventListener(kind, listener) {
    if (!this._initialized) {
      var adjustSizeInProgress = null;
      var adjustSizeHelper = (function adjustSizeHelper() {
        var eltCanvas = document.getElementById("canvas");
        var backgroundRect = eltCanvas.getBoundingClientRect();
        var width = Math.round(backgroundRect.width);
        var height = Math.round(backgroundRect.height);
        var diagonal =  Math.sqrt(width * width, height * height);
        eltCanvas.setAttribute("width", width);
        eltCanvas.setAttribute("height", height);
        adjustSizeInProgress = null;
        this.width = width;
        this.height = height;
        this.diagonal = diagonal;
        this.fireEvent("screenChanged", "init");
      }).bind(this);
      var adjustSize = function adjustSize() {
        if (adjustSizeInProgress) {
          return;
        }
        adjustSizeInProgress = window.setTimeout(adjustSizeHelper, 70);
      };
      adjustSizeHelper();
      window.addEventListener("resize", adjustSize);
      this._initialized = true;
    }
    Config.prototype.__proto__.addEventListener.call(this, kind, listener);
    if (kind == "screenChanged") {
      listener("init");
    }
  },
};


Circular.Config = new Config();

console.log("Initializing config", "done");
})();