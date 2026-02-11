// ================= CONFIGURACIÓN INICIAL =================

const map = L.map('map').setView([-24.8, -65.4], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

const CSV_URL = "presos_politicos_salta.csv";
const GEOJSON_URL = "salta_departamentos.geojson";

let personas = [];
let conteoPorDepto = {};
let geoLayer;


// ================= CARGA DEL CSV =================

fetch(CSV_URL)
  .then(response => response.text())
  .then(csvText => {

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });

    personas = parsed.data;

    personas.forEach(row => {

      const depto = row.Departamento?.trim();

      if (depto) {
        conteoPorDepto[depto] = (conteoPorDepto[depto] || 0) + 1;
      }

    });

    cargarGeoJSON();

  })
  .catch(error => {
    console.error("Error cargando CSV:", error);
  });


// ================= ESCALA DE COLOR =================

function getColor(d) {

  return d > 100 ? '#2b0000' :
         d > 50  ? '#5a0000' :
         d > 20  ? '#8b0000' :
         d > 5   ? '#b03a3a' :
                   '#e6caca';

}


// ================= ESTILO DEL POLÍGONO =================

function style(feature) {

  const depto = feature.properties.Departamento;
  const valor = conteoPorDepto[depto] || 0;

  return {
    fillColor: getColor(valor),
    weight: 1,
    opacity: 1,
    color: '#000',
    fillOpacity: 0.7
  };

}


// ================= INTERACCIÓN =================

function highlightFeature(e) {

  const layer = e.target;

  layer.setStyle({
    weight: 2,
    color: '#000',
    fillOpacity: 0.9
  });

}

function resetHighlight(e) {
  geoLayer.resetStyle(e.target);
}

function onEachFeature(feature, layer) {

  const depto = feature.properties.Departamento;
  const valor = conteoPorDepto[depto] || 0;

  layer.bindTooltip(
    `<strong>${depto}</strong><br>${valor} personas`,
    { sticky: true }
  );

  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: function() {
      mostrarDepartamento(depto);
    }
  });

}


// ================= CARGA GEOJSON =================

function cargarGeoJSON() {

  fetch(GEOJSON_URL)
    .then(response => response.json())
    .then(data => {

      geoLayer = L.geoJSON(data, {
        style: style,
        onEachFeature: onEachFeature
      }).addTo(map);

    })
    .catch(error => {
      console.error("Error cargando GeoJSON:", error);
    });

}


// ================= PANEL DINÁMICO =================

function mostrarDepartamento(depto) {

  const panelTitulo = document.getElementById('titulo-panel');
  const panelContenido = document.getElementById('contenido-panel');

  const filtradas = personas.filter(p => p.Departamento === depto);

  panelTitulo.textContent = depto;

  if (filtradas.length === 0) {

    panelContenido.innerHTML = `
      <p>No hay registros documentados para este departamento.</p>
    `;

    return;
  }

  panelContenido.innerHTML = `
    <p><strong>${filtradas.length}</strong> personas registradas</p>
    <ul>
      ${filtradas.map(p => `
        <li>
          <strong>${p.Nombre || p.nombre || "Sin nombre"}</strong>
          ${p.Profesion ? `<br><em>${p.Profesion}</em>` : ""}
          ${p.Fecha ? `<br>Detención: ${p.Fecha}` : ""}
        </li>
      `).join('')}
    </ul>
  `;

}