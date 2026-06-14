/* ============================================================
   Mo's Barbershop — 3D hero (avgrenset & smooth)
   Barberstangen lever KUN i hero-seksjonen, ikke bak hele siden.
   Optimalisert: lav pixelRatio, ingen dyre materialer, ingen
   per-vertex CPU-løkke, og rendering pauses når hero er ute av syne.
   Three.js r128.
   ============================================================ */
(function () {
  "use strict";
  var canvas = document.getElementById("gl");
  var stage = document.getElementById("heroStage");
  if (!canvas || !stage || typeof THREE === "undefined") return;

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function size() { return { w: stage.clientWidth, h: stage.clientHeight }; }

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); }
  catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));

  /* lys — holdt nede for ytelse */
  scene.add(new THREE.AmbientLight(0xffffff, 0.62));
  var key = new THREE.DirectionalLight(0xffe9c2, 1.25); key.position.set(4, 6, 8); scene.add(key);
  var warm = new THREE.PointLight(0xc9a14a, 1.5, 40); warm.position.set(-6, 2, 6); scene.add(warm);

  /* glød bak stangen */
  var glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radial(), color: 0xc9a14a, transparent: true, opacity: 0.5,
    depthWrite: false, blending: THREE.AdditiveBlending
  }));
  glow.scale.set(13, 13, 1); glow.position.z = -2; scene.add(glow);

  /* barberstang */
  var pole = new THREE.Group();
  var tex = stripes(); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 5); tex.rotation = Math.PI / 4; tex.center.set(0.5, 0.5);

  pole.add(new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 5, 64, 1, true),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.34, metalness: 0.12 })
  ));
  // tynt blankt ytterlag (rimelig — ikke transmission)
  pole.add(new THREE.Mesh(
    new THREE.CylinderGeometry(1.07, 1.07, 5, 64, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0.1, metalness: 0.4, side: THREE.DoubleSide })
  ));
  var chrome = new THREE.MeshStandardMaterial({ color: 0xe6d4a3, roughness: 0.2, metalness: 0.95 });
  [2.72, -2.72].forEach(function (y) {
    var cap = new THREE.Group();
    cap.add(new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.5, 48), chrome));
    var dome = new THREE.Mesh(new THREE.SphereGeometry(1.18, 32, 16, 0, 6.2832, 0, Math.PI / 2), chrome);
    dome.position.y = 0.25; cap.add(dome);
    cap.position.y = y; if (y < 0) cap.rotation.x = Math.PI;
    pole.add(cap);
  });
  pole.rotation.z = 0.14;
  scene.add(pole);

  /* gull-ring */
  var ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.1, 0.04, 14, 140),
    new THREE.MeshStandardMaterial({ color: 0xc9a14a, roughness: 0.25, metalness: 1 })
  );
  ring.rotation.x = Math.PI / 2.3; scene.add(ring);

  /* partikler — animeres KUN via gruppe-rotasjon (ingen CPU-løkke) */
  var N = reduced ? 120 : 460;
  var pos = new Float32Array(N * 3);
  for (var i = 0; i < N; i++) {
    var r = 3 + Math.random() * 6, a = Math.random() * 6.2832, h = (Math.random() - 0.5) * 14;
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = h; pos[i * 3 + 2] = Math.sin(a) * r - 2;
  }
  var pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  var dust = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xc9a14a, size: 0.05, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  /* scroll (hero-relativ 0..1) + mus, begge dempet */
  var sp = 0, spL = 0, mx = 0, my = 0, cmx = 0, cmy = 0;
  function onScroll() { sp = Math.min(Math.max(scrollY / innerHeight, 0), 1); }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("mousemove", function (e) { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
  onScroll();

  function resize() {
    var s = size();
    renderer.setSize(s.w, s.h, false);
    camera.aspect = s.w / s.h; camera.updateProjectionMatrix();
    var m = s.w < 720;
    pole.scale.setScalar(m ? 0.82 : 1);
    glow.scale.setScalar(m ? 10 : 13);
  }
  addEventListener("resize", resize); resize();

  var clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    // pause når hero er ute av syne — sparer CPU og holder resten smooth
    if (scrollY > innerHeight * 1.15) return;

    var t = clock.getElapsedTime();
    spL += (sp - spL) * 0.08;
    cmx += (mx - cmx) * 0.06; cmy += (my - cmy) * 0.06;

    if (!reduced) tex.offset.y -= 0.006 + spL * 0.02;
    pole.rotation.y = t * 0.3 + spL * 3 + cmx * 0.4;
    pole.rotation.z = 0.14 + cmy * 0.06;

    camera.position.x += (cmx * 1.1 - camera.position.x) * 0.06;
    camera.position.y += (-cmy * 0.7 + spL * 0.6 - camera.position.y) * 0.06;
    camera.position.z += ((10 - spL * 1.6) - camera.position.z) * 0.06;
    camera.lookAt(0, 0, 0);

    ring.rotation.z = t * 0.12 + spL;
    ring.scale.setScalar(1 + spL * 0.4);
    dust.rotation.y = t * 0.04 + spL * 0.6;
    glow.material.opacity = 0.42 + Math.sin(t * 1.4) * 0.05 + spL * 0.2;

    renderer.render(scene, camera);
  }
  frame();

  function stripes() {
    var c = document.createElement("canvas"); c.width = c.height = 128;
    var g = c.getContext("2d"), cols = ["#b4322a", "#f6f1e7", "#2b5fb3", "#f6f1e7"], h = 32;
    for (var i = 0; i < 4; i++) { g.fillStyle = cols[i]; g.fillRect(0, i * h, 128, h); }
    var tx = new THREE.CanvasTexture(c); tx.anisotropy = 4; return tx;
  }
  function radial() {
    var c = document.createElement("canvas"); c.width = c.height = 256;
    var g = c.getContext("2d"), grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "rgba(255,225,150,1)"); grad.addColorStop(0.4, "rgba(201,161,74,.5)"); grad.addColorStop(1, "rgba(201,161,74,0)");
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c);
  }
})();
