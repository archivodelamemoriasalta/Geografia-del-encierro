// ================= MAPA BASE =================
const map = L.map('map', { zoomControl: false, dragging: !L.Browser.mobile, tap: false }).setView([-24.8, -65.4], 7);
// Mapa base oscuro de Esri (no requiere clave). CARTO ahora exige API key.
const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/";
const base = L.tileLayer(ESRI + "World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles © Esri — Esri, HERE, Garmin, © OpenStreetMap contributors",
    maxNativeZoom: 16,
    maxZoom: 18
}).addTo(map);
// Nombres de ciudades y rutas encima de los departamentos
map.createPane("etiquetas").style.zIndex = 650;
map.getPane("etiquetas").style.pointerEvents = "none";
L.tileLayer(ESRI + "World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}", {
    pane: "etiquetas", maxNativeZoom: 16, maxZoom: 18
}).addTo(map);
base.once("tileerror", () => mostrarError("No se pudo cargar el mapa base. Revisá tu conexión o si algún bloqueador la está cortando."));
L.control.zoom({ position: 'bottomright' }).addTo(map);

let personas = [];
let conteoPorDepto = {};
const capas = {};        // departamento normalizado -> capa Leaflet
const nombres = {};      // departamento normalizado -> nombre para mostrar
let capaSeleccionada = null;

const panelDato = document.getElementById("panel-lateral");
const contenidoPanel = document.getElementById("contenido-panel");
const tituloPanel = document.getElementById("titulo-panel");
const aviso = document.getElementById("aviso");

// ================= UTILIDADES =================
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function normalizar(t) {
    return (t || "").toString().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "");
}

function mostrarError(msg) {
    aviso.textContent = msg;
    aviso.hidden = false;
    console.error(msg);
}

// Rampa de color: más personas = más intenso
function getColor(n) {
    if (n === 0) return "#242424";
    if (n === 1) return "#555555";
    if (n <= 5) return "#7d7d7d";
    if (n <= 10) return "#a6a6a6";
    if (n <= 15) return "#d0d0d0";
    return "#ffffff";
}

// Lee el CSV aunque venga de Excel (UTF-8 o Windows-1252, con BOM, comillas y ; o ,)
function decodificar(buffer) {
    try { return new TextDecoder("utf-8", { fatal: true }).decode(buffer); }
    catch { return new TextDecoder("windows-1252").decode(buffer); }
}

// Repara tildes rotas tipo "CÃ¡mara" o "paÃ­s" (UTF-8 leído como Windows-1252)
function repararTildes(s) {
    if (!/[ÃÂ]/.test(s)) return s;
    const cod = Array.from(s, ch => ch.charCodeAt(0));
    if (cod.some(n => n > 255)) return s;
    try { return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(cod)).replace(/\u00AD/g, ""); }
    catch { return s; }
}

// Quita espacios sobrantes y trata "-" y "null" como vacío
function limpiar(s) {
    const t = repararTildes((s || "").replace(/\s+/g, " ").trim());
    return (t === "-" || t.toLowerCase() === "null") ? "" : t;
}

// "Salta" no es un departamento: corresponde a Capital
const ALIAS_DEPTO = { SALTA: "CAPITAL" };

function parsearCSV(texto) {
    texto = texto.replace(/^\uFEFF/, "");
    const primera = texto.split(/\r?\n/)[0];
    const delim = (primera.match(/;/g) || []).length >= (primera.match(/,/g) || []).length ? ";" : ",";
    const filas = [];
    let fila = [], celda = "", comillas = false;
    for (let i = 0; i < texto.length; i++) {
        const ch = texto[i];
        if (comillas) {
            if (ch === '"' && texto[i + 1] === '"') { celda += '"'; i++; }
            else if (ch === '"') comillas = false;
            else celda += ch;
        } else if (ch === '"') comillas = true;
        else if (ch === delim) { fila.push(celda); celda = ""; }
        else if (ch === "\n") { fila.push(celda); filas.push(fila); fila = []; celda = ""; }
        else if (ch !== "\r") celda += ch;
    }
    if (celda || fila.length) { fila.push(celda); filas.push(fila); }
    return filas.filter(f => f.some(c => c.trim()));
}

// ================= PANEL DE DETALLE =================
function itemPersona(p) {
    return `<li><a href="#" class="enlace-persona" data-nombre="${esc(p.nombre)}">${esc(p.nombre)}</a></li>`;
}

function listaPersonas(lista) {
    const orden = [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    return lista.length ? `<ul class="lista-personas">${orden.map(itemPersona).join("")}</ul>` : `<p>Sin registros incorporados todavía.</p>`;
}

function abrirPanel() {
    panelDato.classList.add("panel-abierto");
}

function seleccionarCapa(norm) {
    if (capaSeleccionada) capaSeleccionada.setStyle(estiloBase(capaSeleccionada.feature));
    capaSeleccionada = capas[norm] || null;
    if (capaSeleccionada) {
        capaSeleccionada.setStyle({ color: "#ffffff", weight: 3 });
        capaSeleccionada.bringToFront();
    }
}

function mostrarDepartamento(depto) {
    const norm = normalizar(depto);
    const filtradas = personas.filter(p => normalizar(p.departamento) === norm);
    tituloPanel.textContent = depto;

    let html = `<h3>${filtradas.length} ${filtradas.length === 1 ? "persona" : "personas"} en ${esc(depto)}</h3>`;
    if (norm === "CAPITAL") {
        const normales = filtradas.filter(p => !p.esFederal);
        const federales = filtradas.filter(p => p.esFederal);
        html += `<h4>De Capital (${normales.length})</h4>${listaPersonas(normales)}
                 <h4>Provenientes de la Policía Federal (${federales.length})</h4>${listaPersonas(federales)}`;
    } else {
        html += listaPersonas(filtradas);
    }
    contenidoPanel.innerHTML = html;
    contenidoPanel.scrollTop = 0;
    panelDato.scrollTop = 0;

    contenidoPanel.querySelectorAll(".enlace-persona").forEach(a => {
        a.addEventListener("click", e => { e.preventDefault(); mostrarFicha(a.dataset.nombre); });
    });

    seleccionarCapa(norm);
    abrirPanel();

    // Encuadra el departamento en la parte del mapa que queda visible
    if (capas[norm]) {
        const movil = window.matchMedia("(max-width: 767px)").matches;
        map.fitBounds(capas[norm].getBounds(), {
            paddingTopLeft: [16, 16],
            paddingBottomRight: movil ? [16, Math.round(map.getSize().y * 0.55) + 8] : [400, 16],
            maxZoom: 11
        });
    }
}

function mostrarFicha(nombre) {
    const p = personas.find(x => x.nombre === nombre);
    if (!p) return;
    tituloPanel.textContent = p.nombre;
    const dato = (t, v) => `<p class="dato"><span>${t}</span>${esc(v)}</p>`;
    contenidoPanel.innerHTML = `
        ${dato("Decreto de detención", p.decreto)}
        ${dato("Fecha de ingreso", p.fechaIngreso)}
        ${dato("Fecha de traslado", p.fechaTraslado)}
        ${dato("Unidad de destino", p.unidadDestino)}
        ${dato("Liberado / estado", p.liberado)}
        ${dato("Departamento", p.departamento)}
        ${dato("Profesión", p.profesion)}
        <button class="btn-volver" type="button">← Volver al departamento</button>`;
    contenidoPanel.querySelector(".btn-volver").addEventListener("click", () => mostrarDepartamento(p.departamento));
    panelDato.scrollTop = 0;
}

// ================= CARGA DE DATOS =================
function estiloBase(f) {
    const n = conteoPorDepto[normalizar(f.properties[claveDepto])] || 0;
    return { fillColor: getColor(n), fillOpacity: 0.85, color: "#0a0a0a", weight: 1 };
}
let claveDepto = "Departamen";

async function cargarCSV() {
    const res = await fetch("presos_politicos_salta.csv");
    if (!res.ok) throw new Error(`No se pudo leer presos_politicos_salta.csv (HTTP ${res.status}). Revisá que el archivo esté en la misma carpeta que index.html y que el nombre coincida exactamente.`);
    const filas = parsearCSV(decodificar(await res.arrayBuffer()));

    // Las columnas se buscan por el nombre del encabezado, no por posición
    const encabezado = filas[0].map(normalizar);
    const idx = n => encabezado.indexOf(n);
    const I = { nombre: idx("NOMBRECOMPLETO"), decreto: idx("DECRETO"), ingreso: idx("FECHAINGRESO"),
                traslado: idx("FECHATRASLADO"), unidad: idx("UNIDADDESTINO"), liberado: idx("LIBERADO"),
                depto: idx("DEPARTAMEN"), profesion: idx("PROFESION") };
    if (Object.values(I).includes(-1)) throw new Error("El encabezado del CSV no tiene los nombres esperados: " + filas[0].join(" | "));
    const get = (c, k, vacio) => limpiar(c[I[k]]) || vacio;

    filas.slice(1).forEach(c => {
        const nombre = limpiar(c[I.nombre]);
        if (!nombre) return;
        const raw = limpiar(c[I.depto]);
        const esFederal = raw === "" || raw.toUpperCase() === "NULL";
        const depto = esFederal ? "CAPITAL" : (ALIAS_DEPTO[normalizar(raw)] || raw);
        personas.push({
            nombre,
            decreto: get(c, "decreto", "Sin decreto"),
            fechaIngreso: get(c, "ingreso", "Sin información"),
            fechaTraslado: get(c, "traslado", "Sin traslado"),
            unidadDestino: get(c, "unidad", "Sin información"),
            liberado: get(c, "liberado", "Sin información"),
            departamento: depto,
            profesion: get(c, "profesion", "Sin información"),
            esFederal
        });
        const k = normalizar(depto);
        conteoPorDepto[k] = (conteoPorDepto[k] || 0) + 1;
    });
    if (!personas.length) throw new Error("El CSV se leyó pero no se encontraron filas con datos. Revisá el separador (;) y que la columna 2 tenga los nombres.");
}

async function cargarGeoJSON() {
    const res = await fetch("salta_departamentos.geojson");
    if (!res.ok) throw new Error(`No se pudo leer salta_departamentos.geojson (HTTP ${res.status}).`);
    const geo = await res.json();

    const props = geo.features?.[0]?.properties || {};
    claveDepto = Object.keys(props).find(k => /^depart/i.test(k)) || claveDepto;

    const capa = L.geoJSON(geo, {
        style: estiloBase,
        onEachFeature: (f, layer) => {
            const nombre = f.properties[claveDepto];
            const norm = normalizar(nombre);
            capas[norm] = layer;
            nombres[norm] = nombre;
            const n = conteoPorDepto[norm] || 0;
            layer.bindTooltip(`${esc(nombre)}: ${n} ${n === 1 ? "persona" : "personas"}`, { sticky: true });
            layer.on({
                click: () => mostrarDepartamento(nombre),
                mouseover: () => { if (layer !== capaSeleccionada) layer.setStyle({ weight: 2, color: "#ffffff" }); },
                mouseout: () => { if (layer !== capaSeleccionada) layer.setStyle(estiloBase(f)); }
            });
        }
    }).addTo(map);

    const b = capa.getBounds();
    // Si las coordenadas no están en grados (WGS84), el polígono no aparece en el mapa
    if (!b.isValid() || Math.abs(b.getNorth()) > 90 || Math.abs(b.getEast()) > 180) {
        throw new Error("El GeoJSON no está en WGS84 (EPSG:4326), por eso el mapa no dibuja los departamentos. Reproyectalo en QGIS: Exportar → Guardar entidades como → CRS EPSG:4326.");
    }
    map.fitBounds(b, { padding: [10, 10] });
}

function agregarLeyenda() {
    const l = L.control({ position: "bottomleft" });
    l.onAdd = () => {
        const d = L.DomUtil.create("div", "leyenda");
        const tramos = [[0, "Sin registros"], [1, "1"], [3, "2 a 5"], [8, "6 a 10"], [12, "11 a 15"], [20, "Más de 15"]];
        d.innerHTML = "<b>Personas por departamento</b>" + tramos.map(([n, t]) => `<div><i style="background:${getColor(n)}"></i>${t}</div>`).join("");
        return d;
    };
    l.addTo(map);
}

async function iniciar() {
    try { await cargarCSV(); } catch (e) { mostrarError(e.message); }
    try { await cargarGeoJSON(); agregarLeyenda(); } catch (e) { mostrarError(e.message); }
}

// ================= BOTONES =================
document.getElementById("cerrar-panel").onclick = () => { panelDato.classList.remove("panel-abierto"); seleccionarCapa(null); };
document.addEventListener("keydown", e => {
    if (e.key === "Escape") { panelDato.classList.remove("panel-abierto"); seleccionarCapa(null); }
});

iniciar();
