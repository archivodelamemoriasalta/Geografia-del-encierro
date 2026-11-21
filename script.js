// ================= MAPA BASE =================
const map = L.map('map', { zoomControl: false }).setView([-24.8, -65.4], 7);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap · © CARTO',
    subdomains: 'abcd',
    maxZoom: 18
}).addTo(map);
L.control.zoom({ position: 'bottomright' }).addTo(map);

let personas = [];
let conteoPorDepto = {};
const capas = {};        // departamento normalizado -> capa Leaflet
const nombres = {};      // departamento normalizado -> nombre para mostrar
let capaSeleccionada = null;

const menuIzq = document.getElementById("panel-izquierdo");
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
    if (n === 0) return "#2f353d";
    if (n === 1) return "#8a4b43";
    if (n <= 5) return "#b5503f";
    if (n <= 10) return "#d4623f";
    if (n <= 15) return "#e8803f";
    return "#f2b45a";
}

// Lee el CSV aunque venga de Excel (UTF-8 o Windows-1252, con BOM, comillas y ; o ,)
function decodificar(buffer) {
    try { return new TextDecoder("utf-8", { fatal: true }).decode(buffer); }
    catch { return new TextDecoder("windows-1252").decode(buffer); }
}

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
    return lista.length ? `<ul class="lista-personas">${lista.map(itemPersona).join("")}</ul>` : `<p>Sin registros incorporados todavía.</p>`;
}

function abrirPanel() {
    panelDato.classList.add("panel-abierto");
    menuIzq.classList.remove("menu-activo");
}

function seleccionarCapa(norm) {
    if (capaSeleccionada) capaSeleccionada.setStyle(estiloBase(capaSeleccionada.feature));
    capaSeleccionada = capas[norm] || null;
    if (capaSeleccionada) {
        capaSeleccionada.setStyle({ color: "#d8b36a", weight: 3 });
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
            paddingBottomRight: movil ? [16, Math.round(window.innerHeight * 0.5) + 8] : [460, 16],
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
    return { fillColor: getColor(n), fillOpacity: 0.75, color: "#6b7480", weight: 1 };
}
let claveDepto = "Departamen";

async function cargarCSV() {
    const res = await fetch("presos_politicos_salta.csv");
    if (!res.ok) throw new Error(`No se pudo leer presos_politicos_salta.csv (HTTP ${res.status}). Revisá que el archivo esté en la misma carpeta que index.html y que el nombre coincida exactamente.`);
    const filas = parsearCSV(decodificar(await res.arrayBuffer()));

    filas.slice(1).forEach(c => {
        const raw = (c[7] || "").trim();
        const esFederal = raw === "" || raw.toUpperCase() === "NULL";
        const depto = esFederal ? "CAPITAL" : raw;
        if (!(c[1] || "").trim()) return;
        personas.push({
            nombre: c[1].trim(),
            decreto: c[2] || "Sin decreto",
            fechaIngreso: c[3] || "Sin información",
            fechaTraslado: c[4] || "Sin traslado",
            unidadDestino: c[6] || "Sin información",
            liberado: c[10] || c[5] || "Sin información",
            departamento: depto,
            profesion: c[9] || "Sin información",
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
                mouseover: () => { if (layer !== capaSeleccionada) layer.setStyle({ weight: 2, color: "#e8e4dc" }); },
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
document.getElementById("menu-info").onclick = () => { menuIzq.classList.add("menu-activo"); panelDato.classList.remove("panel-abierto"); };
document.getElementById("cerrar-menu-izq").onclick = () => menuIzq.classList.remove("menu-activo");
document.getElementById("cerrar-panel").onclick = () => { panelDato.classList.remove("panel-abierto"); seleccionarCapa(null); };
document.getElementById("btn-galeria").onclick = () => { window.location.href = "galeria.html"; };
document.addEventListener("keydown", e => {
    if (e.key === "Escape") { menuIzq.classList.remove("menu-activo"); panelDato.classList.remove("panel-abierto"); }
});

iniciar();
