/* ============================================================
   Mo's Barbershop — 3D «reise» gjennom salongen
   Kamera flyr nedover midtgangen fra stol til stol mens du
   scroller. Lavpoly barbershop: gulv, vegger, speil, stoler,
   barberstenger, varmt lys. Merkefarger. Three.js r128.
   ============================================================ */
(function () {
  "use strict";
  var canvas = document.getElementById("gl");
  var journey = document.querySelector(".journey");
  if (!canvas || typeof THREE === "undefined") return;

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var scene = new THREE.Scene();
  scene.background = null;
  scene.fog = new THREE.Fog(0xf1e7d0, 14, 46);

  var camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 120);
  camera.position.set(0, 0.6, 12);

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); }
  catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(innerWidth, innerHeight);

  /* ---------- materialer ---------- */
  var matFloor = new THREE.MeshStandardMaterial({ color: 0xded2b6, roughness: 0.85, metalness: 0.05 });
  var matWall  = new THREE.MeshStandardMaterial({ color: 0xf2e8d2, roughness: 0.95 });
  var matWall2 = new THREE.MeshStandardMaterial({ color: 0xb89a6a, roughness: 0.9 }); // murvegg-tone
  var matNavy  = new THREE.MeshStandardMaterial({ color: 0x20364e, roughness: 0.55, metalness: 0.2 });
  var matLeather = new THREE.MeshStandardMaterial({ color: 0x1b2c40, roughness: 0.5, metalness: 0.15 });
  var matChrome = new THREE.MeshStandardMaterial({ color: 0xc8cdd2, roughness: 0.25, metalness: 0.95 });
  var matMirror = new THREE.MeshStandardMaterial({ color: 0xbcd0de, roughness: 0.12, metalness: 0.6 });
  var matGlow   = new THREE.MeshBasicMaterial({ color: 0xfff2d6 });

  /* ---------- rom ---------- */
  var AISLE_LEN = 60;
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(16, AISLE_LEN), matFloor);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -2, -22); scene.add(floor);

  var ceil = new THREE.Mesh(new THREE.PlaneGeometry(16, AISLE_LEN), matWall);
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 5, -22); scene.add(ceil);

  var wallL = new THREE.Mesh(new THREE.PlaneGeometry(AISLE_LEN, 7), matWall2);
  wallL.rotation.y = Math.PI / 2; wallL.position.set(-5.5, 1.5, -22); scene.add(wallL);
  var wallR = new THREE.Mesh(new THREE.PlaneGeometry(AISLE_LEN, 7), matWall);
  wallR.rotation.y = -Math.PI / 2; wallR.position.set(5.5, 1.5, -22); scene.add(wallR);

  var backWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), matWall);
  backWall.position.set(0, 1.5, -52); scene.add(backWall);

  /* ---------- stripetekstur til barberstenger ---------- */
  function stripeTex() {
    var c = document.createElement("canvas"); c.width = c.height = 64;
    var g = c.getContext("2d"), cols = ["#c0432f", "#f4ead4", "#20364e", "#f4ead4"];
    for (var i = 0; i < 4; i++) { g.fillStyle = cols[i]; g.fillRect(0, i * 16, 64, 16); }
    var tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.repeat.set(1, 4); tx.rotation = Math.PI / 4; tx.center.set(.5, .5); return tx;
  }
  var poleTextures = [];

  /* ---------- byggeklosser ---------- */
  function chair(x, z, faceRight) {
    var g = new THREE.Group();
    var seat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.34, 1.5), matLeather); seat.position.y = 0; g.add(seat);
    var back = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.7, 0.28), matLeather); back.position.set(0, 0.95, -0.6); g.add(back);
    var head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.22), matLeather); head.position.set(0, 1.95, -0.6); g.add(head);
    [-0.82, 0.82].forEach(function (ax) {
      var arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 1.3), matChrome); arm.position.set(ax, 0.4, 0.05); g.add(arm);
    });
    var col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 1.7, 18), matChrome); col.position.y = -1.05; g.add(col);
    var disc = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.12, 26), matChrome); disc.position.y = -1.9; g.add(disc);
    var foot = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.5), matChrome); foot.position.set(0, -0.7, 0.95); g.add(foot);
    g.position.set(x, 0, z);
    g.rotation.y = faceRight ? -Math.PI / 2 + 0.5 : Math.PI / 2 - 0.5; // vendt mot midtgangen
    g.scale.setScalar(0.92);
    scene.add(g);
    return g;
  }

  function station(x, z, faceRight) {
    var wallX = faceRight ? 5.45 : -5.45;
    var ry = faceRight ? -Math.PI / 2 : Math.PI / 2;
    // speil
    var frame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 1.5), matNavy);
    frame.position.set(wallX, 1.2, z); frame.rotation.y = 0; scene.add(frame);
    var mir = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.1), matMirror);
    mir.position.set(wallX + (faceRight ? -0.07 : 0.07), 1.2, z); mir.rotation.y = ry; scene.add(mir);
    // barberstang ved speilet
    var tex = stripeTex(); poleTextures.push(tex);
    var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.5, 20, 1, true),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 }));
    pole.position.set(wallX + (faceRight ? -0.12 : 0.12), 1.2, z + 1.1); scene.add(pole);
    // stol foran speilet
    chair(x, z, faceRight);
  }

  /* rad av stasjoner, vekslende side => kamera vever fra stol til stol */
  var zs = [5, -2, -9, -16, -23, -30, -37];
  for (var i = 0; i < zs.length; i++) station(i % 2 === 0 ? 2.7 : -2.7, zs[i], i % 2 === 0);

  /* taklamper (emissive) */
  for (var L = 0; L < 6; L++) {
    var lamp = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.5), matGlow);
    lamp.position.set(0, 4.9, 4 - L * 8); scene.add(lamp);
  }

  /* ---------- lys ---------- */
  scene.add(new THREE.AmbientLight(0xfff1d8, 0.7));
  var key = new THREE.DirectionalLight(0xffffff, 0.6); key.position.set(3, 8, 6); scene.add(key);
  var warmA = new THREE.PointLight(0xffd9a0, 0.9, 26); warmA.position.set(0, 4, 2); scene.add(warmA);
  var warmB = new THREE.PointLight(0xffd0c0, 0.9, 26); warmB.position.set(0, 4, -16); scene.add(warmB);
  var red = new THREE.PointLight(0xc0432f, 0.7, 22); red.position.set(-3, 2, -24); scene.add(red);

  /* ---------- scroll + mus ---------- */
  var jp = 0, jpL = 0, mx = 0, my = 0, cmx = 0, cmy = 0;
  function journeyProg() {
    if (!journey) return Math.min(scrollY / innerHeight, 1);
    var total = journey.offsetHeight - innerHeight;
    return total > 0 ? Math.min(Math.max(scrollY / total, 0), 1) : 0;
  }
  function onScroll() { jp = journeyProg(); }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("mousemove", function (e) { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
  onScroll();

  function resize() {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }
  addEventListener("resize", resize);

  function lerp(a, b, t) { return a + (b - a) * t; }

  var clock = new THREE.Clock(), last = 0;
  function frame() {
    requestAnimationFrame(frame);
    var t = clock.getElapsedTime();
    jpL += (jp - jpL) * 0.07;
    cmx += (mx - cmx) * 0.05; cmy += (my - cmy) * 0.05;

    // kamera flyr nedover midtgangen, vever mot stolene
    var z = lerp(12, -42, jpL);
    camera.position.x = Math.sin(jpL * Math.PI * 3.1) * 1.7 + cmx * 1.2;
    camera.position.y = 0.6 + Math.sin(jpL * 10) * 0.08 - cmy * 0.8;
    camera.position.z = z;
    camera.lookAt(Math.sin(jpL * Math.PI * 3.1 + 0.6) * 1.4, 0.3, z - 7);

    if (!reduced) for (var i = 0; i < poleTextures.length; i++) poleTextures[i].offset.y -= 0.01;
    red.position.x = Math.sin(t * 0.8) * 3;

    // toner ut når reisen er ferdig, så innholdet under står rent
    var fade = 1 - Math.max(0, (jpL - 0.86) / 0.14);
    canvas.style.opacity = fade;

    // pause når vi er godt forbi reisen
    if (jpL >= 0.999 && fade <= 0.01) { if (last !== -1) { renderer.render(scene, camera); last = -1; } return; }
    last = 0;
    renderer.render(scene, camera);
  }
  frame();
})();
