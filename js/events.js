/**
 * A minimal library for handling custom event listeners
 */
(function events() {

"use strict";

var Emitter = function Emitter(kinds) {
  this._listeners = {};
  kinds.forEach((function(kind) {
    this._listeners[":" + kind] = [];
  }).bind(this));
};
Emitter.prototype = {
  addEventListener: function addEventListener(kind, listener) {
    var set = this._listeners[":" + kind];
    if (set == null) {
      throw new Error("Event kind " + kind + " does not exist");
    }
    if (set.indexOf(listener) == -1) {
      set.push(listener);
    }
  },
  removeEventListener: function removeEventListener(kind, listener) {
    var set = this._listeners[":" + kind];
    if (set == null) {
      throw new Error("Event kind " + kind + " does not exist");
    }
    var index = set.indexOf(listener);
    if (index != -1) {
      delete set[index];
    }
  },
  fireEvent: function fireEvent(kind, event) {
    var set = this._listeners[":" + kind];
    if (set == null) {
      console.log(new Error().stack);
      throw new Error("Event kind " + kind + " does not exist");
    }
    window.setTimeout(function() {
      set.forEach(function(listener) {
        listener(event);
      });
    });
  }
};

// Configure
var Circular;
if ("Circular" in window) {
  Circular = window.Circular;
} else {
  Circular = window.Circular = {};
}
Circular.Emitter = Emitter;

console.log("Initializing events", "done");
})();