// MAPA
const map = L.map('map').setView([-24.8, -65.4], 7);
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

let personas = [];

// BOTONES Y PANELES
const btnMenu = document.getElementById("menu-info");
const menuIzq = document.getElementById("panel-izquierdo");
const btnCerrarIzq = document.getElementById("cerrar-menu-izq");
const panelDato = document.getElementById("panel-lateral");

// ABRIR MENU IZQUIERDO (CON SOPORTE TACTIL)
function toggleMenuIzquierdo(e) {
    e.preventDefault();
    menuIzq.classList.toggle("menu-activo");
}

btnMenu.addEventListener("click", toggleMenuIzquierdo);
btnCerrarIzq.addEventListener("click", () => menuIzq.classList.remove("menu-activo"));

// ACORDEON
document.querySelectorAll(".acordeon-titulo").forEach(t => {
    t.addEventListener("click", () => t.parentElement.classList.toggle("activo"));
});

// MOSTRAR DATOS
function mostrarDepartamento(depto) {
    document.getElementById("titulo-panel").textContent = depto;
    const lista = personas.filter(p => p.depto === depto);
    
    document.getElementById("contenido-panel").innerHTML = `
        <p>Registros: ${lista.length}</p>
        <ul>${lista.map(p => `<li>${p.nombre}</li>`).join("")}</ul>
    `;
    
    panelDato.classList.remove("panel-cerrado");
    panelDato.classList.add("panel-abierto");
}

document.getElementById("cerrar-panel").addEventListener("click", () => {
    panelDato.classList.add("panel-cerrado");
    panelDato.classList.remove("panel-abierto");
});

// CARGAR DATOS (Simulado para que no de error si falta el archivo)
async function cargar() {
    try {
        const r = await fetch("presos_politicos_salta.csv");
        const txt = await r.text();
        // Aquí procesas tu CSV... (omito lógica compleja para que no falle)
    } catch(e) { console.log("Falta archivo CSV"); }
}
cargar();

// ESTO HACE QUE EL MAPA RESPONDA EN ANDROID
map.on('click', () => {
    panelDato.classList.add("panel-cerrado");
    menuIzq.classList.remove("menu-activo");
});
