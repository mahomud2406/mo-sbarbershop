/* ============================================================
   Mo's Barbershop — 3D barberstang som følger scroll
   Fullskjerm, gjennomsiktig lerret. Selve stangen flyttes i 3D:
   øverst sitter den til høyre i heroen, og når du scroller glir
   den smooth opp i øvre høyre hjørne og blir der. Merkefarger,
   dempet, til en viss grad. Three.js r128.
   ============================================================ */
(function () {
  "use strict";
  var canvas = document.getElementById("gl");
  if (!canvas || typeof THREE === "undefined") return;

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, 12);

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); }
  catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);

  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  var key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(4, 8, 9); scene.add(key);
  var fill = new THREE.DirectionalLight(0xcfe0ff, 0.4); fill.position.set(-6, -2, 4); scene.add(fill);

  /* barberstang i merkefarger */
  var pole = new THREE.Group();
  var tex = stripes(); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 5); tex.rotation = Math.PI / 4; tex.center.set(0.5, 0.5);

  pole.add(new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 5, 64, 1, true),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.42, metalness: 0.05 })
  ));
  pole.add(new THREE.Mesh(
    new THREE.CylinderGeometry(1.06, 1.06, 5, 64, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.08, metalness: 0.3, side: THREE.DoubleSide })
  ));
  var metal = new THREE.MeshStandardMaterial({ color: 0xb8c0c8, roughness: 0.3, metalness: 0.9 });
  [2.7, -2.7].forEach(function (y) {
    var cap = new THREE.Group();
    cap.add(new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 0.55, 48), metal));
    var dome = new THREE.Mesh(new THREE.SphereGeometry(1.16, 32, 16, 0, 6.2832, 0, Math.PI / 2), metal);
    dome.position.y = 0.27; cap.add(dome);
    cap.position.y = y; if (y < 0) cap.rotation.x = Math.PI;
    pole.add(cap);
  });
  pole.rotation.z = 0.1;
  scene.add(pole);

  /* scroll (hele sidens progresjon) + mus */
  var raw = 0, spL = 0, mx = 0, my = 0, cmx = 0, cmy = 0, railPx = 64;
  function onScroll() { var max = document.documentElement.scrollHeight - innerHeight; raw = max > 0 ? Math.min(Math.max(scrollY / max, 0), 1) : 0; }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("mousemove", function (e) { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
  onScroll();

  function resize() {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    railPx = parseFloat(getComputedStyle(document.body).paddingRight) || 64;
  }
  addEventListener("resize", resize);
  resize();

  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  var clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    var t = clock.getElapsedTime();
    spL += (raw - spL) * 0.1;          // mykt etterslep => smooth «loading»
    var p = spL;                        // lineær med scroll, som en progress
    cmx += (mx - cmx) * 0.06; cmy += (my - cmy) * 0.06;

    /* synlig ramme ved z=0 */
    var halfH = Math.tan((camera.fov * Math.PI / 180) / 2) * camera.position.z;
    var halfW = halfH * camera.aspect;
    var pxPerWorld = innerWidth / (2 * halfW);

    /* stangen lever i sin egen reserverte «skinne» helt til høyre — dekker aldri innhold */
    var screenX = innerWidth - railPx / 2;
    pole.position.x = (screenX / innerWidth * 2 - 1) * halfW;
    pole.position.y = lerp(halfH * 0.82, -halfH * 0.82, p);              // topp -> bunn med scroll
    pole.scale.setScalar((railPx * 0.40) / (1.2 * pxPerWorld));          // fyller skinnen pent

    if (!reduced) tex.offset.y -= 0.006 + p * 0.012;
    pole.rotation.y = t * 0.5 + p * 4;        // spinner, og raskere jo lenger du har scrollet
    pole.rotation.z = 0.08;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  frame();

  function stripes() {
    var c = document.createElement("canvas"); c.width = c.height = 128;
    var g = c.getContext("2d"), cols = ["#c0432f", "#f4ead4", "#20364e", "#f4ead4"], h = 32;
    for (var i = 0; i < 4; i++) { g.fillStyle = cols[i]; g.fillRect(0, i * h, 128, h); }
    var tx = new THREE.CanvasTexture(c); tx.anisotropy = 4; return tx;
  }
})();
