/* ============================================================
   Mo's Barbershop — heftig 3D-bakgrunn i heroen
   Hovedstang + dybde-stenger, gull-ring, svevende støv,
   animert farget lys, muse-parallax og lett scroll-respons.
   Avgrenset til hero-boksen (pauser når du scroller forbi).
   Merkefarger. Three.js r128.
   ============================================================ */
(function () {
  "use strict";
  var canvas = document.getElementById("gl");
  var stage = document.getElementById("poleStage");
  if (!canvas || !stage || typeof THREE === "undefined") return;

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function box() { return { w: stage.clientWidth || innerWidth, h: stage.clientHeight || innerHeight }; }

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xf4ead4, 0.035);

  var camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
  camera.position.set(0, 0, 12);

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); }
  catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));

  /* lys */
  scene.add(new THREE.AmbientLight(0xffffff, 0.78));
  var key = new THREE.DirectionalLight(0xffffff, 0.85); key.position.set(5, 8, 9); scene.add(key);
  var red = new THREE.PointLight(0xc0432f, 1.3, 30); scene.add(red);     // animeres
  var blue = new THREE.PointLight(0x3f6fae, 1.1, 30); scene.add(blue);   // animeres

  /* delt stripetekstur */
  function stripes() {
    var c = document.createElement("canvas"); c.width = c.height = 128;
    var g = c.getContext("2d"), cols = ["#c0432f", "#f4ead4", "#20364e", "#f4ead4"], h = 32;
    for (var i = 0; i < 4; i++) { g.fillStyle = cols[i]; g.fillRect(0, i * h, 128, h); }
    var tx = new THREE.CanvasTexture(c); tx.anisotropy = 4; tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.rotation = Math.PI / 4; tx.center.set(0.5, 0.5); return tx;
  }
  var metal = new THREE.MeshStandardMaterial({ color: 0xc8cdd2, roughness: 0.28, metalness: 0.92 });

  /* bygg en barberstang (egen tekstur per stang for uavhengig spinn) */
  function makePole(h) {
    var g = new THREE.Group();
    var tex = stripes(); tex.repeat.set(1, h / 1.0);
    g.userData.tex = tex;
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(1, 1, h, 56, 1, true),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.42, metalness: 0.06 })));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.06, 1.06, h, 56, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, roughness: 0.08, metalness: 0.3, side: THREE.DoubleSide })));
    [h / 2 + 0.18, -h / 2 - 0.18].forEach(function (y) {
      var cap = new THREE.Group();
      cap.add(new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.5, 40), metal));
      var dome = new THREE.Mesh(new THREE.SphereGeometry(1.18, 28, 14, 0, 6.2832, 0, Math.PI / 2), metal);
      dome.position.y = 0.25; cap.add(dome);
      cap.position.y = y; if (y < 0) cap.rotation.x = Math.PI; g.add(cap);
    });
    return g;
  }

  /* hovedstang — sentrert-høyre */
  var main = makePole(5);
  main.position.set(2.6, 0, 0); main.rotation.z = 0.12; main.scale.setScalar(1.05);
  scene.add(main);

  /* dybde-stenger bak (parallax + dybde) */
  var back1 = makePole(4); back1.position.set(-3.2, 1.2, -6); back1.rotation.z = -0.2; back1.scale.setScalar(0.8); scene.add(back1);
  var back2 = makePole(3.4); back2.position.set(5.4, -2.4, -9); back2.rotation.z = 0.26; back2.scale.setScalar(0.7); scene.add(back2);

  /* gull-ring rundt hovedstangen */
  var ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.05, 16, 150),
    new THREE.MeshStandardMaterial({ color: 0xc9a14a, roughness: 0.25, metalness: 1 }));
  ring.position.copy(main.position); ring.rotation.x = Math.PI / 2.3; scene.add(ring);

  /* svevende støv (navy, diskret på krem) */
  var N = reduced ? 120 : 520, pos = new Float32Array(N * 3);
  for (var i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 26;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 14 - 2;
  }
  var pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  var dust = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x20364e, size: 0.04, transparent: true, opacity: 0.35, depthWrite: false }));
  scene.add(dust);

  /* scroll (hero-relativ) + mus */
  var raw = 0, spL = 0, mx = 0, my = 0, cmx = 0, cmy = 0;
  function onScroll() { raw = Math.min(Math.max(scrollY / innerHeight, 0), 1); }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("mousemove", function (e) { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
  onScroll();

  function resize() {
    var b = box();
    renderer.setSize(b.w, b.h, false);
    camera.aspect = b.w / b.h; camera.updateProjectionMatrix();
    var mobile = b.w < 720;
    main.position.x = mobile ? 0.2 : 2.6;
    main.scale.setScalar(mobile ? 0.82 : 1.05);
    ring.position.x = main.position.x; ring.scale.setScalar(mobile ? 0.78 : 1);
  }
  addEventListener("resize", resize); resize();

  var clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (document.hidden || scrollY > innerHeight * 1.15) return; // pauser forbi heroen
    var t = clock.getElapsedTime();
    spL += (raw - spL) * 0.08;
    cmx += (mx - cmx) * 0.05; cmy += (my - cmy) * 0.05;

    /* spinnende stenger */
    if (!reduced) {
      main.userData.tex.offset.y -= 0.006 + spL * 0.02;
      back1.userData.tex.offset.y -= 0.004;
      back2.userData.tex.offset.y -= 0.003;
    }
    main.rotation.y = t * 0.3 + cmx * 0.4;
    back1.rotation.y = t * 0.22; back2.rotation.y = -t * 0.18;
    main.position.y = spL * 1.6;                 // stiger litt ved scroll
    ring.position.y = main.position.y;
    ring.rotation.z = t * 0.15; ring.scale.setScalar((main.position.x === 0.2 ? 0.78 : 1) * (1 + spL * 0.3));

    /* støv driver, kamera-parallax */
    dust.rotation.y = t * 0.03; dust.position.y = Math.sin(t * 0.3) * 0.3 + spL * 1.2;
    camera.position.x += (cmx * 1.4 - camera.position.x) * 0.05;
    camera.position.y += (-cmy * 1.0 - camera.position.y) * 0.05;
    camera.lookAt(main.position.x * 0.4, main.position.y * 0.5, 0);

    /* animert farget lys for liv i metallet */
    red.position.set(Math.sin(t * 0.7) * 6 + main.position.x, Math.cos(t * 0.5) * 4, 5);
    blue.position.set(Math.cos(t * 0.6) * -6, Math.sin(t * 0.8) * 4, 4);

    renderer.render(scene, camera);
  }
  frame();
})();
