// ========================
// 🌎 Mapa y Datos
// ========================

// Crear mapa centrado en Salta
const map = L.map('map').setView([-24.8, -65.4], 7);

// Capa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// Datos globales
let personas = [];
let conteoPorDepto = {};

// ========================
// 🔹 Normalización de texto
// ========================
function normalizar(texto) {
  if (!texto) return "";
  return texto.toString()
              .toUpperCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .trim();
}

// ========================
// 🔹 Funciones del panel lateral
// ========================
function abrirPanel() {
  const panel = document.getElementById("panel-lateral");
  panel.classList.remove("panel-cerrado");
  panel.classList.add("panel-abierto");
}

function cerrarPanel() {
  const panel = document.getElementById("panel-lateral");
  panel.classList.remove("panel-abierto");
  panel.classList.add("panel-cerrado");
}

document.getElementById("cerrar-panel")
  .addEventListener("click", cerrarPanel);

// Mostrar lista de personas por departamento
function mostrarDepartamento(depto) {
  abrirPanel();
  const panelTitulo = document.getElementById("titulo-panel");
  const panelContenido = document.getElementById("contenido-panel");

  const filtradas = personas.filter(p => normalizar(p.departamento) === normalizar(depto));
  
  panelTitulo.textContent = depto;
  panelContenido.innerHTML = `
    <p><strong>${filtradas.length}</strong> detenidos registrados</p>
    <ul>
      ${filtradas.map(p => 
        `<li><a href="#" data-nombre="${p.nombre}">${p.nombre}</a></li>`
      ).join("")}
    </ul>
  `;

  // Delegar click para abrir ficha
  panelContenido.querySelectorAll("a[data-nombre]").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      mostrarFicha(a.dataset.nombre);
    });
  });
}

// Mostrar ficha individual
function mostrarFicha(nombre) {
  const persona = personas.find(p => p.nombre === nombre);
  if (!persona) return;

  abrirPanel();
  const panelTitulo = document.getElementById("titulo-panel");
  const panelContenido = document.getElementById("contenido-panel");

  panelTitulo.textContent = persona.nombre;
  panelContenido.innerHTML = `
    <p><strong>Departamento:</strong> ${persona.departamento}</p>
    <p><strong>Decreto:</strong> ${persona.decreto || "No registrado"}</p>
    <p><strong>Ingreso:</strong> ${persona.fechaIngreso || "No registrado"}</p>
    <p><strong>Estado:</strong> ${persona.estado || "No registrado"}</p>
    <br>
    <button id="volver-depto">← Volver al departamento</button>
  `;

  document.getElementById("volver-depto")
    .addEventListener("click", () => mostrarDepartamento(persona.departamento));
}

// ========================
// 🔹 Escala de colores
// ========================
function getColor(d) {
  return d > 20 ? "#2b0000" :
         d > 10 ? "#5a0000" :
         d > 5  ? "#8b0000" :
         d > 0  ? "#b22222" :
                  "#f5f5f5";
}

// ========================
// 🔹 Cargar CSV de personas
// ========================
async function cargarCSV(url) {
  try {
    const response = await fetch(url);
    const csvText = await response.text();
    const filas = csvText.split("\n").filter(f => f.trim() !== "");
    const encabezados = filas[0].split(";");

    const indexDepartamento = encabezados.findIndex(col => normalizar(col) === "DEPARTAMEN");
    const indexNombre = encabezados.findIndex(col => normalizar(col) === "NOMBRECOMPLETO");

    if (indexDepartamento === -1 || indexNombre === -1) {
      console.error("No se encontraron las columnas DEPARTAMEN o NOMBRECOMPLETO");
      return;
    }

    filas.slice(1).forEach(fila => {
      const columnas = fila.split(";");
      const nombre = columnas[indexNombre];
      const departamento = columnas[indexDepartamento];
      if (departamento) {
        const deptoNormalizado = normalizar(departamento);
        personas.push({ nombre, departamento: deptoNormalizado });
        conteoPorDepto[deptoNormalizado] = (conteoPorDepto[deptoNormalizado] || 0) + 1;
      }
    });

  } catch (err) {
    console.error("Error cargando CSV:", err);
  }
}

// ========================
// 🔹 Cargar GeoJSON y dibujar mapa
// ========================
async function cargarGeoJSON(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();

    L.geoJSON(data, {
      style: feature => {
        const nombreGeo = normalizar(feature.properties.Departamen);
        const valor = conteoPorDepto[nombreGeo] || 0;
        return { fillColor: getColor(valor), weight: 1, color: "#000", fillOpacity: 0.7 };
      },
      onEachFeature: (feature, layer) => {
        const nombreGeo = normalizar(feature.properties.Departamen);
        const total = conteoPorDepto[nombreGeo] || 0;

        // Tooltip al pasar el mouse
        layer.bindTooltip(`${nombreGeo}: ${total} detenidos`);

        // Click abre panel lateral
        layer.on("click", () => mostrarDepartamento(nombreGeo));
      }
    }).addTo(map);

  } catch (err) {
    console.error("Error cargando GeoJSON:", err);
  }
}

// ========================
// 🔹 Inicialización
// ========================
async function init() {
  await cargarCSV("presos_politicos_salta.csv");
  await cargarGeoJSON("salta_departamentos.geojson");
}

init();
