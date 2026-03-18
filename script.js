const map = L.map('map', { zoomControl: false }).setView([-24.8, -65.4], 7);

// Estilo de mapa oscuro (CartoDB Dark Matter)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// Mover control de zoom a la derecha para que no estorbe el menú
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
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Z0-9]/g, "")
        .trim();
}

function getColor(d) {
    return d > 20 ? "#4a0000" : 
           d > 10 ? "#7a0000" : 
           d > 5  ? "#a52a2a" : 
           d > 0  ? "#cd5c5c" : "#222222";
}

function mostrarDepartamento(depto) {
    const deptoNorm = normalizar(depto);
    const filtradas = personas.filter(p => normalizar(p.departamento) === deptoNorm);

    tituloPanel.textContent = depto;
    contenidoPanel.innerHTML = `
        <p style="color:#888; font-size:0.9em;">${filtradas.length} personas registradas</p>
        <div class="lista-nombres">
            ${filtradas.map(p => `<a href="#" class="enlace-persona" data-nombre="${p.nombre}">${p.nombre}</a>`).join("")}
        </div>
    `;

    panelDato.classList.add("panel-abierto");

    // Click en cada persona
    contenidoPanel.querySelectorAll(".enlace-persona").forEach(a => {
        a.onclick = (e) => {
            e.preventDefault();
            mostrarFicha(a.dataset.nombre);
        };
    });
}

function mostrarFicha(nombre) {
    const p = personas.find(pers => pers.nombre === nombre);
    if (!p) return;

    tituloPanel.textContent = p.nombre;
    contenidoPanel.innerHTML = `
        <div class="ficha-persona">
            <p><strong>Departamento:</strong> ${p.departamento}</p>
            <p><strong>Decreto:</strong> ${p.decreto || "No registrado"}</p>
            <p><strong>Fecha Ingreso:</strong> ${p.fechaIngreso || "No registrado"}</p>
            <p><strong>Estado:</strong> ${p.estado || "S/D"}</p>
            <button id="volver-depto">← Volver a ${p.departamento}</button>
        </div>
    `;

    document.getElementById("volver-depto").onclick = () => mostrarDepartamento(p.departamento);
}

async function cargarTodo() {
    try {
        const resCsv = await fetch("presos_politicos_salta.csv");
        const text = await resCsv.text();
        const filas = text.split("\n").filter(f => f.trim());

        // Procesar CSV
        filas.slice(1).forEach(f => {
            const c = f.split(";");
            const p = {
                nombre: c[1],
                departamento: c[2],
                decreto: c[3],
                fechaIngreso: c[4],
                estado: c[5]
            };
            personas.push(p);
            const key = normalizar(p.departamento);
            conteoPorDepto[key] = (conteoPorDepto[key] || 0) + 1;
        });

        // Cargar GeoJSON
        const geo = await fetch("salta_departamentos.geojson").then(r => r.json());

        L.geoJSON(geo, {
            style: f => ({
                fillColor: getColor(conteoPorDepto[normalizar(f.properties.name)] || 0),
                color: "#444",
                weight: 1,
                fillOpacity: 0.8
            }),
            onEachFeature: (f, layer) => {
                layer.on("click", (e) => {
                    map.fitBounds(layer.getBounds());
                    mostrarDepartamento(f.properties.name);
                });
            }
        }).addTo(map);

    } catch (error) {
        console.error("Error cargando datos:", error);
    }
}

// Eventos de botones
document.getElementById("menu-info").onclick = () => menuIzq.classList.add("menu-activo");
document.getElementById("cerrar-menu-izq").onclick = () => menuIzq.classList.remove("menu-activo");
document.getElementById("cerrar-panel").onclick = () => panelDato.classList.remove("panel-abierto");

cargarTodo();
