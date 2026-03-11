// 1. Configuración base del Mapa
const map = L.map('map').setView([-24.8, -65.4], 7);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// Variables globales para los datos
let personas = [];
let conteoPorDepto = {};

// Elementos de la interfaz
const btnMenu = document.getElementById("menu-info");
const menuIzq = document.getElementById("panel-izquierdo");
const btnCerrarIzq = document.getElementById("cerrar-menu-izq");
const panelDato = document.getElementById("panel-lateral");

// --- LÓGICA DE INTERFAZ (BOTONES) ---

function toggleMenuIzquierdo(e) {
    if (e) e.preventDefault();
    menuIzq.classList.toggle("menu-activo");
}

btnMenu.addEventListener("click", toggleMenuIzquierdo);
if(btnCerrarIzq) {
    btnCerrarIzq.addEventListener("click", () => menuIzq.classList.remove("menu-activo"));
}

document.querySelectorAll(".acordeon-titulo").forEach(t => {
    t.addEventListener("click", () => t.parentElement.classList.toggle("activo"));
});

// --- LÓGICA DE DATOS ---

// Función para limpiar texto (quita acentos y espacios)
function normalizar(texto) {
    if (!texto) return "";
    return texto.toString().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

// Colores según la cantidad de personas
function getColor(d) {
    return d > 20 ? "#2b0000" :
           d > 10 ? "#5a0000" :
           d > 5  ? "#8b0000" :
           d > 0  ? "#b22222" :
                    "#f5f5f5";
}

// Mostrar info en el panel derecho/inferior
function mostrarDepartamento(depto) {
    const panelTitulo = document.getElementById("titulo-panel");
    const panelContenido = document.getElementById("contenido-panel");
    
    const deptoNorm = normalizar(depto);
    const filtradas = personas.filter(p => normalizar(p.departamento) === deptoNorm);
    
    panelTitulo.textContent = depto;
    panelContenido.innerHTML = `
        <div style="margin-bottom: 15px; font-weight: bold; color: #8b0000;">
            ${filtradas.length} personas registradas
        </div>
        <ul class="lista-detenidos">
            ${filtradas.map(p => `<li>${p.nombre}</li>`).join("")}
        </ul>
    `;
    
    panelDato.classList.remove("panel-cerrado");
    panelDato.classList.add("panel-abierto");
}

// --- CARGA DE ARCHIVOS ---

async function cargarDatos() {
    try {
        // 1. Cargar CSV
        const resCsv = await fetch("presos_politicos_salta.csv");
        const csvText = await resCsv.text();
        const filas = csvText.split("\n").filter(f => f.trim() !== "");
        
        // Procesar filas (asumiendo que NOMBRE es col 0 y DEPTO es col 1)
        filas.slice(1).forEach(fila => {
            const columnas = fila.split(";");
            const nombre = columnas[0]?.trim();
            const depto = columnas[1]?.trim();
            
            if (depto) {
                const deptoNorm = normalizar(depto);
                personas.push({ nombre: nombre, departamento: depto });
                conteoPorDepto[deptoNorm] = (conteoPorDepto[deptoNorm] || 0) + 1;
            }
        });

        // 2. Cargar GeoJSON (Solo después de tener el CSV procesado)
        const resGeo = await fetch("salta_departamentos.geojson");
        const geoData = await resGeo.json();

        L.geoJSON(geoData, {
            style: feature => {
                // Buscamos el nombre en las propiedades del GeoJSON (ajustar si es NAM o Departamen)
                const nombreGeo = normalizar(feature.properties.Departamen || feature.properties.NAM);
                const valor = conteoPorDepto[nombreGeo] || 0;
                return {
                    fillColor: getColor(valor),
                    weight: 1.5,
                    color: "white",
                    fillOpacity: 0.7
                };
            },
            onEachFeature: (feature, layer) => {
                layer.on({
                    click: (e) => {
                        L.DomEvent.stopPropagation(e);
                        const nombreGeo = feature.properties.Departamen || feature.properties.NAM;
                        mostrarDepartamento(nombreGeo);
                    }
                });
            }
        }).addTo(map);

    } catch (error) {
        console.error("Error cargando archivos:", error);
    }
}

// Iniciar proceso
cargarDatos();

// Cerrar paneles al tocar el mapa vacío
map.on('click', () => {
    panelDato.classList.add("panel-cerrado");
    panelDato.classList.remove("panel-abierto");
    menuIzq.classList.remove("menu-activo");
});
