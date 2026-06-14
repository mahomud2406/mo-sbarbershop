/* ============================================================
   Mo's Barbershop — interaksjon
   reveal · cursor · magnetiske knapper · tellere · nav · meny
   (Ingen scroll-parallax på bilder — de er bevisst statiske.)
   ============================================================ */
(function () {
  "use strict";
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* loader + hero-inn */
  addEventListener("load", function () {
    var l = document.getElementById("loader");
    if (l) setTimeout(function () { l.classList.add("is-done"); }, 950);
    document.querySelectorAll(".hero__title span, .hero .r").forEach(function (el) { el.classList.add("is-in"); });
  });

  var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();

  /* cursor */
  var cur = document.getElementById("cursor"), dot = document.getElementById("cursorDot");
  if (fine && cur && dot) {
    var cx = 0, cy = 0, tx = 0, ty = 0;
    addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = "translate(" + tx + "px," + ty + "px) translate(-50%,-50%)";
    });
    (function loop() { cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2; cur.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)"; requestAnimationFrame(loop); })();
    document.querySelectorAll("[data-cursor], a, button").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cur.classList.add("is-active"); });
      el.addEventListener("mouseleave", function () { cur.classList.remove("is-active"); });
    });
  }

  /* nav / progress / float */
  var nav = document.getElementById("nav"), prog = document.getElementById("progress"), float = document.getElementById("float");
  function onScroll() {
    var s = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    if (nav) nav.classList.toggle("is-scrolled", s > 40);
    if (prog) prog.style.width = (h > 0 ? (s / h) * 100 : 0) + "%";
    if (float) float.classList.toggle("is-on", s > innerHeight * 0.9);
  }
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* mobilmeny */
  var burger = document.getElementById("burger"), mob = document.getElementById("mobile");
  if (burger && mob) {
    function tog(open) { mob.classList.toggle("is-open", open); burger.classList.toggle("is-open", open); document.body.style.overflow = open ? "hidden" : ""; }
    burger.addEventListener("click", function () { tog(!mob.classList.contains("is-open")); });
    mob.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { tog(false); }); });
  }

  /* reveal */
  var els = document.querySelectorAll(".r");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (e) { io.observe(e); });
  } else els.forEach(function (e) { e.classList.add("is-in"); });

  /* tellere */
  function count(el) {
    var target = parseFloat(el.dataset.count), dec = parseInt(el.dataset.decimals || "0", 10), suf = el.dataset.suffix || "", start;
    function step(ts) { if (!start) start = ts; var p = Math.min((ts - start) / 1500, 1); var v = target * (1 - Math.pow(1 - p, 3)); el.textContent = (dec ? v.toFixed(dec) : Math.floor(v)) + suf; if (p < 1) requestAnimationFrame(step); else el.textContent = (dec ? target.toFixed(dec) : target) + suf; }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (ents) { ents.forEach(function (en) { if (en.isIntersecting) { count(en.target); cio.unobserve(en.target); } }); }, { threshold: 0.6 });
    counters.forEach(function (e) { cio.observe(e); });
  } else counters.forEach(count);

  /* magnetiske knapper */
  if (fine && !reduced) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var rct = el.getBoundingClientRect();
        var mx = e.clientX - rct.left - rct.width / 2, my = e.clientY - rct.top - rct.height / 2;
        el.style.transform = "translate(" + mx * 0.22 + "px," + my * 0.3 + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }
})();
