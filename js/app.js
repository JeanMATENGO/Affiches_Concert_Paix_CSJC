(() => {
"use strict";
const BW = 763, BH = 1080, CX = 395;
const FONT = '"Poppins",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
const $ = id => document.getElementById(id);
const cv = $("cv"), poster = $("poster");
const st = { step: 1, img: null, ox: 0, oy: 0 };
const tpl = new Image();
let tplReady = false, raf = 0;
const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };

/* ---------- Texte nettoyé (jamais injecté en HTML, seulement dessiné) ---------- */
const cleanName = s => s.replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 30);
const isGroup = () => $("grp").checked;

/* ---------- Netteté douce (masque flou) : 0 = photo telle quelle ---------- */
function soft(c, f) {
  const w = Math.max(1, c.width / f | 0), h = Math.max(1, c.height / f | 0);
  const t = mk(w, h), g = t.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(c, 0, 0, w, h);
  const u = mk(c.width, c.height), q = u.getContext("2d"); q.imageSmoothingQuality = "high"; q.drawImage(t, 0, 0, c.width, c.height);
  return q.getImageData(0, 0, c.width, c.height).data;
}
function sharpen(c) {
  const a = +$("n").value / 100 * 1.3; if (!a) return;
  const g = c.getContext("2d"), o = g.getImageData(0, 0, c.width, c.height), d = o.data;
  const b = soft(c, Math.max(2, Math.round(2 * c.width / 300)));
  for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) d[i + k] += a * (d[i + k] - b[i + k]);
  g.putImageData(o, 0, 0);
}

/* Cadrage de départ : photo centrée */
function recenter() { st.ox = 0; st.oy = 0; }

/* ---------- Mise en page : avec nom, la photo est un peu plus petite ---------- */
function layout() { return $("nm").value.trim() ? { R: 128, CY: 478 } : { R: 150, CY: 528 }; }
function geo(D) {
  const s = Math.max(D / st.img.width, D / st.img.height) * (+$("z").value / 100);
  return { w: st.img.width * s, h: st.img.height * s };
}
function clamp() {
  if (!st.img) return;
  const m = geo(1), mx = Math.max(0, (m.w - 1) / 2), my = Math.max(0, (m.h - 1) / 2);
  st.ox = Math.max(-mx, Math.min(mx, st.ox)); st.oy = Math.max(-my, Math.min(my, st.oy));
}
function sideText(g, k, t) {
  g.save(); g.translate(136 * k, 541 * k); g.rotate(-Math.PI / 2);
  g.font = "800 " + 100 * k + "px " + FONT;
  const fs = Math.min(100 * k * 340 * k / g.measureText(t).width, 66 * k);
  g.font = "800 " + fs + "px " + FONT; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  g.lineWidth = fs * .2; g.strokeStyle = "#cc1920"; g.strokeText(t, 0, 0); g.fillStyle = "#fafafa"; g.fillText(t, 0, 0);
  g.restore();
}
function render(k) {
  const c = mk(BW * k, BH * k), g = c.getContext("2d"), L = layout();
  g.imageSmoothingQuality = "high"; g.drawImage(tpl, 0, 0, c.width, c.height);
  g.fillStyle = "#0a0a0a"; g.beginPath(); g.arc(CX * k, L.CY * k, (L.R + 4) * k, 0, 7); g.fill();
  const D = 2 * L.R * k;
  g.save(); g.beginPath(); g.arc(CX * k, L.CY * k, L.R * k, 0, 7); g.clip();
  if (st.img) {
    const w = mk(D, D), q = w.getContext("2d"), m = geo(D);
    q.imageSmoothingQuality = "high"; q.drawImage(st.img, D / 2 - m.w / 2 + st.ox * D, D / 2 - m.h / 2 + st.oy * D, m.w, m.h);
    sharpen(w); g.drawImage(w, (CX - L.R) * k, (L.CY - L.R) * k);
  } else {
    g.fillStyle = "#2b1c08"; g.fillRect((CX - L.R) * k, (L.CY - L.R) * k, D, D);
    g.fillStyle = "#d9a93c"; g.font = "600 " + 17 * k + "px " + FONT; g.textAlign = "center"; g.fillText("Ta photo ici", CX * k, (L.CY + 6) * k);
  }
  g.restore();
  const nm = cleanName($("nm").value);
  if (nm) {
    g.font = "800 " + 50 * k + "px " + FONT;
    const fs = Math.min(50 * k, 50 * k * 420 * k / g.measureText(nm).width);
    g.font = "800 " + fs + "px " + FONT; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.fillStyle = "#0a0a0a";
    g.fillText(nm, 402 * k, 662 * k);
  }
  sideText(g, k, isGroup() ? "Nous  y  SERONS" : "J'y  SERAI");
  return c;
}
function draw() {
  if (!tplReady) return;
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => { cv.getContext("2d").drawImage(render(1.5), 0, 0, cv.width, cv.height); });
}

/* ---------- Étapes ---------- */
const hints = ["L'aperçu se met à jour pendant que tu écris.", "Glisse la photo pour bien centrer ton visage.", "Vérifie ton affiche avant de la télécharger."];
function go(n, rev) {
  if (n < 1 || n > 3) return;
  st.step = n;
  document.querySelectorAll(".pane").forEach(p => {
    const on = +p.dataset.pane === n; p.classList.toggle("on", on); p.classList.toggle("rev", on && !!rev);
  });
  document.querySelectorAll("#steps li").forEach(li => li.classList.toggle("on", +li.dataset.s === n));
  $("bar").style.width = (n / 3 * 100) + "%";
  $("back").hidden = n === 1; $("next").hidden = n === 3;
  $("next").disabled = n === 2 && !st.img;
  $("hint").textContent = hints[n - 1];
  poster.classList.toggle("drag", n === 2 && !!st.img);
  if (matchMedia("(max-width:899px)").matches) window.scrollTo({ top: 0, behavior: "smooth" });
}
$("next").addEventListener("click", () => { history.pushState({ s: st.step + 1 }, ""); go(st.step + 1); });
$("back").addEventListener("click", () => history.back());
window.addEventListener("popstate", e => { const s = (e.state && e.state.s) || 1; go(s, s < st.step); });
history.replaceState({ s: 1 }, "");

/* ---------- Message et nom ---------- */
$("grp").addEventListener("change", () => {
  const g = isGroup();
  $("modeT").textContent = g ? "Nous y serons" : "J'y serai";
  $("modeS").textContent = g ? "Pour un groupe, une famille, une chorale." : "Par défaut, pour une seule personne.";
  $("nmL").textContent = g ? "Vos noms ou le nom du groupe" : "Ton nom sur l'affiche";
  $("nm").placeholder = g ? "Ex. Famille Bashamuka" : "Ex. Jean Matengo";
  draw();
});
$("nm").addEventListener("input", draw);
$("nm").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); $("next").click(); } });

/* ---------- Photo : vérification du vrai type de fichier ---------- */
async function sniff(f) {
  const b = new Uint8Array(await f.slice(0, 12).arrayBuffer());
  const s = Array.from(b, x => String.fromCharCode(x)).join("");
  return (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) || s.startsWith("\x89PNG") || (s.startsWith("RIFF") && s.slice(8, 12) === "WEBP") || s.slice(4, 8) === "ftyp";
}
const say = t => { $("msg").textContent = t || ""; };
$("f").addEventListener("change", async e => {
  const f = e.target.files[0]; if (!f) return; say();
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(f.type) || !(await sniff(f))) { say("Ce fichier n'est pas une photo acceptée (JPG, PNG ou WebP)."); return; }
  if (f.size > 25 * 1048576) { say("Photo trop lourde (25 Mo maximum)."); return; }
  try {
    let b;
    try { b = await createImageBitmap(f, { imageOrientation: "from-image" }); }
    catch (_) { const u = URL.createObjectURL(f), i = new Image(); await new Promise((ok, ko) => { i.onload = ok; i.onerror = ko; i.src = u; }); URL.revokeObjectURL(u); b = i; }
    const w = b.width, h = b.height; if (w < 50 || h < 50) throw 0;
    const m = Math.min(1, 4096 / Math.max(w, h)), c = mk(Math.round(w * m), Math.round(h * m));
    c.getContext("2d").drawImage(b, 0, 0, c.width, c.height);
    st.img = c; $("z").value = 100; recenter(); $("zo").textContent = "1.0×";
    $("ctl").classList.add("on"); $("drop").classList.add("ok"); $("dropT").textContent = "Changer de photo";
    $("next").disabled = false; poster.classList.add("drag");
    if (Math.min(w, h) < 500) say("Photo petite : le résultat peut être moins net.");
    draw();
  } catch (_) { say("Impossible de lire cette photo. Essaie-en une autre."); }
});
$("z").addEventListener("input", () => { $("zo").textContent = (+$("z").value / 100).toFixed(1) + "×"; clamp(); draw(); });
$("n").addEventListener("input", () => { $("no").textContent = $("n").value; draw(); });
$("reset").addEventListener("click", () => { $("z").value = 100; $("zo").textContent = "1.0×"; recenter(); draw(); });

/* ---------- Glisser la photo (doigt ou souris) ---------- */
let dr = null;
poster.addEventListener("pointerdown", e => { if (!st.img || st.step !== 2) return; dr = { x: e.clientX, y: e.clientY }; poster.setPointerCapture(e.pointerId); });
poster.addEventListener("pointermove", e => {
  if (!dr) return;
  const r = poster.getBoundingClientRect(), f = BW / r.width / (2 * layout().R);
  st.ox += (e.clientX - dr.x) * f; st.oy += (e.clientY - dr.y) * f; dr = { x: e.clientX, y: e.clientY }; clamp(); draw();
});
["pointerup", "pointercancel"].forEach(t => poster.addEventListener(t, () => { dr = null; }));

/* ---------- Téléchargement et partage (HD) ---------- */
const slug = () => (cleanName($("nm").value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase()) || "mon-affiche";
const fname = () => "affiche-concert-de-paix-" + slug() + ".jpg";
const blob = () => new Promise((ok, ko) => render(3).toBlob(b => b ? ok(b) : ko(), "image/jpeg", .95));
const say3 = t => { $("msg3").textContent = t || ""; };
$("dl").addEventListener("click", async () => {
  const b = $("dl"), old = b.textContent; b.disabled = true; b.textContent = "Création de l'affiche…"; say3();
  try {
    const bl = await blob(), u = URL.createObjectURL(bl), a = document.createElement("a");
    a.href = u; a.download = fname(); document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 8000);
    say3("C'est téléchargé. Cherche-la dans ta galerie ou tes téléchargements.");
  } catch (_) { say3("Le téléchargement a échoué, réessaie."); }
  b.disabled = false; b.textContent = old;
});
try {
  if (navigator.canShare && navigator.canShare({ files: [new File([""], "a.jpg", { type: "image/jpeg" })] })) {
    $("sh").hidden = false;
    $("sh").addEventListener("click", async () => {
      try { const bl = await blob(); await navigator.share({ files: [new File([bl], fname(), { type: "image/jpeg" })] }); } catch (_) {}
    });
  }
} catch (_) {}

/* ---------- Démarrage ---------- */
tpl.onload = () => { tplReady = true; draw(); };
tpl.src = window.__TPL;
if (document.fonts && document.fonts.load) Promise.all([document.fonts.load("800 40px Poppins"), document.fonts.load("600 16px Poppins")]).then(draw).catch(() => {});
go(1);
})();
