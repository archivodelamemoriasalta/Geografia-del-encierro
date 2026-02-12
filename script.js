// ========================
// 🌎 Mapa y Datos
// ========================

// Crear mapa centrado en Salta
const map = L.map('map').setView([-24.8, -65.4], 7);

// Capa base (puedes probar con CartoDB Positron para un look más limpio)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

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
// 🔹 Funciones del panel lateral (MODIFICADAS)
// ========================
function abrirPanel() {
  const panel = document.getElementById("panel-lateral");
  // Simplemente removemos la clase que lo saca de pantalla
  panel.classList.remove("panel-cerrado");
}

function cerrarPanel() {
  const panel = document.getElementById("panel-lateral");
  panel.classList.add("panel-cerrado");
}

document.getElementById("cerrar-panel").addEventListener("click", cerrarPanel);

// Mostrar lista de personas por departamento
function mostrarDepartamento(depto) {
  const panelTitulo = document.getElementById("titulo-panel");
  const panelContenido = document.getElementById("contenido-panel");

  const deptoNorm = normalizar(depto);
  const filtradas = personas.filter(p => normalizar(p.departamento) === deptoNorm);
  
  panelTitulo.textContent = depto;
  
  // Diseño de la lista más elegante
  panelContenido.innerHTML = `
    <div style="margin-bottom: 15px; font-weight: bold; color: #8b0000;">
        ${filtradas.length} personas registradas
    </div>
    <ul class="lista-detenidos">
      ${filtradas.map(p => 
        `<li><a href="#" class="enlace-persona" data-nombre="${p.nombre}">${p.nombre}</a></li>`
      ).join("")}
    </ul>
  `;

  abrirPanel();

  // Delegar click para abrir ficha
  panelContenido.querySelectorAll(".enlace-persona").forEach(a => {
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

  const panelTitulo = document.getElementById("titulo-panel");
  const panelContenido = document.getElementById("contenido-panel");

  panelTitulo.textContent = persona.nombre;
  panelContenido.innerHTML = `
    <div class="ficha-persona">
        <p><strong>📍 Departamento:</strong> ${persona.departamento}</p>
        <p><strong>📄 Decreto:</strong> ${persona.decreto || "No registrado"}</p>
        <p><strong>📅 Ingreso:</strong> ${persona.fechaIngreso || "No registrado"}</p>
        <p><strong>⚖️ Estado:</strong> ${persona.estado || "No registrado"}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <button id="volver-depto" class="btn-volver">← Volver al departamento</button>
    </div>
  `;

  document.getElementById("volver-depto")
    .addEventListener("click", () => mostrarDepartamento(persona.departamento));
}

// ========================
// 🔹 Escala de colores (Actualizada a Tonos de Salta/Tierra)
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

    const indexDepartamento = encabezados.findIndex(col => normalizar(col).includes("DEPARTAMEN"));
    const indexNombre = encabezados.findIndex(col => normalizar(col).includes("NOMBRE"));

    filas.slice(1).forEach(fila => {
      const columnas = fila.split(";");
      const nombre = columnas[indexNombre];
      const departamento = columnas[indexDepartamento];
      if (departamento) {
        const deptoNormalizado = normalizar(departamento);
        personas.push({ 
            nombre: nombre?.trim(), 
            departamento: deptoNormalizado,
            // Aquí puedes mapear más columnas si el CSV tiene decreto, etc.
        });
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
        const nombreGeo = normalizar(feature.properties.Departamen || feature.properties.NAM);
        const valor = conteoPorDepto[nombreGeo] || 0;
        return { 
            fillColor: getColor(valor), 
            weight: 1.5, 
            color: "white", 
            fillOpacity: 0.8 
        };
      },
      onEachFeature: (feature, layer) => {
        const nombreGeo = normalizar(feature.properties.Departamen || feature.properties.NAM);
        const total = conteoPorDepto[nombreGeo] || 0;

        layer.bindTooltip(`<b>${nombreGeo}</b><br>${total} registros`, { sticky: true });

        layer.on({
            mouseover: (e) => { e.target.setStyle({ weight: 3, color: '#666', fillOpacity: 0.9 }); },
            mouseout: (e) => { e.target.setStyle({ weight: 1.5, color: 'white', fillOpacity: 0.8 }); },
            click: (e) => {
                L.DomEvent.stopPropagation(e); // Evita problemas con el click del mapa
                mostrarDepartamento(nombreGeo);
            }
        });
      }
    }).addTo(map);
  } catch (err) {
    console.error("Error cargando GeoJSON:", err);
  }
}

async function init() {
  await cargarCSV("presos_politicos_salta.csv");
  await cargarGeoJSON("salta_departamentos.geojson");
}

init();
