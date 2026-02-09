const map = L.map('map').setView([-24.8, -65.4], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

let conteoPorDepto = {};
let personas = [];

// 1. Leer CSV
Papa.parse('presos_politicos_salta.csv', {
  download: true,
  header: true,
  complete: function(results) {

    personas = results.data;

    personas.forEach(row => {
      const depto = row.departamento;
      if (depto) {
        conteoPorDepto[depto] = (conteoPorDepto[depto] || 0) + 1;
      }
    });

    cargarMapa();
  }
});

// 2. Escala de color (bordó / negro)
function getColor(d) {
  return d > 100 ? '#2b0000' :
         d > 70  ? '#4a0000' :
         d > 40  ? '#6a0000' :
         d > 20  ? '#8b0000' :
                   '#d9caca';
}

// 3. Estilo
function style(feature) {
  const depto = feature.properties.departamento;
  const valor = conteoPorDepto[depto] || 0;

  return {
    fillColor: getColor(valor),
    weight: 1,
    color: '#000',
    fillOpacity: 0.7
  };
}

// 4. Interacción por departamento
function onEachFeature(feature, layer) {
  layer.on('click', function () {
    mostrarDepartamento(feature.properties.departamento);
  });
}

// 5. Cargar GeoJSON
function cargarMapa() {
  fetch('salta_departamentos.geojson')
    .then(r => r.json())
    .then(data => {
      L.geoJSON(data, {
        style: style,
        onEachFeature: onEachFeature
      }).addTo(map);
    });
}

// 6. Mostrar info en el panel
function mostrarDepartamento(depto) {
  const panelTitulo = document.getElementById('titulo-panel');
  const panelContenido = document.getElementById('contenido-panel');

  const filtradas = personas.filter(p => p.departamento === depto);

  panelTitulo.textContent = depto;
  panelContenido.innerHTML = `
    <p><strong>${filtradas.length}</strong> personas registradas</p>
    <ul>
      ${filtradas.map(p =>
        `<li>${p.nombre}</li>`
      ).join('')}
    </ul>
  `;
}
