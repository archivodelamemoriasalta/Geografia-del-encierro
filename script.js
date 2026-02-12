// Crear mapa
const map = L.map('map').setView([-24.8, -65.4], 7);

// Capa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let conteoPorDepto = {};
let personas = [];

// Normalizador robusto
function normalizar(texto) {
  if (!texto) return "";
  return texto
    .toString()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// 1️⃣ Leer CSV delimitado por ;
fetch('presos_politicos_salta.csv')
  .then(response => response.text())
  .then(csvText => {

    const filas = csvText.split("\n").filter(f => f.trim() !== "");
    const encabezados = filas[0].split(";");

    const indexDepartamento = encabezados.findIndex(
      col => normalizar(col) === "DEPARTAMEN"
    );

    const indexNombre = encabezados.findIndex(
      col => normalizar(col) === "NOMBRECOMPLETO"
    );

    filas.slice(1).forEach(fila => {

      const columnas = fila.split(";");

      const nombre = columnas[indexNombre];
      const departamento = columnas[indexDepartamento];

      if (departamento) {

        const deptoNormalizado = normalizar(departamento);

        personas.push({
          nombre: nombre,
          departamento: deptoNormalizado
        });

        conteoPorDepto[deptoNormalizado] =
          (conteoPorDepto[deptoNormalizado] || 0) + 1;
      }
    });

    cargarMapa();
  });


// 🎨 Escala bordó institucional
function getColor(d) {
  return d > 20 ? "#2b0000" :
         d > 10 ? "#5a0000" :
         d > 5  ? "#8b0000" :
         d > 0  ? "#b22222" :
                  "#f5f5f5";
}


// 2️⃣ Cargar GeoJSON
function cargarMapa() {
  fetch('salta_departamentos.geojson')
    .then(r => r.json())
    .then(data => {

      L.geoJSON(data, {

        style: function(feature) {

          const nombreGeo = normalizar(feature.properties.Departamen);
          const valor = conteoPorDepto[nombreGeo] || 0;

          return {
            fillColor: getColor(valor),
            weight: 1,
            color: "#000",
            fillOpacity: 0.7
          };
        },

        onEachFeature: function(feature, layer) {

          const nombreGeo = normalizar(feature.properties.Departamen);
          const total = conteoPorDepto[nombreGeo] || 0;

          layer.on('click', function() {
            alert(
              "DEPARTAMENTO: " + nombreGeo +
              "\nCantidad registrada: " + total
            );
          });
        }

      }).addTo(map);

    });
  function abrirPanel() {
  document.getElementById("panel-lateral")
    .classList.remove("panel-cerrado");
  document.getElementById("panel-lateral")
    .classList.add("panel-abierto");
}

function cerrarPanel() {
  document.getElementById("panel-lateral")
    .classList.remove("panel-abierto");
  document.getElementById("panel-lateral")
    .classList.add("panel-cerrado");
}

document.getElementById("cerrar-panel")
  .addEventListener("click", cerrarPanel);
  function mostrarDepartamento(depto) {

  abrirPanel();

  const panelTitulo = document.getElementById("titulo-panel");
  const panelContenido = document.getElementById("contenido-panel");

  const filtradas = personas.filter(
    p => normalizar(p.departamento) === normalizar(depto)
  );

  panelTitulo.textContent = depto;

  panelContenido.innerHTML = `
    <p><strong>${filtradas.length}</strong> detenidos registrados</p>
    <ul>
      ${filtradas.map(p =>
        `<li>
          <a href="#" onclick="mostrarFicha('${p.nombre.replace(/'/g, "\\'")}')">
            ${p.nombre}
          </a>
        </li>`
      ).join("")}
    </ul>
  `;
function mostrarFicha(nombre) {

  const persona = personas.find(p => p.nombre === nombre);
  if (!persona) return;

  const panelTitulo = document.getElementById("titulo-panel");
  const panelContenido = document.getElementById("contenido-panel");

  panelTitulo.textContent = persona.nombre;

  panelContenido.innerHTML = `
    <p><strong>Departamento:</strong> ${persona.departamento}</p>
    <p><strong>Decreto:</strong> ${persona.decreto || "No registrado"}</p>
    <p><strong>Ingreso:</strong> ${persona.fechaIngreso || "No registrado"}</p>
    <p><strong>Estado:</strong> ${persona.estado || "No registrado"}</p>
    <br>
    <button onclick="mostrarDepartamento('${persona.departamento}')">
      ← Volver al departamento
    </button>
  `;
}

}

  }

}
