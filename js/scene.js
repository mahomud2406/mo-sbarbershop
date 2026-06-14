/* ============================================================
   Hero 3D-scene — roterende barberstang + svevende partikler
   Bygget med Three.js (r128). Faller pent tilbake hvis WebGL mangler.
   ============================================================ */
(function () {
  "use strict";

  var canvas = document.getElementById("three-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0c0c0e, 0.06);

  var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 9);

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (e) {
    return; // WebGL utilgjengelig — CSS-bakgrunnen står igjen
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  /* ---------- Lys ---------- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  var key = new THREE.DirectionalLight(0xffe9c2, 1.1);
  key.position.set(5, 6, 8);
  scene.add(key);
  var rim = new THREE.PointLight(0xc9a14a, 1.4, 30);
  rim.position.set(-6, 2, 4);
  scene.add(rim);

  /* ---------- Barberstang ---------- */
  var pole = new THREE.Group();

  // Stripet sylinder via canvas-tekstur
  var tex = document.createElement("canvas");
  tex.width = 128; tex.height = 128;
  var ctx = tex.getContext("2d");
  var stripeColors = ["#c0392b", "#ffffff", "#2b5fb3", "#ffffff"];
  var sw = tex.height / stripeColors.length;
  for (var i = 0; i < stripeColors.length; i++) {
    ctx.fillStyle = stripeColors[i];
    ctx.fillRect(0, i * sw, tex.width, sw);
  }
  var texture = new THREE.CanvasTexture(tex);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 4);
  // Diagonal forskyvning gir det klassiske spiral-uttrykket
  texture.rotation = Math.PI / 4;
  texture.center.set(0.5, 0.5);

  var bodyGeo = new THREE.CylinderGeometry(1, 1, 4.4, 64, 1, true);
  var bodyMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.35, metalness: 0.1 });
  var body = new THREE.Mesh(bodyGeo, bodyMat);
  pole.add(body);

  // Glassaktig ytre sylinder
  var glassGeo = new THREE.CylinderGeometry(1.08, 1.08, 4.4, 64, 1, true);
  var glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.05, metalness: 0, transparent: true,
    opacity: 0.12, transmission: 0.9, side: THREE.DoubleSide
  });
  pole.add(new THREE.Mesh(glassGeo, glassMat));

  // Krom-endestykker
  var capMat = new THREE.MeshStandardMaterial({ color: 0xd9c79a, roughness: 0.2, metalness: 0.95 });
  function cap(y) {
    var g = new THREE.Group();
    var sphere = new THREE.Mesh(new THREE.SphereGeometry(1.18, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
    var ring = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.45, 48), capMat);
    sphere.position.y = 0.22;
    g.add(ring); g.add(sphere);
    g.position.y = y;
    if (y < 0) g.rotation.x = Math.PI;
    return g;
  }
  pole.add(cap(2.4));
  pole.add(cap(-2.4));

  pole.rotation.z = 0.18;
  pole.position.x = 2.6;
  pole.scale.setScalar(1.05);
  scene.add(pole);

  /* ---------- Partikler ---------- */
  var pCount = 600;
  var pGeo = new THREE.BufferGeometry();
  var pos = new Float32Array(pCount * 3);
  for (var p = 0; p < pCount; p++) {
    pos[p * 3] = (Math.random() - 0.5) * 30;
    pos[p * 3 + 1] = (Math.random() - 0.5) * 20;
    pos[p * 3 + 2] = (Math.random() - 0.5) * 20 - 4;
  }
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  var pMat = new THREE.PointsMaterial({ color: 0xc9a14a, size: 0.045, transparent: true, opacity: 0.6 });
  var particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  /* ---------- Interaksjon ---------- */
  var targetX = 0, targetY = 0, curX = 0, curY = 0;
  window.addEventListener("mousemove", function (e) {
    targetX = (e.clientX / window.innerWidth - 0.5);
    targetY = (e.clientY / window.innerHeight - 0.5);
  });

  // Responsiv plassering: stang sentreres mer på mobil
  function layout() {
    if (window.innerWidth < 760) {
      pole.position.x = 0;
      pole.position.y = 1.4;
      pole.scale.setScalar(0.8);
    } else {
      pole.position.x = 2.6;
      pole.position.y = 0;
      pole.scale.setScalar(1.05);
    }
  }
  layout();

  /* ---------- Render-løkke ---------- */
  var clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();

    // Spiralillusjon: rull teksturen oppover
    if (!prefersReduced) texture.offset.y -= 0.006;

    curX += (targetX - curX) * 0.05;
    curY += (targetY - curY) * 0.05;

    pole.rotation.y = t * 0.25 + curX * 0.6;
    pole.rotation.z = 0.18 + curY * 0.15;

    particles.rotation.y = t * 0.02;
    particles.rotation.x = curY * 0.1;

    camera.position.x += (curX * 1.2 - camera.position.x) * 0.05;
    camera.position.y += (-curY * 0.8 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  animate();

  /* ---------- Resize ---------- */
  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    layout();
  });
})();
