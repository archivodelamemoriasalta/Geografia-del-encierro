const map = L.map('map', { zoomControl: false }).setView([-24.8, -65.4], 7);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: 'Map tiles by Carto • Data by OpenStreetMap'
}).addTo(map);
L.control.zoom({ position: 'bottomright' }).addTo(map);

let personas = [];
let conteoPorDepto = {};

const menuIzq = document.getElementById("panel-izquierdo");
const panelDato = document.getElementById("panel-lateral");
const contenidoPanel = document.getElementById("contenido-panel");
const tituloPanel = document.getElementById("titulo-panel");

function normalizar(texto) {
    return (texto || "").toString().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "").trim();
}

function getColor(d) {
    return d > 15  ? '#7f0000' :
           d > 10  ? '#a50026' :
           d > 5   ? '#d73027' :
           d > 2   ? '#f46d43' :
           d > 0   ? '#fdae61' :
                     '#ffffb2';
}

function mostrarDepartamento(depto) {
    const deptoNorm = normalizar(depto);
    const filtradas = personas.filter(p => normalizar(p.departamento) === deptoNorm);

    tituloPanel.textContent = depto;
    let html = `<h3>📍 ${filtradas.length} personas en ${depto}</h3>`;

    if (depto === "CAPITAL") {
        const normales = filtradas.filter(p => !p.esFederal);
        const federales = filtradas.filter(p => p.esFederal);

        html += `
            <h4 style="color:#ffaa00; margin:20px 0 8px;">📍 De Capital (${normales.length})</h4>
            <ul class="lista-personas">\( {normales.map(p => `<li><a href="#" class="enlace-persona" data-nombre=" \){p.nombre}">👤 ${p.nombre}</a></li>`).join("")}</ul>
            
            <h4 style="color:#ffaa00; margin:20px 0 8px;">🚔 Provenientes de la Policía Federal (${federales.length})</h4>
            <ul class="lista-personas">\( {federales.map(p => `<li><a href="#" class="enlace-persona" data-nombre=" \){p.nombre}">👤 ${p.nombre}</a></li>`).join("")}</ul>
        `;
    } else {
        html += `<ul class="lista-personas">\( {filtradas.map(p => `<li><a href="#" class="enlace-persona" data-nombre=" \){p.nombre}">👤 ${p.nombre}</a></li>`).join("")}</ul>`;
    }

    contenidoPanel.innerHTML = html;
    panelDato.classList.add("panel-abierto");

    contenidoPanel.querySelectorAll(".enlace-persona").forEach(a => {
        a.onclick = (e) => { e.preventDefault(); mostrarFicha(a.dataset.nombre); };
    });
}

function mostrarFicha(nombre) {
    const p = personas.find(per => per.nombre === nombre);
    if (!p) return;

    tituloPanel.textContent = p.nombre;
    contenidoPanel.innerHTML = `
        <h3>👤 ${p.nombre}</h3>
        <p><strong>📜 Decreto de detención:</strong> ${p.decreto}</p>
        <p><strong>📅 Fecha de Ingreso:</strong> ${p.fechaIngreso}</p>
        <p><strong>📅 Fecha de Traslado:</strong> ${p.fechaTraslado}</p>
        <p><strong>🏛️ Unidad de Destino:</strong> ${p.unidadDestino}</p>
        <p><strong>🔓 Liberado / Estado:</strong> ${p.liberado}</p>
        <p><strong>🗺️ Departamento:</strong> ${p.departamento}</p>
        <p><strong>💼 Profesión:</strong> ${p.profesion}</p>
        <button onclick="mostrarDepartamento('${p.departamento}')">← Volver al departamento</button>
    `;
}

async function cargarTodo() {
    const resCsv = await fetch("presos_politicos_salta.csv");
    const text = await resCsv.text();
    const filas = text.split("\n").filter(f => f.trim());

    filas.slice(1).forEach(f => {
        const c = f.split(";");
        
        // ✅ CORRECCIÓN: índices exactos según tus encabezados
        const rawDepto = (c[7] || "").trim();
        const esFederal = rawDepto === "" || rawDepto.toUpperCase() === "NULL";
        let depto = (rawDepto && rawDepto.toUpperCase() !== "NULL") ? rawDepto : "CAPITAL";

        personas.push({
            nombre: c[1] || "Sin Información",           // NombreCompleto
            decreto: c[2] || "Sin decreto",              // Decreto
            fechaIngreso: c[3] || "Sin Información",     // FechaIngreso
            fechaTraslado: c[4] || "Sin traslado",       // FechaTraslado
            unidadDestino: c[5] || "Sin Información",    // Unidad Destino ← corregido
            liberado: c[6] || "Sin Información",         // Liberado ← corregido
            departamento: depto,
            profesion: c[8] || "Sin Información",        // Profesion ← corregido
            esFederal: esFederal
        });

        conteoPorDepto[normalizar(depto)] = (conteoPorDepto[normalizar(depto)] || 0) + 1;
    });

    const geo = await fetch("salta_departamentos.geojson").then(r => r.json());
    L.geoJSON(geo, {
        style: f => ({ fillColor: getColor(conteoPorDepto[normalizar(f.properties.Departamen)] || 0), color: "#444", weight: 1, fillOpacity: 0.8 }),
        onEachFeature: (f, layer) => {
            layer.on("click", () => {
                map.fitBounds(layer.getBounds());
                mostrarDepartamento(f.properties.Departamen);
            });
        }
    }).addTo(map);
}

// Botones
document.getElementById("menu-info").onclick = () => menuIzq.classList.add("menu-activo");
document.getElementById("cerrar-menu-izq").onclick = () => menuIzq.classList.remove("menu-activo");
document.getElementById("cerrar-panel").onclick = () => panelDato.classList.remove("panel-abierto");

cargarTodo();