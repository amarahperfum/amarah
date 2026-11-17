# AMARAH · Catálogo web

Catálogo de fragancias inspiradas de AMARAH. Los clientes eligen sus perfumes y envían el pedido por WhatsApp.

**Página pública:** https://amarahperfum.github.io/amarah/

Es una página sencilla (HTML, CSS y JavaScript), sin programas extra. Los productos se leen de una hoja de Google Sheets, así que para el día a día **solo hay que editar la hoja**.

---

## 1. Agregar, quitar o cambiar productos (en la hoja de Google Sheets)

Abre la hoja "AMARAH productos" en Google Sheets. Cada fila es un perfume:

| Columna | Qué poner | Ejemplo |
|---|---|---|
| `numero` | Número que se ve en la tarjeta. Si lo dejas vacío se numeran solos: 01, 02… | `7` |
| `nombre` | Nombre de la fragancia AMARAH (obligatorio) | `Rosa Eterna` |
| `para` | `Él`, `Ella` o `Unisex` | `Ella` |
| `inspirado_en` | Perfume original | `La Vie Est Belle` |
| `marca` | Marca del perfume original | `Lancôme` |
| `precio_100` | Precio de 100 ml, solo el número (obligatorio) | `325` |
| `precio_30` | Precio de 30 ml, solo el número (obligatorio) | `140` |
| `frasco` | `oscuro` o `dorado`. Decide el frasco y el color del brillo. | `dorado` |
| `imagen` | Opcional. Vacío = se usa el frasco. Ver la sección 2. | `rosa-eterna.webp` |
| `etiqueta` | Opcional. Texto pequeño sobre la foto. | `Nuevo` |
| `disponible` | `si` para mostrarlo, `no` para ocultarlo | `si` |

- **Agregar un perfume:** escribe una fila nueva debajo de las demás.
- **Ocultar un perfume** (por ejemplo, si está agotado): cambia `disponible` a `no`. Puedes volver a mostrarlo luego.
- **Cambiar un precio:** edita `precio_100` o `precio_30`.
- **Orden:** los perfumes aparecen en el mismo orden que las filas.
- No cambies los nombres de la primera fila (los títulos de las columnas).
- Si una fila no tiene nombre o le falta un precio, no se muestra.

> ⏱️ **Los cambios en la hoja tardan unos 5 minutos en verse en la página.** Google actualiza la versión publicada cada cierto tiempo. Si ya pasaron 5 minutos, recarga la página.

La lista de perfumes que también aparece en "Crea tu combinación" sale de esta misma hoja.

---

## 2. Fotos de los perfumes

Si la columna `imagen` está vacía, se usa el frasco oscuro o dorado. Para usar una foto propia:

### Cómo debe ser la foto

Para que se vea igual que los frascos actuales, con el brillo, la línea del piso y el reflejo:

- **Fondo transparente**, sin fondo blanco ni de color.
- **Vertical**, de unos **500 × 800 px**, con el frasco ocupando casi toda la foto y pegado al borde de abajo.
- Formato **.webp** o **.png**.

### Cómo quitarle el fondo a una foto

- **remove.bg** (gratis): entra a https://www.remove.bg, sube la foto y descarga el resultado en PNG.
- **Canva:** sube la foto, toca **Editar → Quitar fondo** (necesita Canva Pro) y descárgala como **PNG con fondo transparente**.

### Opción A: subir la foto a GitHub (recomendado)

1. Nombra el archivo en **minúsculas, sin espacios ni tildes**, por ejemplo `rosa-eterna.webp`. GitHub distingue mayúsculas: `Rosa.webp` y `rosa.webp` son archivos distintos.
2. Entra a https://github.com/amarahperfum/amarah e inicia sesión.
3. Abre la carpeta **`img`**.
4. Pulsa **Add file → Upload files** y arrastra la foto.
5. Abajo pulsa **Commit changes**.
6. En la hoja, escribe en la columna `imagen` solo el nombre del archivo: `rosa-eterna.webp`.

La foto queda disponible en la página en 1 o 2 minutos.

### Opción B: usar una foto de Google Drive

1. En Drive, haz clic derecho en la foto → **Compartir** → en "Acceso general" elige **Cualquier persona con el enlace**.
2. Copia el enlace y pégalo en la columna `imagen`. La página lo convierte sola.

Si una foto no carga (nombre mal escrito, enlace sin permiso…), la página muestra el frasco en su lugar, así que nunca se ve una imagen rota.

---

## 3. Cambiar el número de WhatsApp, la moneda o el precio del set

Estos datos están al inicio del archivo [`js/app.js`](js/app.js):

```js
const WHATSAPP   = "50233120864";   // 502 + número, sin espacios ni "+"
const MONEDA     = "Q";
const PRECIO_SET = 300;             // set "Crea tu combinación" (3 x 30 ml)
const SHEET_URL  = "https://docs.google.com/...output=csv";   // hoja publicada como CSV
```

Para cambiarlos desde la web:

1. En https://github.com/amarahperfum/amarah abre `js` → `app.js`.
2. Pulsa el lápiz ✏️ (**Edit this file**).
3. Cambia solo el valor que está entre comillas o el número.
4. Pulsa **Commit changes…** → **Commit changes**.

La página se actualiza en 1 o 2 minutos.

**Si cambias el número de WhatsApp,** cambia también el número que se lee en la página. Está en [`index.html`](index.html), en dos lugares: el pie de página (`3312 0864`) y el texto del carrito ("…listo para el 3312 0864").

---

## 4. Lista de respaldo

[`js/products.js`](js/products.js) tiene una copia de los productos. Solo se usa si la hoja de Google no carga (por ejemplo, si se despublica). Conviene actualizarla de vez en cuando para que se parezca a la hoja.

[`plantilla-productos.csv`](plantilla-productos.csv) es la plantilla con la que se creó la hoja.

---

## 5. Archivos del proyecto

```
index.html              estructura de la página
css/styles.css          diseño (colores, letras, animaciones)
js/app.js               configuración, carga de la hoja, carrito y WhatsApp
js/products.js          lista de productos de respaldo
img/                    logo y fotos de los frascos
plantilla-productos.csv plantilla de la hoja de Google Sheets
```

### Probar cambios en la computadora antes de subirlos

Abre la carpeta en Visual Studio Code, haz clic derecho en `index.html` y elige **Open with Live Server**.

### Publicación

La página está publicada con **GitHub Pages** (Settings → Pages → rama `main`, carpeta `/ (root)`). Cada cambio que se guarda en la rama `main` se publica solo en 1 o 2 minutos.
