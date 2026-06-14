/* ============================================================
   Mo's Barbershop — interaksjon
   reveal · ord-animasjon · peek-bilder · horisontalt galleri
   · parallax · magnetiske knapper · cursor · tellere
   ============================================================ */
(function () {
  "use strict";
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- loader ---------- */
  addEventListener("load", function () {
    var l = document.getElementById("loader");
    if (l) setTimeout(function () { l.classList.add("is-done"); }, 1100);
    var hero = document.querySelector(".hero");
    if (hero) requestAnimationFrame(function () { hero.classList.add("is-in"); });
  });

  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();

  /* ---------- cursor ---------- */
  var cur = document.getElementById("cursor"), dot = document.getElementById("cursorDot");
  if (fine && cur && dot) {
    var cx = 0, cy = 0, tx = 0, ty = 0;
    addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = "translate(" + tx + "px," + ty + "px) translate(-50%,-50%)";
    });
    (function loop() {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cur.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll("[data-cursor], a, button").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cur.classList.add("is-active"); });
      el.addEventListener("mouseleave", function () { cur.classList.remove("is-active"); });
    });
  }

  /* ---------- nav / progress / float ---------- */
  var nav = document.getElementById("nav"), prog = document.getElementById("progress"), float = document.getElementById("float");
  function onScroll() {
    var s = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    if (nav) nav.classList.toggle("is-scrolled", s > 40);
    if (prog) prog.style.width = (h > 0 ? (s / h) * 100 : 0) + "%";
    if (float) float.classList.toggle("is-on", s > innerHeight * 0.9);
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- mobilmeny ---------- */
  var burger = document.getElementById("burger"), mob = document.getElementById("mobile");
  if (burger && mob) {
    function tog(open) { mob.classList.toggle("is-open", open); burger.classList.toggle("is-open", open); document.body.style.overflow = open ? "hidden" : ""; }
    burger.addEventListener("click", function () { tog(!mob.classList.contains("is-open")); });
    mob.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { tog(false); }); });
  }

  /* ---------- reveal + ord-animasjon ---------- */
  function observe(sel, cls, opts) {
    var els = document.querySelectorAll(sel);
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add(cls); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add(cls); io.unobserve(en.target); } });
    }, opts || { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (e) { io.observe(e); });
  }
  observe(".reveal", "is-in");
  observe(".manifest", "is-in");
  observe(".philo__title span", "is-in");
  observe(".cta__title span", "is-in");
  // ord i hero settes synlige via .hero.is-in (CSS), men stagger her:
  document.querySelectorAll(".hero .word").forEach(function (w, i) { w.style.transitionDelay = (0.15 + i * 0.07) + "s"; });

  /* ---------- tellere ---------- */
  function count(el) {
    var target = parseFloat(el.dataset.count), dec = parseInt(el.dataset.decimals || "0", 10), suf = el.dataset.suffix || "", start;
    function step(ts) { if (!start) start = ts; var p = Math.min((ts - start) / 1500, 1); var v = target * (1 - Math.pow(1 - p, 3)); el.textContent = (dec ? v.toFixed(dec) : Math.floor(v)) + suf; if (p < 1) requestAnimationFrame(step); else el.textContent = (dec ? target.toFixed(dec) : target) + suf; }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (ents) { ents.forEach(function (en) { if (en.isIntersecting) { count(en.target); cio.unobserve(en.target); } }); }, { threshold: 0.7 });
    counters.forEach(function (e) { cio.observe(e); });
  } else counters.forEach(count);

  /* ---------- peek-bilder på tjenestelisten ---------- */
  var peek = document.getElementById("peek"), peekImg = document.getElementById("peekImg");
  if (fine && peek && peekImg) {
    var px = 0, py = 0, pcx = 0, pcy = 0, peeking = false;
    document.querySelectorAll(".svc").forEach(function (li) {
      li.addEventListener("mouseenter", function () { var src = li.dataset.img; if (src) { peekImg.src = src; peek.classList.add("is-on"); peeking = true; } });
      li.addEventListener("mouseleave", function () { peek.classList.remove("is-on"); peeking = false; });
    });
    addEventListener("mousemove", function (e) { px = e.clientX; py = e.clientY; });
    (function pl() { pcx += (px - pcx) * 0.12; pcy += (py - pcy) * 0.12; if (peeking) peek.style.transform = "translate(" + pcx + "px," + pcy + "px) translate(-50%,-50%)"; requestAnimationFrame(pl); })();
  }

  /* ---------- horisontalt galleri ---------- */
  var gal = document.querySelector(".gallery"), track = document.getElementById("galTrack");
  if (gal && track) {
    function moveGal() {
      var rect = gal.getBoundingClientRect();
      var total = gal.offsetHeight - innerHeight;
      var p = Math.min(Math.max(-rect.top / total, 0), 1);
      var dist = track.scrollWidth - innerWidth;
      track.style.transform = "transl" + "ateX(" + (-p * dist) + "px)";
    }
    addEventListener("scroll", moveGal, { passive: true });
    addEventListener("resize", moveGal); moveGal();
  }

  /* ---------- parallax på showcase-bilde ---------- */
  var showImg = document.getElementById("showImg");
  if (showImg && !reduced) {
    var sc = showImg.closest(".showcase");
    addEventListener("scroll", function () {
      var r = sc.getBoundingClientRect();
      var p = (r.top) / innerHeight; // ~1..-1
      showImg.style.transform = "translateY(" + (p * -8) + "%) scale(1.04)";
    }, { passive: true });
  }

  /* ---------- magnetiske knapper ---------- */
  if (fine && !reduced) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + mx * 0.25 + "px," + my * 0.35 + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }
})();
