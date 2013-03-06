/**
 * A minimal library for waiting until a number of conditions are fulfilled
 */
(function blocker() {

"use strict";

// Configure
var Circular;
if ("Circular" in window) {
  Circular = window.Circular;
} else {
  Circular = window.Circular = {};
}

var Blocker = function Blocker() {
  Circular.Emitter.call(this, ["ready"]);
  this._blocks = {};
  this._size = 0;
};
Blocker.prototype = {
  __proto__: Object.create(Circular.Emitter.prototype),
  addEventListener: function addEventListener(kind, listener) {
    Blocker.prototype.__proto__.addEventListener.call(this, kind, listener);
    if (kind == "ready") {
      if (this._size == 0) {
        window.setTimeout(function() {
          listener("ready");
        });
      }
    }
  },
  add: function add(blocker) {
    var key = ":" + blocker;
    if (key in this._blocks) {
      throw new Error("Blocker " + blocker + " already present");
    }
    this._blocks[key] = true;
    ++this._size;
  },
  remove: function remove(blocker) {
    var key = ":" + blocker;
    if (!(key in this._blocks)) {
      throw new Error("Blocker " + blocker + " not present");
    }
    delete this._blocks[key];
    if (--this._size == 0) {
      this.fireEvent("ready");
    }
  }
};

Circular.Blocker = Blocker;

})();