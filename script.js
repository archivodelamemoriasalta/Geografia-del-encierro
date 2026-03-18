const map = L.map('map').setView([-24.8, -65.4], 7);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

let personas = [];
let conteoPorDepto = {};

const menuIzq = document.getElementById("panel-izquierdo");
const panelDato = document.getElementById("panel-lateral");

function normalizar(texto) {
    if (!texto) return "";
    return texto.toString().toUpperCase().normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Z0-9]/g, "")
        .trim();
}

function getColor(d) {
    return d > 20 ? "#4a0000" : d > 10 ? "#7a0000" : d > 5 ? "#a52a2a" : d > 0 ? "#cd5c5c" : "#333333";
}

function mostrarDepartamento(depto) {
    const deptoNorm = normalizar(depto);
    const filtradas = personas.filter(p => normalizar(p.departamento) === deptoNorm);

    document.getElementById("titulo-panel").textContent = depto;

    document.getElementById("contenido-panel").innerHTML = `
        <div><strong>${filtradas.length} Personas</strong></div>
        <ul>
            ${filtradas.map(p => `<li><a href="#" class="enlace-persona" data-nombre="${p.nombre}">${p.nombre}</a></li>`).join("")}
        </ul>
    `;

    panelDato.classList.add("panel-abierto");

    document.querySelectorAll(".enlace-persona").forEach(a => {
        a.addEventListener("click", e => {
            e.preventDefault();
            mostrarFicha(a.dataset.nombre);
        });
    });
}

function mostrarFicha(nombre) {
    const persona = personas.find(p => p.nombre === nombre);
    if (!persona) return;

    document.getElementById("titulo-panel").textContent = persona.nombre;

    document.getElementById("contenido-panel").innerHTML = `
        <div class="ficha-persona">
            <div><span>Departamento:</span> ${persona.departamento}</div>
            <div><span>Decreto:</span> ${persona.decreto || "No registrado"}</div>
            <div><span>Fecha:</span> ${persona.fechaIngreso || "No registrado"}</div>
            <div><span>Estado:</span> ${persona.estado || "No registrado"}</div>

            <button id="volver-depto">← Volver</button>
        </div>
    `;

    document.getElementById("volver-depto").addEventListener("click", () => {
        mostrarDepartamento(persona.departamento);
    });
}

async function cargarTodo() {
    const resCsv = await fetch("presos_politicos_salta.csv");
    const text = await resCsv.text();

    const filas = text.split("\n").filter(f => f.trim());
    const headers = filas[0].split(";");

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

    const geo = await fetch("salta_departamentos.geojson").then(r => r.json());

    L.geoJSON(geo, {
        style: f => {
            const n = normalizar(f.properties.name);
            return { fillColor: getColor(conteoPorDepto[n] || 0), color: "#fff", weight: 1 };
        },
        onEachFeature: (f, layer) => {
            layer.on("click", e => {
                map.fitBounds(layer.getBounds());
                mostrarDepartamento(f.properties.name);
            });
        }
    }).addTo(map);
}

const buscador = document.getElementById("buscador-personas");

buscador.addEventListener("input", () => {
    const val = normalizar(buscador.value);

    const res = personas.filter(p => normalizar(p.nombre).includes(val));

    document.getElementById("titulo-panel").textContent = "Resultados";

    document.getElementById("contenido-panel").innerHTML = `
        <ul>
            ${res.map(p => `<li><a href="#" class="enlace-persona" data-nombre="${p.nombre}">${p.nombre}</a></li>`).join("")}
        </ul>
    `;

    panelDato.classList.add("panel-abierto");

    document.querySelectorAll(".enlace-persona").forEach(a => {
        a.addEventListener("click", e => {
            e.preventDefault();
            mostrarFicha(a.dataset.nombre);
        });
    });
});

document.getElementById("menu-info").onclick = () => menuIzq.classList.add("menu-activo");
document.getElementById("cerrar-menu-izq").onclick = () => menuIzq.classList.remove("menu-activo");
document.getElementById("cerrar-panel").onclick = () => panelDato.classList.remove("panel-abierto");

cargarTodo();
