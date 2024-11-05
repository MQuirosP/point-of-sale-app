const { loadProductsFromCSV } = require('./externalData');
const csvFilePath = 'C:/Users/mquir/Proyectos/point-of-sale-app/backend/src/utils/baseActualizada.csv'

function loadProducts() {
    loadProductsFromCSV(csvFilePath);
}

loadProducts();