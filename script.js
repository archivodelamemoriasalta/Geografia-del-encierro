```javascript
const map = L.map('map', { zoomControl: false }).setView([-24.8, -65.4], 7);

// Tile oscuro
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

// ERROR 3 CORREGIDO
function mostrarDepartamento(depto) {
    const deptoNorm = normalizar(depto);
    const filtradas = personas.filter(p => normalizar(p.departamento) === deptoNorm);

    tituloPanel.textContent = depto;
    contenidoPanel.innerHTML = `
        <h3>${filtradas.length} personas registradas en ${depto}</h3>
        <div class="lista-personas">
            ${filtradas.map(p => `
                <a href="#" class="enlace-persona" data-nombre="${p.nombre}">${p.nombre}</a>
            `).join("")}
        </div>
    `;

    panelDato.classList.add("panel-abierto");

    // Hacer clic en cada nombre
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
        <h3>${p.nombre}</h3>
        <p><strong>Departamento:</strong> ${p.departamento}</p>
        <p><strong>Decreto:</strong> ${p.decreto || "No registrado"}</p>
        <p><strong>Fecha Ingreso:</strong> ${p.fechaIngreso || "No registrado"}</p>
        <p><strong>Profesión:</strong> ${p.profesion || "No registrado"}</p>
        <p><strong>Localidad:</strong> ${p.localidad || "No registrado"}</p>
        <p><strong>Estado:</strong> ${p.estado || "No registrado"}</p>
        <p><strong>Observaciones:</strong> ${p.observaciones || "Sin observaciones"}</p>
        
        <button id="volver-depto" onclick="mostrarDepartamento('${p.departamento}')">← Volver al departamento</button>
    `;
}

// CARGAR TODO (ERROR 2 + 3)
async function cargarTodo() {
    try {
        const resCsv = await fetch("presos_politicos_salta.csv");
        const text = await resCsv.text();
        const filas = text.split("\n").filter(f => f.trim());

        // Procesar CSV (columnas corregidas)
        filas.slice(1).forEach(f => {
            const c = f.split(";");
            const p = {
                nombre: c[1] || "",
                departamento: c[7] || "",
                decreto: c[2] || "",
                fechaIngreso: c[3] || "",
                profesion: c[9] || "",
                localidad: c[8] || "",
                estado: c[10] || "",
                observaciones: c[11] || ""
            };
            personas.push(p);
            const key = normalizar(p.departamento);
            conteoPorDepto[key] = (conteoPorDepto[key] || 0) + 1;
        });

        // Cargar GeoJSON (campo corregido)
        const geo = await fetch("salta_departamentos.geojson").then(r => r.json());

        L.geoJSON(geo, {
            style: f => ({
                fillColor: getColor(conteoPorDepto[normalizar(f.properties.Departamen)] || 0),
                color: "#444",
                weight: 1,
                fillOpacity: 0.8
            }),
            onEachFeature: (f, layer) => {
                const deptoName = f.properties.Departamen;
                layer.on("click", (e) => {
                    map.fitBounds(layer.getBounds());
                    mostrarDepartamento(deptoName);
                });
            }
        }).addTo(map);

    } catch (error) {
        console.error("Error cargando datos:", error);
    }
}

// Botones
document.getElementById("menu-info").onclick = () => menuIzq.classList.add("menu-activo");
document.getElementById("cerrar-menu-izq").onclick = () => menuIzq.classList.remove("menu-activo");
document.getElementById("cerrar-panel").onclick = () => panelDato.classList.remove("panel-abierto");

cargarTodo();
```
