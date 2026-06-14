/* ============================================================
   Mo's Barbershop — 3D hero (lett tema, til en viss grad)
   Én forseggjort barberstang i merkevarens farger (marineblå/
   rød/krem) på kremfarget scene. Avgrenset til heroen, dempet
   og smooth. Three.js r128.
   ============================================================ */
(function () {
  "use strict";
  var canvas = document.getElementById("gl");
  var stage = document.getElementById("heroStage");
  if (!canvas || !stage || typeof THREE === "undefined") return;

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function size() { return { w: stage.clientWidth, h: stage.clientHeight }; }

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); }
  catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));

  /* lyst, mykt lys */
  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  var key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(4, 8, 9); scene.add(key);
  var fill = new THREE.DirectionalLight(0xcfe0ff, 0.4); fill.position.set(-6, -2, 4); scene.add(fill);

  /* myk kontaktskygge under stangen */
  var shadow = new THREE.Sprite(new THREE.SpriteMaterial({ map: soft(), color: 0x20364e, transparent: true, opacity: 0.18, depthWrite: false }));
  shadow.scale.set(7, 2.4, 1); shadow.position.set(0, -3.5, -1); scene.add(shadow);

  /* barberstang i merkefarger */
  var pole = new THREE.Group();
  var tex = stripes(); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 5); tex.rotation = Math.PI / 4; tex.center.set(0.5, 0.5);

  pole.add(new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 5, 64, 1, true),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.42, metalness: 0.05 })
  ));
  // tynt glassaktig ytterlag
  pole.add(new THREE.Mesh(
    new THREE.CylinderGeometry(1.06, 1.06, 5, 64, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.08, metalness: 0.3, side: THREE.DoubleSide })
  ));
  // børstet metall-endestykker
  var metal = new THREE.MeshStandardMaterial({ color: 0xb8c0c8, roughness: 0.3, metalness: 0.9 });
  [2.7, -2.7].forEach(function (y) {
    var cap = new THREE.Group();
    cap.add(new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 0.55, 48), metal));
    var dome = new THREE.Mesh(new THREE.SphereGeometry(1.16, 32, 16, 0, 6.2832, 0, Math.PI / 2), metal);
    dome.position.y = 0.27; cap.add(dome);
    cap.position.y = y; if (y < 0) cap.rotation.x = Math.PI;
    pole.add(cap);
  });
  pole.rotation.z = 0.12;
  scene.add(pole);

  /* scroll (hero-relativ) + mus, dempet */
  var sp = 0, spL = 0, mx = 0, my = 0, cmx = 0, cmy = 0;
  function onScroll() { sp = Math.min(Math.max(scrollY / innerHeight, 0), 1); }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("mousemove", function (e) { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
  onScroll();

  function resize() {
    var s = size();
    renderer.setSize(s.w, s.h, false);
    camera.aspect = s.w / s.h; camera.updateProjectionMatrix();
    pole.scale.setScalar(s.w < 720 ? 0.86 : 1);
  }
  addEventListener("resize", resize); resize();

  var clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (scrollY > innerHeight * 1.15) return; // pause forbi hero
    var t = clock.getElapsedTime();
    spL += (sp - spL) * 0.08;
    cmx += (mx - cmx) * 0.06; cmy += (my - cmy) * 0.06;

    if (!reduced) tex.offset.y -= 0.005 + spL * 0.014;
    pole.rotation.y = t * 0.28 + spL * 2 + cmx * 0.35;
    pole.rotation.z = 0.12 + cmy * 0.05;
    pole.position.y = spL * 0.5;
    camera.position.x += (cmx * 0.9 - camera.position.x) * 0.06;
    camera.position.y += (-cmy * 0.6 - camera.position.y) * 0.06;
    camera.lookAt(0, pole.position.y, 0);
    shadow.material.opacity = 0.18 - spL * 0.1;

    renderer.render(scene, camera);
  }
  frame();

  function stripes() {
    var c = document.createElement("canvas"); c.width = c.height = 128;
    var g = c.getContext("2d");
    var cols = ["#c0432f", "#f4ead4", "#20364e", "#f4ead4"], h = 32;
    for (var i = 0; i < 4; i++) { g.fillStyle = cols[i]; g.fillRect(0, i * h, 128, h); }
    var tx = new THREE.CanvasTexture(c); tx.anisotropy = 4; return tx;
  }
  function soft() {
    var c = document.createElement("canvas"); c.width = c.height = 128;
    var g = c.getContext("2d"), grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(0,0,0,1)"); grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c);
  }
})();
