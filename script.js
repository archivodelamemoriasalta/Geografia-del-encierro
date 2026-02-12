// Include Papa Parse library
// <reference to Papa Parse library>

const csvData = []; // Array to hold parsed CSV data

function parseCSV(data) {
  // Use Papa Parse to parse the CSV data
  const parsedData = Papa.parse(data, {
    header: true, // Treat the first row as a header
    skipEmptyLines: true // Skip empty lines
  });

  parsedData.data.forEach(row => {
    csvData.push({
      departamento: row.Departamento, // Change to lowercase as requested
      NombreCompleto: row.Nombre, // Changed to NombreCompleto
      Profesion: row.Profesion
    });
  });
}

// Example usage: fetch the CSV file and parse it
fetch('path/to/csvfile.csv')
  .then(response => response.text())
  .then(data => parseCSV(data));