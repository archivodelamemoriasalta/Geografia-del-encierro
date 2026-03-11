// ========================
// 🌎 Configuración del Mapa
// ========================
const map = L.map('map').setView([-24.8, -65.4], 7);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

let personas = [];
let conteoPorDepto = {};

const menuIzq = document.getElementById("panel-izquierdo");
const panelDato = document.getElementById("panel-lateral");

// ========================
// 🔹 Normalización (Mantiene la conexión móvil)
// ========================
function normalizar(texto) {
    if (!texto) return "";
    return texto.toString().toUpperCase().normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\b(DEPARTAMENTO|DEPTO|PARTIDO|LA|EL|LOS|LAS)\b/g, "")
        .replace(/[^A-Z0-9]/g, "")
        .trim();
}

function getColor(d) {
    return d > 20 ? "#4a0000" : d > 10 ? "#7a0000" : d > 5 ? "#a52a2a" : d > 0 ? "#cd5c5c" : "#333333";
}

// ========================
// 🔹 Lógica de Navegación (Fichas)
// ========================

// 1. Vista de Lista por Departamento
function mostrarDepartamento(depto) {
    const deptoNorm = normalizar(depto);
    const filtradas = personas.filter(p => normalizar(p.departamento) === deptoNorm);
    
    const panelTitulo = document.getElementById("titulo-panel");
    const panelContenido = document.getElementById("contenido-panel");

    panelTitulo.textContent = depto;
    panelContenido.innerHTML = `
        <div style="color:#6b0f1a; font-weight:bold; margin-bottom:10px;">${filtradas.length} Personas registradas</div>
        <ul class="lista-detenidos">
            ${filtradas.map(p => `<li><a href="#" class="enlace-persona" data-nombre="${p.nombre}">${p.nombre}</a></li>`).join("")}
        </ul>
    `;

    // Abrir panel
    panelDato.classList.remove("panel-cerrado");
    panelDato.classList.add("panel-abierto");

    // Eventos para los nombres (Navegación a Ficha)
    panelContenido.querySelectorAll(".enlace-persona").forEach(a => {
        a.addEventListener("click", (e) => {
            e.preventDefault();
            mostrarFicha(a.dataset.nombre);
        });
    });
}

// 2. Vista de Ficha Individual
function mostrarFicha(nombre) {
    const persona = personas.find(p => p.nombre === nombre);
    if (!persona) return;

    const panelTitulo = document.getElementById("titulo-panel");
    const panelContenido = document.getElementById("contenido-panel");

    panelTitulo.textContent = persona.nombre;
    panelContenido.innerHTML = `
        <div class="ficha-persona">
            <p><strong>📍 Departamento:</strong> ${persona.departamento}</p>
            <p><strong>📄 Decreto:</strong> ${persona.decreto || "No registrado"}</p>
            <p><strong>📅 Ingreso:</strong> ${persona.fechaIngreso || "No registrado"}</p>
            <p><strong>⚖️ Estado:</strong> ${persona.estado || "No registrado"}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
            <button id="volver-depto" class="btn-volver" style="background:#6b0f1a; color:white; border:none; padding:8px 12px; border-radius:4px; cursor:pointer;">
                ← Volver al departamento
            </button>
        </div>
    `;

    document.getElementById("volver-depto").addEventListener("click", () => {
        mostrarDepartamento(persona.departamento);
    });
}

// ========================
// 🔹 Carga de Archivos
// ========================
async function cargarTodo() {
    try {
        const resCsv = await fetch("presos_politicos_salta.csv?v=" + Date.now());
        const csvText = await resCsv.text();
        
        const filas = csvText.split("\n").filter(f => f.trim() !== "");
        const encabezados = filas[0].split(";");
        
        // Buscamos los índices de las columnas
        const idxDepto = encabezados.findIndex(col => normalizar(col).includes("DEPARTAMEN"));
        const idxNombre = encabezados.findIndex(col => normalizar(col).includes("NOMBRE"));
        const idxDecreto = encabezados.findIndex(col => normalizar(col).includes("DECRETO"));
        const idxFecha = encabezados.findIndex(col => normalizar(col).includes("FECHA"));
        const idxEstado = encabezados.findIndex(col => normalizar(col).includes("ESTADO"));

        filas.slice(1).forEach(fila => {
            const cols = fila.split(";");
            const depto = cols[idxDepto]?.trim();
            if (depto) {
                const deptoNorm = normalizar(depto);
                personas.push({ 
                    nombre: cols[idxNombre]?.trim(), 
                    departamento: depto,
                    decreto: cols[idxDecreto]?.trim(),
                    fechaIngreso: cols[idxFecha]?.trim(),
                    estado: cols[idxEstado]?.trim()
                });
                conteoPorDepto[deptoNorm] = (conteoPorDepto[deptoNorm] || 0) + 1;
            }
        });

        const resGeo = await fetch("salta_departamentos.geojson?v=" + Date.now());
        const geoData = await resGeo.json();

        const capaGeo = L.geoJSON(geoData, {
            style: feature => {
                const nombreGeo = normalizar(feature.properties.Departamen || feature.properties.NAM || feature.properties.name);
                const valor = conteoPorDepto[nombreGeo] || 0;
                return { fillColor: getColor(valor), weight: 1.5, color: "white", fillOpacity: 0.8 };
            },
            onEachFeature: (feature, layer) => {
                layer.on('click', (e) => {
                    L.DomEvent.stopPropagation(e);
                    mostrarDepartamento(feature.properties.Departamen || feature.properties.NAM || feature.properties.name);
                });
            }
        }).addTo(map);

        // Refresco para Android
        setTimeout(() => {
            capaGeo.eachLayer(l => {
                const n = normalizar(l.feature.properties.Departamen || l.feature.properties.NAM || l.feature.properties.name);
                l.setStyle({ fillColor: getColor(conteoPorDepto[n] || 0) });
            });
        }, 500);

    } catch (e) {
        console.error("Error cargando datos:", e);
    }
}

// --- Eventos Globales ---
document.getElementById("menu-info").addEventListener("click", () => menuIzq.classList.add("menu-activo"));
document.getElementById("cerrar-menu-izq").addEventListener("click", () => menuIzq.classList.remove("menu-activo"));
document.getElementById("cerrar-panel").addEventListener("click", () => {
    panelDato.classList.add("panel-cerrado");
    panelDato.classList.remove("panel-abierto");
});
map.on('click', () => {
    panelDato.classList.add("panel-cerrado");
    menuIzq.classList.remove("menu-activo");
});

document.querySelectorAll(".acordeon-titulo").forEach(t => {
    t.addEventListener("click", () => t.parentElement.classList.toggle("activo"));
});

cargarTodo();
