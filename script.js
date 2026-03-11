// ========================
// 🌎 Configuración del Mapa
// ========================
const map = L.map('map').setView([-24.8, -65.4], 7);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

let personas = [];
let conteoPorDepto = {};

// Elementos de la interfaz
const menuIzq = document.getElementById("panel-izquierdo");
const panelDato = document.getElementById("panel-lateral");

// ========================
// 🔹 Funciones de Interfaz
// ========================

// Abrir/Cerrar menú institucional (Izquierdo)
document.getElementById("menu-info").addEventListener("click", (e) => {
    e.stopPropagation();
    menuIzq.classList.add("menu-activo");
});

document.getElementById("cerrar-menu-izq").addEventListener("click", () => {
    menuIzq.classList.remove("menu-activo");
});

// Cerrar panel de datos (Derecho)
document.getElementById("cerrar-panel").addEventListener("click", () => {
    panelDato.classList.add("panel-cerrado");
    panelDato.classList.remove("panel-abierto");
});

// Acordeón institucional
document.querySelectorAll(".acordeon-titulo").forEach(t => {
    t.addEventListener("click", () => t.parentElement.classList.toggle("activo"));
});

// ========================
// 🔹 Lógica de Datos y Mapa
// ========================

function normalizar(texto) {
    if (!texto) return "";
    return texto.toString().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function getColor(d) {
    return d > 20 ? "#4a0000" : d > 10 ? "#7a0000" : d > 5 ? "#a52a2a" : d > 0 ? "#cd5c5c" : "#333";
}

function mostrarDepartamento(depto) {
    const panelTitulo = document.getElementById("titulo-panel");
    const panelContenido = document.getElementById("contenido-panel");
    
    const deptoNorm = normalizar(depto);
    const filtradas = personas.filter(p => normalizar(p.departamento) === deptoNorm);
    
    panelTitulo.textContent = depto;
    panelContenido.innerHTML = `
        <div style="color:#6b0f1a; font-weight:bold; margin-bottom:10px;">${filtradas.length} Personas registradas</div>
        <ul class="lista-detenidos">
            ${filtradas.map(p => `<li>${p.nombre}</li>`).join("")}
        </ul>
    `;
    
    panelDato.classList.remove("panel-cerrado");
    panelDato.classList.add("panel-abierto");
}

// ========================
// 🔹 Carga de Archivos (CSV + GeoJSON)
// ========================

async function cargarDatos() {
    try {
        // 1. Cargar CSV con detección de columnas
        const resCsv = await fetch("presos_politicos_salta.csv");
        const csvText = await resCsv.text();
        const filas = csvText.split("\n").filter(f => f.trim() !== "");
        const encabezados = filas[0].split(";");

        const indexDepto = encabezados.findIndex(col => normalizar(col).includes("DEPARTAMEN"));
        const indexNombre = encabezados.findIndex(col => normalizar(col).includes("NOMBRE"));

        filas.slice(1).forEach(fila => {
            const columnas = fila.split(";");
            const nombre = columnas[indexNombre]?.trim();
            const depto = columnas[indexDepto]?.trim();
            
            if (depto) {
                const deptoNorm = normalizar(depto);
                personas.push({ nombre: nombre, departamento: depto });
                conteoPorDepto[deptoNorm] = (conteoPorDepto[deptoNorm] || 0) + 1;
            }
        });

        // 2. Cargar GeoJSON y vincularlo
        const resGeo = await fetch("salta_departamentos.geojson");
        const geoData = await resGeo.json();

        L.geoJSON(geoData, {
            style: feature => {
                const nombreGeo = normalizar(feature.properties.Departamen || feature.properties.NAM);
                const valor = conteoPorDepto[nombreGeo] || 0;
                return { 
                    fillColor: getColor(valor), 
                    weight: 1, 
                    color: "white", 
                    fillOpacity: 0.7 
                };
            },
            onEachFeature: (feature, layer) => {
                layer.on('click', (e) => {
                    L.DomEvent.stopPropagation(e);
                    const nombreReal = feature.properties.Departamen || feature.properties.NAM;
                    mostrarDepartamento(nombreReal);
                });
            }
        }).addTo(map);

    } catch (e) {
        console.error("Error cargando archivos:", e);
    }
}

cargarDatos();

// Cerrar todo al tocar el mapa vacío
map.on('click', () => {
    panelDato.classList.add("panel-cerrado");
    panelDato.classList.remove("panel-abierto");
    menuIzq.classList.remove("menu-activo");
});
