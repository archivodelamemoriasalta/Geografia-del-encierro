const map = L.map('map', { zoomControl: false }).setView([-24.8, -65.4], 7);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

L.control.zoom({ position: 'bottomright' }).addTo(map);

let personas = [];
let conteoPorDepto = {};

const menuIzq = document.getElementById("panel-izquierdo");
const panelDato = document.getElementById("panel-lateral");
const contenidoPanel = document.getElementById("contenido-panel");
const tituloPanel = document.getElementById("titulo-panel");

function normalizar(texto) {
    if (!texto) return "";
    return texto.toString().toUpperCase().normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "").trim();
}

/* NUEVA ESCALA DE COLORES (exacta según tus conteos) */
function getColor(d) {
    if (d === 0) return "#222222";
    if (d === 1) return "#cd5c5c";      // 1 persona
    if (d <= 5)  return "#a52a2a";      // 2 a 5 personas
    if (d <= 10) return "#7a0000";      // 6 a 10
    if (d <= 15) return "#4a0000";      // 11 a 15
    return "#300000";                   // 16 o más (incluye 22)
}

function mostrarDepartamento(depto) {
    const deptoNorm = normalizar(depto);
    const filtradas = personas.filter(p => normalizar(p.departamento) === deptoNorm);

    tituloPanel.textContent = depto;
    contenidoPanel.innerHTML = `
        <h3>${filtradas.length} personas registradas en ${depto}</h3>
        <div class="lista-nombres">
            ${filtradas.map(p => `
                <a href="#" class="enlace-persona" data-nombre="${p.nombre}">${p.nombre}</a>
            `).join("")}
        </div>
    `;

    panelDato.classList.add("panel-abierto");

    contenidoPanel.querySelectorAll(".enlace-persona").forEach(a => {
        a.onclick = (e) => {
            e.preventDefault();
            mostrarFicha(a.dataset.nombre);
        };
    });
}

function mostrarFicha(nombre) {
    const p = personas.find(per => per.nombre === nombre);
    if (!p) return;

    tituloPanel.textContent = p.nombre;
    contenidoPanel.innerHTML = `
        <h3>${p.nombre}</h3>
        <p><strong>Fecha de Ingreso:</strong> ${p.fechaIngreso}</p>
        <p><strong>Fecha de Egreso:</strong> ${p.fechaEgreso}</p>
        <p><strong>Unidad de Destino:</strong> ${p.unidadDestino}</p>
        <p><strong>Liberado:</strong> ${p.liberado}</p>
        <p><strong>Departamento:</strong> ${p.departamento}</p>
        <p><strong>Profesión:</strong> ${p.profesion}</p>
        <button onclick="mostrarDepartamento('${p.departamento}')">← Volver al departamento</button>
    `;
}

async function cargarTodo() {
    try {
        const resCsv = await fetch("presos_politicos_salta.csv");
        const text = await resCsv.text();
        const filas = text.split("\n").filter(f => f.trim());

        filas.slice(1).forEach(f => {
            const c = f.split(";");
            let depto = (c[7] || "").trim();
            if (!depto || depto.toUpperCase() === "NULL") depto = "CAPITAL";

            const p = {
                nombre: c[1] || "Sin Información",
                fechaIngreso: (c[3] && c[3] !== "null") ? c[3] : "Sin Información",
                fechaEgreso: (c[5] && c[5] !== "null") ? c[5] : "Sin Información",
                unidadDestino: (c[6] && c[6] !== "null") ? c[6] : "Sin Información",
                liberado: (c[10] && c[10] !== "null") ? c[10] : "Sin Información",
                departamento: depto,
                profesion: (c[9] && c[9] !== "null") ? c[9] : "Sin Información"
            };

            personas.push(p);
            const key = normalizar(depto);
            conteoPorDepto[key] = (conteoPorDepto[key] || 0) + 1;
        });

        const geo = await fetch("salta_departamentos.geojson").then(r => r.json());

        L.geoJSON(geo, {
            style: f => ({
                fillColor: getColor(conteoPorDepto[normalizar(f.properties.Departamen)] || 0),
                color: "#444", weight: 1, fillOpacity: 0.8
            }),
            onEachFeature: (f, layer) => {
                layer.on("click", (e) => {
                    L.DomEvent.stopPropagation(e);
                    map.fitBounds(layer.getBounds());
                    mostrarDepartamento(f.properties.Departamen);
                });
            }
        }).addTo(map);

    } catch (error) {
        console.error("Error cargando datos:", error);
    }
}

// BOTONES
document.getElementById("menu-info").onclick = () => menuIzq.classList.add("menu-activo");
document.getElementById("cerrar-menu-izq").onclick = () => menuIzq.classList.remove("menu-activo");
document.getElementById("cerrar-panel").onclick = () => panelDato.classList.remove("panel-abierto");

cargarTodo();
