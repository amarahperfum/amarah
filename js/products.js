// ===== Lista de RESPALDO =====
// Normalmente los productos vienen de la hoja de Google Sheets (SHEET_URL en js/app.js).
// Esta lista solo se muestra si SHEET_URL está vacío o si la hoja no carga,
// así que conviene mantenerla parecida a la hoja.
// img: "img/nocturno.webp" (frasco oscuro) o "img/dorada.webp" (frasco dorado)
// glow: color del brillo detrás del frasco
const PRODUCTS = [
  {id:1, n:"01", name:"Misterio Nocturno", g:"Él",     insp:"Sauvage",           casa:"Dior",             p100:350, p30:150, img:"img/nocturno.webp", glow:"rgba(255,236,210,.10)", tag:"Más pedido"},
  {id:2, n:"02", name:"Luz Dorada",        g:"Ella",   insp:"J'adore",           casa:"Dior",             p100:350, p30:150, img:"img/dorada.webp",   glow:"rgba(227,204,156,.20)", tag:"Nuevo"},
  {id:3, n:"03", name:"Oro Blanco",        g:"Unisex", insp:"Baccarat Rouge 540",casa:"Maison Francis Kurkdjian", p100:375, p30:160, img:"img/dorada.webp", glow:"rgba(255,220,200,.14)"},
  {id:4, n:"04", name:"Brisa Imperial",    g:"Él",     insp:"Acqua di Giò",      casa:"Giorgio Armani",   p100:300, p30:130, img:"img/nocturno.webp", glow:"rgba(170,200,230,.10)"},
  {id:5, n:"05", name:"Rosa Eterna",       g:"Ella",   insp:"La Vie Est Belle",  casa:"Lancôme",          p100:325, p30:140, img:"img/dorada.webp",   glow:"rgba(240,170,190,.14)"},
  {id:6, n:"06", name:"Noche de Oud",      g:"Unisex", insp:"Oud Wood",          casa:"Tom Ford",         p100:375, p30:160, img:"img/nocturno.webp", glow:"rgba(201,169,107,.14)"}
];
