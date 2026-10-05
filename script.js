/* ============================================================
   ЛЯЗЗАТ ИСМАИЛОВА, психолог - скрипт страницы.
   Плиты и сигнатура «выдох» (первый экран - CSS-анимация портрета, текст проявляется классом .on;
   фото-плиты: --open на каждом .fr) · меню · WhatsApp с текстом по теме · форма в WhatsApp.
   Библиотек нет. Ссылки tel/wa не перезаписываются в момент клика,
   обработчик кликов - только делегирование в фазе захвата (совместимость с LeadBot).
   ============================================================ */
(function(){
"use strict";

/* ---------------- КОНТАКТЫ (единственное место) ---------------- */
var CONTACT = { wa: "77015190398" };

var RED = matchMedia("(prefers-reduced-motion: reduce)").matches;
var HAS_IO = typeof IntersectionObserver === "function";
var root = document.documentElement;

/* ---------------- КОНВЕРСИИ GOOGLE ADS ----------------
   Ярлыки задаёт index.html (window.CO_CONV) на этапе рекламы. Переход не блокируем. */
function conv(key){
  var id = (window.CO_CONV || {})[key];
  if (!id || typeof window.gtag !== "function") return;
  window.gtag("event", "conversion", {send_to: id, value: 1.0, currency: "USD", transport_type: "beacon"});
}
window.addEventListener("click", function(e){
  var a = e.target.closest ? e.target.closest("a[href]") : null;
  if (!a) return;
  var h = a.getAttribute("href") || "";
  if (h.indexOf("tel:") === 0) conv("phone");
  else if (h.indexOf("wa.me") > -1) conv("contact");
}, true);

/* ---------------- ТЕКСТЫ WhatsApp ПО ТЕМАМ ---------------- */
var HI = "Здравствуйте, Ляззат! Пишу с сайта.";
var WA_TXT = {
  hero:            HI + " Хочу записаться на консультацию. Коротко о запросе: ",
  konsultaciya:    HI + " Хочу записаться на индивидуальную консультацию (60 минут). Удобный формат: ",
  znakomstvo:      HI + " Хочу записаться на первую встречу-знакомство. Удобный формат и время: ",
  trevoga:         HI + " Тема: тревога, страхи, панические атаки. Коротко о том, что происходит: ",
  otnosheniya:     HI + " Тема: отношения, зависимость, расставание. Коротко о том, что происходит: ",
  samoocenka:      HI + " Тема: самооценка и смелость быть собой. Коротко: ",
  prednaznachenie: HI + " Тема: предназначение, карьера, мотивация. Коротко: ",
  krizis:          HI + " Тема: кризис, травма. Коротко о том, что происходит: ",
  gore:            HI + " Тема: горе, утрата. Коротко: ",
  semya:           HI + " Тема: семейные отношения. Коротко: ",
  psihosomatika:   HI + " Тема: психосоматика. Коротко: ",
  rpp:             HI + " Тема: пищевое поведение. Коротко: ",
  konflikty:       HI + " Тема: конфликты, личностный рост. Коротко: ",
  gruppa:          HI + " Хочу узнать о групповой терапии: состав, расписание, стоимость. ",
  paket5:          HI + " Хочу взять пакет из 5 сессий. Удобный формат: ",
  paket10:         HI + " Хочу взять пакет из 10 сессий. Удобный формат: ",
  supervizia:      HI + " Хочу записаться на супервизию (60 минут). Коротко о случае: ",
  kontakty:        HI + " Вопрос: "
};
function waUrl(t){ return "https://wa.me/" + CONTACT.wa + "?text=" + encodeURIComponent(t); }
document.querySelectorAll("[data-wa]").forEach(function(a){
  a.href = waUrl(WA_TXT[a.dataset.wa] || WA_TXT.hero);
  a.target = "_blank"; a.rel = "noopener";
});

var rsTimer;
addEventListener("resize", function(){
  update();
  clearTimeout(rsTimer);
  rsTimer = setTimeout(update, 200);
});

/* ---------------- МЕНЮ ---------------- */
var burger = document.getElementById("burger");
var mnav = document.getElementById("mnav");
function closeMenu(){
  document.body.classList.remove("menu-open");
  if (burger) burger.setAttribute("aria-expanded", "false");
}
if (burger) burger.addEventListener("click", function(){
  var open = document.body.classList.toggle("menu-open");
  burger.setAttribute("aria-expanded", open ? "true" : "false");
});
if (mnav) mnav.addEventListener("click", function(e){ if (e.target.closest("a")) closeMenu(); });
addEventListener("keydown", function(e){ if (e.key === "Escape") closeMenu(); });

/* ---------------- ЯКОРЯ ---------------- */
var HH = function(){ return parseFloat(getComputedStyle(root).getPropertyValue("--hh")) || 70; };
document.addEventListener("click", function(e){
  var a = e.target.closest('a[href^="#"]'); if (!a) return;
  var id = a.getAttribute("href").slice(1); if (!id) return;
  var t = document.getElementById(id); if (!t) return;
  e.preventDefault();
  closeMenu();
  var top = t.getBoundingClientRect().top + scrollY - (t.classList.contains("pw") ? 0 : HH() + 10);
  scrollTo({ top: Math.max(0, top), behavior: RED ? "auto" : "smooth" });
  try { history.pushState(null, "", "#" + id); } catch(err){}
});

/* ---------------- ШАПКА ---------------- */
var hdr = document.getElementById("hdr");
function hdrState(){ if (hdr) hdr.classList.toggle("solid", scrollY > 40); }

/* ---------------- ПЛИТЫ, ИНТРО ГЕРОЯ, КАДРЫ ----------------
   Один слушатель scroll через rAF. На .pw пишем --enter/--exit/--stay;
   на герое --intro (кадр отдаляется от детали), на каждом .fr - --open по его положению. */
function clamp(v){ return v < 0 ? 0 : (v > 1 ? 1 : v); }
function easeOut(t){ return 1 - Math.pow(1 - t, 3); }
function easeBreath(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
var pws = [].slice.call(document.querySelectorAll(".pw"));
var frames = [].slice.call(document.querySelectorAll(".fr:not(.fr-hero)"));
var heroPw = document.getElementById("top");
var hero = document.getElementById("hero");
var bar = document.getElementById("bar");
var kont = document.getElementById("kontakty");
var introK = 1, introDone = true;
/* ?intro=0.4 / ?open=0.5 в URL - только для проверки промежуточных фаз (checks/) */
var DBG = new URLSearchParams(location.search);
var dbgIntro = parseFloat(DBG.get("intro")), dbgOpen = parseFloat(DBG.get("open"));

function update(){
  var H = innerHeight || root.clientHeight;
  if (root.classList.contains("no-plate")) {
    hdrState();
    if (bar) bar.classList.toggle("show", scrollY > H * 0.55 && !(kont && kont.getBoundingClientRect().top < H * 0.6));
    return;
  }
  pws.forEach(function(pw){
    var r = pw.getBoundingClientRect();
    var enter = clamp(1 - r.top / H);
    var exit  = clamp(1 - r.bottom / H);
    var stay  = r.height > H + 1 ? clamp(-r.top / (r.height - H)) : enter;
    pw.style.setProperty("--enter", enter.toFixed(3));
    pw.style.setProperty("--exit",  exit.toFixed(3));
    pw.style.setProperty("--stay",  stay.toFixed(3));
    pw.classList.toggle("gone", exit >= 1);
    pw.classList.toggle("on", enter > 0.6);
    if (pw === heroPw) {
      var ip = introDone ? 1 : easeBreath(introK);
      if (!isNaN(dbgIntro)) ip = dbgIntro;
      pw.style.setProperty("--intro", ip.toFixed(4));
    }
  });
  frames.forEach(function(f){
    var r = f.getBoundingClientRect();
    var e = clamp(1 - r.top / H);                       /* верх кадра вошёл во вьюпорт */
    var open = !isNaN(dbgOpen) ? dbgOpen : easeBreath(clamp((e - .2) / .78));   /* выдох идёт весь въезд плиты */
    f.style.setProperty("--open", open.toFixed(3));
  });
  hdrState();
  var onKont = kont && kont.getBoundingClientRect().top < H * 0.6;
  if (bar) bar.classList.toggle("show", scrollY > H * 0.55 && !onKont);
}
if (RED) {
  root.classList.add("no-plate");
  root.classList.add("no-intro");
  if (hero) hero.classList.add("on");
  addEventListener("scroll", function(){ hdrState(); if (bar) bar.classList.toggle("show", scrollY > innerHeight * 0.55); }, {passive:true});
  hdrState();
} else {
  var tick = false;
  addEventListener("scroll", function(){
    if (tick) return; tick = true;
    requestAnimationFrame(function(){ tick = false; update(); });
  }, {passive:true});
  addEventListener("load", update);
  /* интро 1700 мс: кадр медленно отдаляется от кресла до целой комнаты, тон теплеет, текст поднимается.
     Пропускаем при хэше / прокрутке - человек из рекламы сразу видит собранный экран. */
  var skip = location.hash || scrollY > 80;
  if (skip) {
    root.classList.add("no-intro");
    if (hero) hero.classList.add("on");
    update();
  } else {
    introK = 0; introDone = false; update();
    var t0 = null;
    var step = function(ts){
      if (introDone) return;
      if (t0 === null) t0 = ts;
      var p = clamp((ts - t0) / 1700);
      introK = p;
      if (p > .25 && hero) hero.classList.add("on");
      update();
      if (p < 1) requestAnimationFrame(step);
      else { introDone = true; update(); }
    };
    requestAnimationFrame(function(){ requestAnimationFrame(step); });
    setTimeout(function(){ if (hero) hero.classList.add("on"); }, 700);
    setTimeout(function(){ if (!introDone) { introDone = true; introK = 1; update(); } }, 2800);
  }
}
[1500, 3000, 5000].forEach(function(ms){ setTimeout(update, ms); });
window.plateSync = function(){ introDone = true; introK = 1; if (hero) hero.classList.add("on"); update(); };
addEventListener("hashchange", function(){ root.classList.add("no-intro"); });

/* ---------------- ПОЯВЛЕНИЕ В КАТАЛОЖНЫХ СЕКЦИЯХ ---------------- */
if (HAS_IO) {
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
    });
  }, {threshold:.08, rootMargin:"0px 0px -6% 0px"});
  document.querySelectorAll(".rv").forEach(function(el){ io.observe(el); });
  setTimeout(function(){ document.querySelectorAll(".rv:not(.in)").forEach(function(el){
    if (el.getBoundingClientRect().top < innerHeight) { el.classList.add("in"); io.unobserve(el); }
  }); }, 1500);
} else {
  document.querySelectorAll(".rv").forEach(function(el){ el.classList.add("in"); });
}

/* ---------------- ФОРМА → WhatsApp ---------------- */
var form = document.getElementById("form");
if (form) form.addEventListener("submit", function(e){
  e.preventDefault();
  var ok = document.getElementById("fmok"), err = document.getElementById("fmerr");
  if (form.website && form.website.value) return;          /* honeypot */
  var name = form.name.value.trim(), phone = form.phone.value.trim();
  var svc = form.svc.value, fmt = form.fmt.value, msg = (form.msg.value || "").trim();
  if (!name || phone.replace(/\D/g, "").length < 10) { err.hidden = false; ok.hidden = true; return; }
  err.hidden = true;
  var t = HI + " Заявка.\nИмя: " + name + "\nТелефон: " + phone + "\nТема: " + svc + "\nФормат: " + fmt + (msg ? "\nО ситуации: " + msg : "");
  ok.hidden = false;
  conv("lead");
  window.open(waUrl(t), "_blank", "noopener");
});

/* ---------------- СТАРТ ---------------- */
hdrState();
})();

/* ---------------- ДИПЛОМ И СЕРТИФИКАТЫ ---------------- */
(function(){
  var box = document.getElementById("docbox"); if (!box || !box.showModal) return;
  var img = box.querySelector("img");
  document.querySelectorAll(".doc").forEach(function(b){
    b.addEventListener("click", function(){
      img.src = b.dataset.full; img.alt = b.querySelector("img").alt;
      box.showModal();
    });
  });
  box.addEventListener("click", function(e){ if (e.target === box || e.target.closest(".docbox-x")) box.close(); });
})();
