// Crear el mapa
const map = L.map('map').setView([-24.8, -65.4], 7);

// Capa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// Cargar departamentos
fetch('salta_departamentos.geojson')
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
      style: {
        fillColor: '#dddddd',
        weight: 1,
        color: '#555',
        fillOpacity: 0.7
      }
    }).addTo(map);
  });
