(function() {
var Statistics = {
  fps: new Stats(),
};

Statistics.fps.setMode(0); // 0: fps, 1: ms

Statistics.fps.domElement.style.position = 'absolute';
Statistics.fps.domElement.style.left = '0px';
Statistics.fps.domElement.style.top = '0px';

document.body.appendChild( Statistics.fps.domElement );


if (!("Circular" in window)) {
  window.Circular = {};
}
window.Circular.Statistics = Statistics;
})();