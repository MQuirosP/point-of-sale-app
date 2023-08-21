const { loadProductsFromCSV } = require('./externalData');
const csvFilePath = 'C:/Proyectos/verduleria-app/backend/src/utils/baseActualizada.csv'

function loadProducts() {
    loadProductsFromCSV(csvFilePath);
}

loadProducts();