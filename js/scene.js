/* ============================================================
   Mo's Barbershop — scroll-drevet WebGL-scene
   Ett vedvarende lerret bak hele siden. Kamera, barberstang,
   gull-ring og partikkel-filamenter forvandler seg etter
   hvor langt du har scrollet. Three.js r128.
   ============================================================ */
(function () {
  "use strict";

  var canvas = document.getElementById("gl");
  if (!canvas || typeof THREE === "undefined") return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- grunnoppsett ---------- */
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a0b, 0.055);

  var camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, 9);

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);

  /* ---------- lys ---------- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  var key = new THREE.DirectionalLight(0xffe9c2, 1.2); key.position.set(5, 7, 8); scene.add(key);
  var warm = new THREE.PointLight(0xc9a14a, 1.6, 40); warm.position.set(-7, 3, 5); scene.add(warm);
  var cold = new THREE.PointLight(0x4a6fb3, 0.8, 40); cold.position.set(8, -4, 2); scene.add(cold);

  /* ---------- glød bak stangen ---------- */
  var glowTex = makeGlow();
  var glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: 0xc9a14a, transparent: true, opacity: 0.55,
    depthWrite: false, blending: THREE.AdditiveBlending
  }));
  glow.scale.set(16, 16, 1); glow.position.z = -3;
  scene.add(glow);

  /* ---------- barberstang ---------- */
  var pole = new THREE.Group();

  var stripeTex = makeStripes();
  stripeTex.wrapS = stripeTex.wrapT = THREE.RepeatWrapping;
  stripeTex.repeat.set(1, 5);
  stripeTex.rotation = Math.PI / 4;
  stripeTex.center.set(0.5, 0.5);

  var body = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 5, 80, 1, true),
    new THREE.MeshStandardMaterial({ map: stripeTex, roughness: 0.32, metalness: 0.12 })
  );
  pole.add(body);

  var glass = new THREE.Mesh(
    new THREE.CylinderGeometry(1.09, 1.09, 5, 80, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.04, metalness: 0, transparent: true,
      opacity: 0.1, transmission: 0.9, side: THREE.DoubleSide, clearcoat: 1
    })
  );
  pole.add(glass);

  var chrome = new THREE.MeshStandardMaterial({ color: 0xe6d4a3, roughness: 0.18, metalness: 0.95 });
  [2.7, -2.7].forEach(function (y) {
    var cap = new THREE.Group();
    cap.add(new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 0.5, 56), chrome));
    var dome = new THREE.Mesh(new THREE.SphereGeometry(1.2, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), chrome);
    dome.position.y = 0.25; cap.add(dome);
    cap.position.y = y; if (y < 0) cap.rotation.x = Math.PI;
    pole.add(cap);
  });

  pole.rotation.z = 0.16;
  scene.add(pole);

  /* ---------- gull-ring ---------- */
  var ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.4, 0.045, 16, 160),
    new THREE.MeshStandardMaterial({ color: 0xc9a14a, roughness: 0.25, metalness: 1 })
  );
  ring.rotation.x = Math.PI / 2.2;
  scene.add(ring);

  var ring2 = ring.clone();
  ring2.geometry = new THREE.TorusGeometry(4.6, 0.025, 16, 160);
  ring2.rotation.x = Math.PI / 1.8; ring2.rotation.y = 0.4;
  scene.add(ring2);

  /* ---------- partikkel-filamenter ---------- */
  var N = reduced ? 300 : 1300;
  var pos = new Float32Array(N * 3);
  var seed = new Float32Array(N);
  var base = new Float32Array(N * 3);
  for (var i = 0; i < N; i++) {
    var r = 3 + Math.random() * 9;
    var a = Math.random() * Math.PI * 2;
    var h = (Math.random() - 0.5) * 18;
    base[i * 3] = Math.cos(a) * r;
    base[i * 3 + 1] = h;
    base[i * 3 + 2] = Math.sin(a) * r - 3;
    pos[i * 3] = base[i * 3]; pos[i * 3 + 1] = base[i * 3 + 1]; pos[i * 3 + 2] = base[i * 3 + 2];
    seed[i] = Math.random() * 100;
  }
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  var particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    color: 0xc9a14a, size: 0.05, transparent: true, opacity: 0.7,
    depthWrite: false, blending: THREE.AdditiveBlending
  }));
  scene.add(particles);

  /* ---------- scroll + mus ---------- */
  var sp = 0, spLerp = 0;            // scroll-progresjon 0..1
  var mx = 0, my = 0, cmx = 0, cmy = 0;
  function onScroll() {
    var max = document.documentElement.scrollHeight - innerHeight;
    sp = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("mousemove", function (e) {
    mx = e.clientX / innerWidth - 0.5;
    my = e.clientY / innerHeight - 0.5;
  });
  onScroll();

  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  /* ---------- render-løkke ---------- */
  var clock = new THREE.Clock();
  var posAttr = pGeo.attributes.position;

  function frame() {
    requestAnimationFrame(frame);
    var t = clock.getElapsedTime();
    spLerp += (sp - spLerp) * 0.06;        // mykt etterslep
    var p = ease(spLerp);
    cmx += (mx - cmx) * 0.05; cmy += (my - cmy) * 0.05;

    /* kamera: dukker inn, glir forbi, trekker ut igjen */
    var camZ = 9 - Math.sin(p * Math.PI) * 5.2;        // 9 -> ~3.8 -> 9
    camera.position.z = lerp(camera.position.z, camZ, 0.1);
    camera.position.x = lerp(camera.position.x, cmx * 1.6 + Math.sin(p * 6.28) * 1.5, 0.08);
    camera.position.y = lerp(camera.position.y, -cmy * 1.1 + p * 2 - 1, 0.08);
    camera.lookAt(0, p * 1.2 - 0.6, 0);

    /* stang: roterer raskere og vrir seg når du scroller */
    if (!reduced) stripeTex.offset.y -= 0.004 + p * 0.03;
    pole.rotation.y = t * 0.25 + p * 8 + cmx * 0.5;
    pole.rotation.z = 0.16 + Math.sin(p * Math.PI) * 0.5;
    pole.position.x = lerp(0, -2.4, p);
    pole.scale.setScalar(lerp(1, 1.3, Math.sin(p * Math.PI)));

    /* ringer */
    ring.rotation.z = t * 0.1 + p * 3;
    ring2.rotation.z = -t * 0.08 - p * 2.5;
    ring.scale.setScalar(lerp(1, 1.8, p));
    ring2.scale.setScalar(lerp(1, 0.5, p));

    /* glød pulserer og varmes opp med scroll */
    glow.material.opacity = 0.4 + Math.sin(t * 1.5) * 0.06 + p * 0.25;
    glow.scale.setScalar(lerp(16, 26, p));

    /* fog skifter temperatur */
    scene.fog.color.setRGB(
      lerp(0.04, 0.10, Math.sin(p * Math.PI)),
      lerp(0.04, 0.07, Math.sin(p * Math.PI)),
      lerp(0.043, 0.05, Math.sin(p * Math.PI))
    );

    /* partikler: virvler og spres utover ved scroll */
    var spread = 1 + p * 0.7;
    for (var i = 0; i < N; i++) {
      var s = seed[i];
      var sway = Math.sin(t * 0.5 + s) * 0.4;
      posAttr.array[i * 3]     = base[i * 3] * spread + sway;
      posAttr.array[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.3 + s) * 0.3 + p * 2;
      posAttr.array[i * 3 + 2] = base[i * 3 + 2] * spread + Math.cos(t * 0.4 + s) * 0.4;
    }
    posAttr.needsUpdate = true;
    particles.rotation.y = t * 0.03 + p * 1.5;
    particles.material.opacity = 0.5 + p * 0.3;

    renderer.render(scene, camera);
  }
  frame();

  /* ---------- responsiv plassering ---------- */
  function layout() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    var mobile = innerWidth < 760;
    pole.scale.setScalar(mobile ? 0.72 : 1);
    glow.scale.setScalar(mobile ? 12 : 16);
  }
  addEventListener("resize", layout); layout();

  /* ---------- tekstur-hjelpere ---------- */
  function makeStripes() {
    var c = document.createElement("canvas"); c.width = c.height = 128;
    var g = c.getContext("2d");
    var cols = ["#b4322a", "#f6f1e7", "#2b5fb3", "#f6f1e7"];
    var h = c.height / cols.length;
    for (var i = 0; i < cols.length; i++) { g.fillStyle = cols[i]; g.fillRect(0, i * h, c.width, h); }
    var tx = new THREE.CanvasTexture(c); tx.anisotropy = 4; return tx;
  }
  function makeGlow() {
    var c = document.createElement("canvas"); c.width = c.height = 256;
    var g = c.getContext("2d");
    var grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "rgba(255,225,150,1)");
    grad.addColorStop(0.4, "rgba(201,161,74,0.5)");
    grad.addColorStop(1, "rgba(201,161,74,0)");
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }
})();
