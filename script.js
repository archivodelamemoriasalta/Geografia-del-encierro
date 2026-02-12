// Crear mapa centrado en Salta
const map = L.map('map').setView([-24.8, -65.4], 7);

// Capa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap'
}).addTo(map);

// Cargar GeoJSON
fetch('salta_departamentos.geojson')
  .then(response => response.json())
  .then(data => {

    L.geoJSON(data, {
      style: {
        color: "#000",
        weight: 1,
        fillColor: "#800020",  // bordo
        fillOpacity: 0.5
      },

      onEachFeature: function(feature, layer) {

        const nombre = feature.properties.Departamen;

        layer.on('click', function() {
          alert("Departamento: " + nombre);
        });

      }

    }).addTo(map);

  })
  .catch(error => {
    console.error("Error cargando el GeoJSON:", error);
  });
