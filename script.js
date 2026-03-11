// CONFIGURACIÓN DEL MAPA
const map = L.map('map').setView([-24.8, -65.4], 7);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

let personas = [];
let conteoPorDepto = {};

// ELEMENTOS DEL DOM
const menuIzquierdo = document.getElementById("panel-izquierdo");
const botonMenu = document.getElementById("menu-info");
const botonCerrarMenu = document.getElementById("cerrar-menu-izq");
const panelDerecho = document.getElementById("panel-lateral");
const botonCerrarDerecho = document.getElementById("cerrar-panel");

// LÓGICA MENÚ IZQUIERDO (INSTITUCIONAL)
botonMenu.addEventListener("click", () => {
    menuIzquierdo.classList.add("menu-activo");
});

botonCerrarMenu.addEventListener("click", () => {
    menuIzquierdo.classList.remove("menu-activo");
});

// ACORDEÓN
document.querySelectorAll(".acordeon-titulo").forEach(titulo => {
    titulo.addEventListener("click", () => {
        const item = titulo.parentElement;
        item.classList.toggle("activo");
    });
});

// LÓGICA PANEL DERECHO (DATOS)
function abrirPanel() {
    panelDerecho.classList.remove("panel-cerrado");
}

function cerrarPanel() {
    panelDerecho.classList.add("panel-cerrado");
}

botonCerrarDerecho.addEventListener("click", cerrarPanel);

// NORMALIZACIÓN Y DATOS (Tu lógica original mejorada)
function normalizar(texto) {
    if (!texto) return "";
    return texto.toString().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function mostrarDepartamento(depto) {
    const panelTitulo = document.getElementById("titulo-panel");
    const panelContenido = document.getElementById("contenido-panel");
    const deptoNorm = normalizar(depto);
    const filtradas = personas.filter(p => normalizar(p.departamento) === deptoNorm);
    
    panelTitulo.textContent = depto;
    panelContenido.innerHTML = `
        <p style="color: #6b0f1a; font-weight: bold;">${filtradas.length} personas registradas</p>
        <ul class="lista-detenidos">
            ${filtradas.map(p => `<li><a href="#" class="enlace-persona" data-nombre="${p.nombre}">${p.nombre}</a></li>`).join("")}
        </ul>`;

    abrirPanel();

    panelContenido.querySelectorAll(".enlace-persona").forEach(a => {
        a.addEventListener("click", (e) => {
            e.preventDefault();
            mostrarFicha(a.dataset.nombre);
        });
    });
}

function mostrarFicha(nombre) {
    const persona = personas.find(p => p.nombre === nombre);
    if (!persona) return;
    const panelContenido = document.getElementById("contenido-panel");
    panelContenido.innerHTML = `
        <div class="ficha-persona">
            <p><strong>📍 Departamento:</strong> ${persona.departamento}</p>
            <p><strong>⚖️ Estado:</strong> ${persona.estado || "No registrado"}</p>
            <button onclick="window.location.reload()" class="btn-volver">← Volver</button>
        </div>`;
}

// CARGA DE ARCHIVOS
async function init() {
    try {
        const res = await fetch("presos_politicos_salta.csv");
        const csvText = await res.text();
        const filas = csvText.split("\n").slice(1);
        filas.forEach(fila => {
            const cols = fila.split(";");
            if(cols[1]) {
                const depto = normalizar(cols[1]);
                personas.push({ nombre: cols[0], departamento: depto });
                conteoPorDepto[depto] = (conteoPorDepto[depto] || 0) + 1;
            }
        });
        // Cargar GeoJSON aquí... (Simulado para brevedad)
    } catch (e) { console.log(e); }
}

init();

// Cerrar todo al tocar el mapa
map.on("click", () => {
    cerrarPanel();
    menuIzquierdo.classList.remove("menu-activo");
});
