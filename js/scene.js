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

  /* scroll + mus */
  var raw = 0, spL = 0, mx = 0, my = 0, cmx = 0, cmy = 0;
  function onScroll() { raw = Math.min(Math.max(scrollY / (innerHeight * 0.85), 0), 1); }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("mousemove", function (e) { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
  onScroll();

  function resize() {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }
  addEventListener("resize", resize);

  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  var clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    var t = clock.getElapsedTime();
    spL += (raw - spL) * 0.09;
    var p = ease(spL);
    cmx += (mx - cmx) * 0.06; cmy += (my - cmy) * 0.06;

    /* synlig ramme ved z=0 -> regn ut hjørne-koordinater */
    var halfH = Math.tan((camera.fov * Math.PI / 180) / 2) * camera.position.z;
    var halfW = halfH * camera.aspect;
    var mobile = innerWidth < 760;

    // p=0: liten accent oppe til høyre (ikke i veien) · p=1: pinnet i hjørnet
    var x0 = halfW * (mobile ? 0.52 : 0.60), y0 = halfH * (mobile ? 0.52 : 0.36), s0 = mobile ? 0.34 : 0.50;
    var x1 = halfW * (mobile ? 0.64 : 0.78), y1 = halfH * 0.66, s1 = mobile ? 0.38 : 0.46;
    var bob = Math.sin(t * 1.2) * (1 - p) * 0.08;

    pole.position.x = lerp(x0, x1, p);
    pole.position.y = lerp(y0, y1, p) + bob;
    pole.scale.setScalar(lerp(s0, s1, p));

    if (!reduced) tex.offset.y -= 0.005 + spL * 0.012;
    pole.rotation.y = t * 0.3 + spL * 1.4 + cmx * 0.3;
    pole.rotation.z = 0.1 + cmy * 0.04;
    camera.position.x += (cmx * 0.5 - camera.position.x) * 0.05;
    camera.lookAt(camera.position.x, 0, 0);

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
