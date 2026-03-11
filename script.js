const map = L.map('map').setView([-24.8, -65.4], 7);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

let personas = [];
let conteoPorDepto = {};

// INTERFAZ
const menuIzq = document.getElementById("panel-izquierdo");
const panelDato = document.getElementById("panel-lateral");

document.getElementById("menu-info").addEventListener("click", () => menuIzq.classList.add("menu-activo"));
document.getElementById("cerrar-menu-izq").addEventListener("click", () => menuIzq.classList.remove("menu-activo"));
document.getElementById("cerrar-panel").addEventListener("click", () => panelDato.classList.add("panel-cerrado"));

document.querySelectorAll(".acordeon-titulo").forEach(t => {
    t.addEventListener("click", () => t.parentElement.classList.toggle("activo"));
});

// LÓGICA DE DATOS
function normalizar(texto) {
    if (!texto) return "";
    return texto.toString().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function getColor(d) {
    return d > 20 ? "#4a0000" : d > 10 ? "#7a0000" : d > 5 ? "#a52a2a" : d > 0 ? "#cd5c5c" : "#333";
}

function mostrarDepartamento(depto) {
    const deptoNorm = normalizar(depto);
    const filtradas = personas.filter(p => normalizar(p.departamento) === deptoNorm);
    
    document.getElementById("titulo-panel").textContent = depto;
    document.getElementById("contenido-panel").innerHTML = `
        <div style="color:#6b0f1a; font-weight:bold; margin-bottom:10px;">${filtradas.length} Personas registradas</div>
        <ul class="lista-detenidos">${filtradas.map(p => `<li>${p.nombre}</li>`).join("")}</ul>
    `;
    panelDato.classList.remove("panel-cerrado");
}

// CARGA COORDINADA
async function cargarTodo() {
    try {
        const resCsv = await fetch("presos_politicos_salta.csv");
        const csvTxt = await resCsv.text();
        const filas = csvTxt.split("\n").slice(1);
        
        filas.forEach(f => {
            const c = f.split(";");
            if(c[1]) {
                const dNorm = normalizar(c[1]);
                personas.push({ nombre: c[0], departamento: c[1] });
                conteoPorDepto[dNorm] = (conteoPorDepto[dNorm] || 0) + 1;
            }
        });

        const resGeo = await fetch("salta_departamentos.geojson");
        const geoJson = await resGeo.json();

        L.geoJSON(geoJson, {
            style: f => {
                const n = normalizar(f.properties.Departamen || f.properties.NAM);
                return { fillColor: getColor(conteoPorDepto[n] || 0), weight: 1, color: "white", fillOpacity: 0.7 };
            },
            onEachFeature: (f, l) => {
                l.on('click', (e) => {
                    L.DomEvent.stopPropagation(e);
                    mostrarDepartamento(f.properties.Departamen || f.properties.NAM);
                });
            }
        }).addTo(map);
    } catch (e) { console.error("Error de archivos:", e); }
}

cargarTodo();

map.on('click', () => {
    panelDato.classList.add("panel-cerrado");
    menuIzq.classList.remove("menu-activo");
});
