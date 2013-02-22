(function() {
var Statistics = {
  fps: new Stats(),
  ms: new Stats()
};

Statistics.fps.setMode(0); // 0: fps, 1: ms

Statistics.fps.domElement.style.position = 'absolute';
Statistics.fps.domElement.style.left = '0px';
Statistics.fps.domElement.style.top = '0px';

document.body.appendChild( Statistics.fps.domElement );

Statistics.ms.setMode(1); // 0: fps, 1: ms

Statistics.ms.domElement.style.position = 'absolute';
Statistics.ms.domElement.style.left = '80px';
Statistics.ms.domElement.style.top = '0px';

document.body.appendChild( Statistics.ms.domElement );

if (!("Circular" in window)) {
  window.Circular = {};
}
window.Circular.Statistics = Statistics;
})();