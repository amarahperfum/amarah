// =====================================================================
//  CONFIGURACIÓN (lo único que normalmente hay que cambiar)
// =====================================================================

// Número de WhatsApp que recibe los pedidos: 502 (Guatemala) + número, sin espacios ni "+".
const WHATSAPP = "50233120864";

// Símbolo de la moneda que aparece antes de cada precio.
const MONEDA = "Q";

// Precio del set "Crea tu combinación" (3 esencias de 30 ml).
const PRECIO_SET = 300;

// Link de la hoja de Google Sheets publicada como CSV
// (Archivo > Compartir > Publicar en la web > CSV). Termina en "output=csv".
// Mientras esté vacío, o si la hoja no carga, se usa la lista de js/products.js.
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTWeeoB7NptJJiEswFbnOtlVCQvQGfaXv-9ck312kzFf_0zo7N5tX1D1UsILIjnfXYu_BgUbM7VXQw4/pub?gid=1807667356&single=true&output=csv";

// =====================================================================

const $ = s => document.querySelector(s);
const fmt = n => MONEDA + n.toLocaleString("es-GT",{minimumFractionDigits:2,maximumFractionDigits:2});
let cart = []; try { cart = JSON.parse(localStorage.getItem("amarah_v3")) || []; } catch(e){}
// Carritos guardados antes de mover las imágenes a img/: corrige la ruta vieja
cart.forEach(c => { if (c.img && !/^(img\/|https?:)/.test(c.img)) c.img = "img/" + c.img; });
const save = () => { try{ localStorage.setItem("amarah_v3", JSON.stringify(cart)); }catch(e){} };
const sizeSel = {}; let filtro = "todos";

// ===== Productos desde Google Sheets =====
// Frasco de respaldo según la columna "frasco"
const FRASCOS = { oscuro:"img/nocturno.webp", dorado:"img/dorada.webp" };
// Brillo detrás del frasco según "frasco" y "para" (mismos colores de la colección actual)
const GLOW = {
  oscuro: { "Él":"rgba(255,236,210,.10)", "Ella":"rgba(240,170,190,.14)", "Unisex":"rgba(201,169,107,.14)" },
  dorado: { "Él":"rgba(170,200,230,.10)", "Ella":"rgba(227,204,156,.20)", "Unisex":"rgba(255,220,200,.14)" }
};
const PARA = { el:"Él", ella:"Ella", unisex:"Unisex", hombre:"Él", caballero:"Él", mujer:"Ella", dama:"Ella" };
let cargandoHoja = false;

// "  Sí " -> "si" (sin tildes, minúsculas, sin espacios de más). Solo para comparar.
const norm = s => String(s ?? "").normalize("NFD").replace(/\p{M}/gu,"").toLowerCase().replace(/\s+/g," ").trim();
const limpio = s => String(s ?? "").replace(/\s+/g," ").trim();
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

// CSV -> filas. Respeta comas, comillas dobles y saltos de línea dentro de comillas.
function parseCSV(texto){
  const filas = []; let fila = [], campo = "", comillas = false;
  texto = String(texto).replace(/^﻿/, "");
  for (let i = 0; i < texto.length; i++){
    const c = texto[i];
    if (comillas){
      if (c === '"'){ if (texto[i+1] === '"'){ campo += '"'; i++; } else comillas = false; }
      else campo += c;
    }
    else if (c === '"') comillas = true;
    else if (c === ","){ fila.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r"){
      if (c === "\r" && texto[i+1] === "\n") i++;
      fila.push(campo); filas.push(fila); fila = []; campo = "";
    }
    else campo += c;
  }
  if (campo !== "" || fila.length){ fila.push(campo); filas.push(fila); }
  return filas;
}

// Filas -> objetos usando la primera fila como nombres de columna ("Inspirado en" -> inspirado_en)
function filasAObjetos(filas){
  const [cab = [], ...resto] = filas;
  const claves = cab.map(h => norm(h).replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,""));
  return resto.filter(f => f.some(v => v.trim()))
              .map(f => Object.fromEntries(claves.map((k,i) => [k, limpio(f[i])])));
}

// "Q 1,250.00" -> 1250 · "350,50" -> 350.5
function parsePrecio(v){
  let s = String(v ?? "").replace(/[^\d.,]/g,"");
  if (/,\d{1,2}$/.test(s) && !/\.\d{1,2}$/.test(s)) s = s.replace(/\./g,"").replace(",",".");
  else s = s.replace(/,/g,"");
  return parseFloat(s) || 0;
}

// Foto del producto: vacía = frasco · nombre de archivo = img/ · link https · link de Google Drive
function resolverImagen(valor, respaldo){
  let v = limpio(valor);
  if (!v) return respaldo;
  if (/^https?:\/\//i.test(v)){
    if (/(drive|docs)\.google\.com/i.test(v)){
      const id = (v.match(/\/d\/([\w-]{10,})/) || v.match(/[?&]id=([\w-]{10,})/) || [])[1];
      if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
    }
    return v.replace(/^http:/i, "https:");
  }
  v = v.replace(/^\.?\/+/, "");
  return v.includes("/") ? v : "img/" + v;
}

const disponible = v => ["si","s","x","1","true","yes"].includes(norm(v));

function filaAProducto(r, pos, usados, filaHoja){
  const name = limpio(r.nombre), p100 = parsePrecio(r.precio_100), p30 = parsePrecio(r.precio_30);
  if (!name || !p100 || !p30){
    console.warn(`AMARAH: fila ${filaHoja} de la hoja ignorada (falta nombre, precio_100 o precio_30).`);
    return null;
  }
  const frasco = norm(r.frasco).startsWith("dor") ? "dorado" : "oscuro";
  const g = PARA[norm(r.para)] || "Unisex";
  const fb = FRASCOS[frasco];
  let n = limpio(r.numero).replace(/^n\s*[°º.]?\s*/i, "");
  n = n ? (/^\d+$/.test(n) ? n.padStart(2,"0") : n) : String(pos + 1).padStart(2,"0");
  let id = norm(name).replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") || "p";
  while (usados.has(id)) id += "-2";
  usados.add(id);
  return { id, n, name, g, insp:limpio(r.inspirado_en), casa:limpio(r.marca), p100, p30,
           img:resolverImagen(r.imagen, fb), fb, glow:GLOW[frasco][g], tag:limpio(r.etiqueta) };
}

async function cargarHoja(){
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch(SHEET_URL.trim(), {cache:"no-store", signal:ctrl.signal});
    if (!r.ok) throw new Error("respuesta HTTP " + r.status);
    const texto = await r.text();
    if (/^\s*</.test(texto)) throw new Error("el link no devuelve un CSV (¿la hoja está publicada como CSV?)");
    const filas = filasAObjetos(parseCSV(texto));
    if (!filas.length || !("nombre" in filas[0])) throw new Error("no se encontró la columna 'nombre'");
    const usados = new Set(), lista = [];
    filas.forEach((r, i) => {
      if (!disponible(r.disponible)) return;
      const p = filaAProducto(r, lista.length, usados, i + 2);
      if (p) lista.push(p);
    });
    if (!lista.length) throw new Error("no hay productos con disponible = si");
    return lista;
  } catch(e){
    throw e.name === "AbortError" ? new Error("la hoja tardó más de 10 segundos en responder") : e;
  } finally { clearTimeout(t); }
}

// Si una foto no carga (link roto, nombre mal escrito, Drive sin permiso) se cambia por el frasco de respaldo
document.addEventListener("error", e => {
  const img = e.target;
  if (img.tagName !== "IMG" || !img.dataset.fb || img.dataset.fbUsado) return;
  img.dataset.fbUsado = "1";
  if (img.getAttribute("src") !== img.dataset.fb) img.src = img.dataset.fb;
}, true);

// ===== Catálogo =====
function renderGrid(){
  if (cargandoHoja){
    $("#grid").innerHTML = `<p class="cap" style="grid-column:1/-1;text-align:center;color:var(--soft);padding:60px 0"><span class="shine">Cargando colección…</span></p>`;
    return;
  }
  // Si la colección ya está a la vista, al filtrar se usa una entrada corta (clase "re") en vez de la cascada larga
  $("#grid").classList.toggle("re", $("#grid").classList.contains("play"));
  const q = norm($("#q").value);
  const list = PRODUCTS.filter(p => (filtro==="todos"||p.g===filtro) && (!q || norm(p.name+" "+p.insp+" "+p.casa).includes(q)));
  $("#grid").innerHTML = list.length ? list.map((p, idx) => {
    const s = sizeSel[p.id] || 100, price = s===100 ? p.p100 : p.p30;
    return `<article class="card" style="--i:${idx}">
      <div class="tile" style="--glow:${p.glow}">
        <span class="num">N° ${esc(p.n)}</span>${p.tag?`<span class="tag cap">${esc(p.tag)}</span>`:""}
        <div class="b"><img src="${esc(p.img)}" alt="${esc(p.name)}" data-fb="${esc(p.fb)}"><img class="ref" src="${esc(p.img)}" alt="" data-fb="${esc(p.fb)}"></div>
      </div>
      <div class="ci">
        <span class="cap">${esc(p.g)} · Parfum</span>
        <h3>${esc(p.name)}</h3>
        <div class="insp">Inspirado en <b>${esc(p.insp)}</b>${p.casa?` · ${esc(p.casa)}`:""}</div>
        <div class="sizes">
          <button class="sz ${s===100?"on":""}" data-sz="100" data-id="${p.id}">100 ml</button>
          <button class="sz ${s===30?"on":""}" data-sz="30" data-id="${p.id}">30 ml</button>
        </div>
        <div class="buy"><span class="price">${fmt(price)}</span><button class="add" data-add="${p.id}">Agregar</button></div>
      </div>
    </article>`;
  }).join("") : `<p style="grid-column:1/-1;text-align:center;color:var(--soft);line-height:1.9;padding:30px 0">No está en la colección, pero podemos prepararlo.<br><a href="#especial" style="color:var(--gold-l)">Pídelo como pedido especial →</a></p>`;
}

function fillCombo(){
  const opts = PRODUCTS.map(p => `<option value="${p.id}">${esc(p.name)} — ${esc(p.insp)}</option>`).join("");
  ["#c1","#c2","#c3"].forEach((s,i) => { $(s).innerHTML = opts; $(s).value = PRODUCTS[i % PRODUCTS.length].id; });
  $("#setPrice").textContent = fmt(PRECIO_SET);
  updLabels();
}
function updLabels(){ ["1","2","3"].forEach(i => { const p = PRODUCTS.find(x => x.id == $("#c"+i).value), l = $("#l"+i);
    if (l.textContent === p.name) return; l.classList.add("swap"); setTimeout(() => { l.textContent = p.name; l.classList.remove("swap"); }, 250);
    const b = l.parentElement.querySelector(".b"); b.classList.remove("lift"); void b.offsetWidth; b.classList.add("lift"); }); }

function add(item){
  const f = cart.find(c => c.key===item.key);
  f ? f.q++ : cart.push({...item, q:1});
  renderCart(); toast(item.name + " agregado");
  const c = $("#count"); c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
}

function renderCart(){
  let total=0, count=0, pend=false;
  $("#items").innerHTML = cart.length ? cart.map((c,i) => {
    count += c.q; if(c.price) total += c.price*c.q; else pend = true;
    return `<div class="it">
      ${c.img ? `<div class="thumb"><img src="${esc(c.img)}" alt="" data-fb="${esc(c.fb || FRASCOS.oscuro)}"></div>` : `<div class="thumb sp">✦</div>`}
      <div><h4>${esc(c.name)}</h4><small>${esc(c.detail)}</small>
        <div class="qty"><button data-i="${i}" data-d="-1">−</button><span>${c.q}</span><button data-i="${i}" data-d="1">+</button></div></div>
      <div class="sub">${c.price ? fmt(c.price*c.q) : "A confirmar"}<button class="rm" data-rm="${i}">Quitar</button></div>
    </div>`;
  }).join("") : `<div class="empty">Tu pedido está vacío.<br>Elige tus fragancias favoritas.</div>`;
  $("#total").textContent = fmt(total) + (pend ? " +" : "");
  $("#count").textContent = count;
  $("#openCart").classList.toggle("has", count>0);
  $("#wa").classList.toggle("off", !cart.length);
  $("#wa").href = waLink(total, pend);
  save();
}

function waLink(total, pend){
  const lines = cart.map(c => c.price
    ? `• ${c.q} x ${c.name} — ${c.detail} — ${fmt(c.price*c.q)}`
    : `• ${c.q} x Pedido especial: ${c.name}${c.g?` (${c.g})`:""} — precio a confirmar`);
  let msg = `Hola AMARAH ✨ Quiero hacer este pedido:\n\n${lines.join("\n")}\n\n*Total: ${fmt(total)}*`;
  if (pend) msg += ` + pedidos especiales por confirmar`;
  const n = $("#cname").value.trim(); if (n) msg += `\n\nNombre: ${n}`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
}

function toast(t){ const el=$("#toast"); el.textContent=t; el.classList.add("show"); clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove("show"),1600); }
const openCart = o => { $("#cart").classList.toggle("open",o); $("#veil").classList.toggle("open",o); };

$("#grid").addEventListener("click", e => {
  const sz = e.target.closest("[data-sz]");
  if (sz){
    // Solo cambia esta tarjeta (antes se redibujaban y animaban todas)
    const s = +sz.dataset.sz, p = PRODUCTS.find(x => x.id == sz.dataset.id), card = sz.closest(".card"), pr = card.querySelector(".price");
    sizeSel[p.id] = s;
    card.querySelectorAll(".sz").forEach(x => x.classList.toggle("on", x === sz));
    pr.classList.add("swap");
    setTimeout(() => { pr.textContent = fmt(s===100 ? p.p100 : p.p30); pr.classList.remove("swap"); }, 200);
    return;
  }
  const b = e.target.closest("[data-add]"); if(!b) return;
  const p = PRODUCTS.find(x => x.id == b.dataset.add), s = sizeSel[p.id] || 100;
  add({key:`p${p.id}-${s}`, name:p.name, detail:`${s} ml · inspirado en ${p.insp}`, price: s===100?p.p100:p.p30, img:p.img, fb:p.fb});
  b.textContent="✓"; b.classList.add("done"); setTimeout(()=>{ b.textContent="Agregar"; b.classList.remove("done"); },1000);
});
["#c1","#c2","#c3"].forEach(s => $(s).addEventListener("change", updLabels));
$("#addSet").onclick = () => {
  if (!$("#c1").value) return;   // la colección todavía está cargando
  const names = ["#c1","#c2","#c3"].map(s => PRODUCTS.find(x => x.id == $(s).value).name);
  add({key:"set-"+names.join("|"), name:"Set Crea tu combinación", detail:`3 x 30 ml: ${names.join(", ")}`, price:PRECIO_SET, img:"img/tube2.webp"});
};
$("#items").addEventListener("click", e => {
  const d = e.target.dataset;
  if (d.d){ cart[d.i].q += +d.d; if(cart[d.i].q<=0) cart.splice(d.i,1); renderCart(); }
  if (d.rm){ cart.splice(d.rm,1); renderCart(); }
});
$("#tabs").addEventListener("click", e => {
  const t = e.target.closest(".tab"); if(!t) return;
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("on", x===t));
  filtro = t.dataset.f; renderGrid(); moverInd();
});
// Indicador dorado que se desliza bajo el filtro activo
const tabsEl = $("#tabs"), ind = document.createElement("span");
ind.className = "tab-ind"; tabsEl.append(ind); tabsEl.classList.add("js");
function moverInd(){ const t = tabsEl.querySelector(".tab.on"); if (!t) return;
  ind.style.width = t.offsetWidth + "px"; ind.style.transform = `translateX(${t.offsetLeft}px)`; }
moverInd(); addEventListener("resize", moverInd); document.fonts && document.fonts.ready.then(moverInd);
// Buscador: espera a que termines de escribir para no reanimar las tarjetas con cada letra
let tBusca; $("#q").addEventListener("input", () => { clearTimeout(tBusca); tBusca = setTimeout(renderGrid, 160); });
$("#sform").addEventListener("submit", e => {
  e.preventDefault();
  const n = $("#sname").value.trim(); if(!n) return;
  const g = $("#sg").value.trim();
  add({key:"s"+n.toLowerCase(), name:n, g, detail:"Pedido especial · precio a confirmar", price:0});
  e.target.reset(); openCart(true);
});
$("#cname").addEventListener("input", renderCart);
$("#openCart").onclick = () => openCart(true);
$("#closeCart").onclick = $("#veil").onclick = () => openCart(false);
const hdr = $("#hdr"); const onS = () => hdr.classList.toggle("solid", scrollY > 20); addEventListener("scroll", onS, {passive:true}); onS();

// ===== Arranque: hoja de Google Sheets o lista de respaldo (js/products.js) =====
PRODUCTS.forEach(p => { p.fb = p.fb || p.img; });
const mostrarCatalogo = () => { renderGrid(); fillCombo(); };
if (SHEET_URL.trim()){
  cargandoHoja = true; renderGrid();
  cargarHoja()
    .then(lista => PRODUCTS.splice(0, PRODUCTS.length, ...lista))
    .catch(err => console.warn("AMARAH: no se pudo leer la hoja de Google Sheets, se usa js/products.js →", err.message || err))
    .finally(() => { cargandoHoja = false; mostrarCatalogo(); });
} else mostrarCatalogo();
renderCart();

// ===== Animaciones =====
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
let introSeen = false; try { introSeen = sessionStorage.getItem("amarah_intro") === "1"; sessionStorage.setItem("amarah_intro","1"); } catch(e){}
if (reduce || introSeen) { $("#intro").remove(); document.body.classList.add("ready"); }
else { setTimeout(() => document.body.classList.add("ready"), 1750); setTimeout(() => $("#intro") && $("#intro").remove(), 2900); }

const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add(e.target.id === "grid" ? "play" : "in");
  if (e.target.classList.contains("perk")) contar(e.target.querySelector("b"));
  io.unobserve(e.target);
}), {threshold:.12, rootMargin:"0px 0px -6% 0px"});
document.querySelectorAll(".rv, #grid").forEach(el => io.observe(el));

// "12 h" cuenta desde 0 cuando aparece
function contar(b){
  const m = /^(\d+)(.*)$/.exec(b.textContent); if (!m || reduce) return;
  const fin = +m[1], resto = m[2], t0 = performance.now(), dur = 1400;
  const paso = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    b.textContent = Math.round(fin * e) + resto; if (k < 1) requestAnimationFrame(paso); };
  requestAnimationFrame(paso);
}

// Línea dorada de progreso del scroll (bajo el encabezado)
const progreso = () => { const h = document.documentElement.scrollHeight - innerHeight;
  hdr.style.setProperty("--sp", h > 0 ? Math.min(1, scrollY / h).toFixed(4) : "0"); };
addEventListener("scroll", progreso, {passive:true}); addEventListener("resize", progreso); progreso();

// Los frascos del inicio siguen suavemente al mouse (solo computadora)
if (!reduce && matchMedia("(hover:hover) and (pointer:fine)").matches){
  const st = $(".stage"); let px = 0, py = 0, pendiente = false;
  addEventListener("pointermove", e => {
    px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5;
    if (pendiente) return; pendiente = true;
    requestAnimationFrame(() => { pendiente = false; st.style.setProperty("--mx", px.toFixed(3)); st.style.setProperty("--my", py.toFixed(3)); });
  }, {passive:true});
}
