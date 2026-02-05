// 1. Mapa base
const map = L.map('map').setView([-24.8, -65.4], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// 2. Datos simulados (después los sacamos del Excel)
const desaparecidosPorDepto = {
  "Capital": 120,
  "Orán": 85,
  "General Güemes": 60,
  "Metán": 45,
  "Rosario de Lerma": 30
};

// 3. Escala de color
function getColor(d) {
  return d > 100 ? '#800026' :
         d > 70  ? '#BD0026' :
         d > 40  ? '#E31A1C' :
         d > 20  ? '#FC4E2A' :
                   '#FD8D3C';
}

// 4. Estilo por departamento
function style(feature) {
  const depto = feature.properties.departamento;
  const valor = desaparecidosPorDepto[depto] || 0;

  return {
    fillColor: getColor(valor),
    weight: 1,
    opacity: 1,
    color: 'white',
    fillOpacity: 0.7
  };
}

// 5. Interacción
function onEachFeature(feature, layer) {
  const depto = feature.properties.departamento;
  const valor = desaparecidosPorDepto[depto] || 0;

  layer.bindPopup(
    `<strong>${depto}</strong><br/>
     Desaparecidos: ${valor}`
  );
}

// 6. Cargar GeoJSON
fetch('salta_departamentos.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: style,
      onEachFeature: onEachFeature
    }).addTo(map);
  });