const XLSX = require('xlsx');
const path = require('path');

// Datos de ejemplo - Reemplaza esto con los datos reales de tu Firebase
const sampleProducts = [
  {
    id: 'prod_1',
    name: 'Bondiolita a la cerveza negra',
    description: 'Bondiola braseada, cebolla caramelizada, cheddar, pan de papa',
    category: 'Hamburguesas',
    type: 'COMIDAS',
    price: 10000,
    image: '/images/bondiolita.jpg',
    isActive: true,
    variations: [
      {
        id: 'var_1',
        name: 'Con papas fritas',
        price: 12000,
        tags: ['papas', 'clasico']
      },
      {
        id: 'var_2', 
        name: 'Con aros de cebolla',
        price: 13000,
        tags: ['aros', 'premium']
      }
    ]
  },
  {
    id: 'prod_2',
    name: 'Hamburguesa Clásica',
    description: 'Carne 150g, lechuga, tomate, cheddar',
    category: 'Hamburguesas',
    type: 'COMIDAS',
    price: 8000,
    image: '/images/clasica.jpg',
    isActive: true,
    variations: []
  },
  {
    id: 'prod_3',
    name: 'Coca Cola',
    description: 'Bebida gaseosa 500ml',
    category: 'Gaseosas',
    type: 'BEBIDAS',
    price: 2000,
    image: '/images/coca.jpg',
    isActive: true,
    variations: [
      {
        id: 'var_3',
        name: 'Coca Cola Light',
        price: 2000,
        tags: ['light', 'sin azucar']
      },
      {
        id: 'var_4',
        name: 'Coca Cola Zero',
        price: 2000,
        tags: ['zero', 'sin azucar']
      }
    ]
  }
];

function exportProductsToExcel() {
  try {
    console.log('📊 Generando archivo Excel con productos...');
    
    // Preparar datos para Excel
    const excelData = [];
    let productCount = 0;
    let variationCount = 0;

    sampleProducts.forEach(product => {
      productCount++;

      // Si el producto no tiene variaciones, agregar una fila con el producto base
      if (!product.variations || product.variations.length === 0) {
        excelData.push({
          'ID Producto': product.id,
          'Nombre Producto': product.name,
          'Descripción': product.description,
          'Categoría': product.category,
          'Tipo': product.type,
          'Precio Base': product.price,
          'Imagen': product.image,
          'Activo': product.isActive ? 'Sí' : 'No',
          'Tiene Variaciones': 'No',
          'ID Variación': '',
          'Nombre Variación': '',
          'Precio Variación': '',
          'Tags Variación': ''
        });
      } else {
        // Si tiene variaciones, agregar una fila por cada variación
        product.variations.forEach((variation, index) => {
          variationCount++;
          excelData.push({
            'ID Producto': product.id,
            'Nombre Producto': product.name,
            'Descripción': product.description,
            'Categoría': product.category,
            'Tipo': product.type,
            'Precio Base': product.price,
            'Imagen': product.image,
            'Activo': product.isActive ? 'Sí' : 'No',
            'Tiene Variaciones': 'Sí',
            'ID Variación': variation.id || `var_${index + 1}`,
            'Nombre Variación': variation.name || '',
            'Precio Variación': variation.price || 0,
            'Tags Variación': Array.isArray(variation.tags) ? variation.tags.join(', ') : ''
          });
        });
      }
    });

    console.log(`📊 Procesados: ${productCount} productos, ${variationCount} variaciones`);

    // Crear el libro de Excel
    const workbook = XLSX.utils.book_new();
    
    // Crear hoja principal con todos los datos
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Ajustar ancho de columnas
    const columnWidths = [
      { wch: 15 }, // ID Producto
      { wch: 30 }, // Nombre Producto
      { wch: 50 }, // Descripción
      { wch: 20 }, // Categoría
      { wch: 10 }, // Tipo
      { wch: 12 }, // Precio Base
      { wch: 40 }, // Imagen
      { wch: 8 },  // Activo
      { wch: 15 }, // Tiene Variaciones
      { wch: 15 }, // ID Variación
      { wch: 30 }, // Nombre Variación
      { wch: 12 }, // Precio Variación
      { wch: 30 }  // Tags Variación
    ];
    worksheet['!cols'] = columnWidths;

    // Agregar la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos Completos');

    // Crear hoja resumen por categorías
    const categorySummary = {};
    excelData.forEach(row => {
      const category = row['Categoría'] || 'Sin Categoría';
      if (!categorySummary[category]) {
        categorySummary[category] = {
          'Categoría': category,
          'Total Productos': 0,
          'Total Variaciones': 0,
          'Productos Activos': 0,
          productIds: new Set()
        };
      }
      
      // Contar productos únicos por categoría
      if (!categorySummary[category].productIds.has(row['ID Producto'])) {
        categorySummary[category]['Total Productos']++;
        categorySummary[category].productIds.add(row['ID Producto']);
        
        if (row['Activo'] === 'Sí') {
          categorySummary[category]['Productos Activos']++;
        }
      }
      
      if (row['ID Variación']) {
        categorySummary[category]['Total Variaciones']++;
      }
    });

    // Limpiar productIds antes de convertir a Excel
    const summaryData = Object.values(categorySummary).map(summary => {
      const { productIds, ...cleanSummary } = summary;
      return cleanSummary;
    });

    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    summaryWorksheet['!cols'] = [
      { wch: 25 }, // Categoría
      { wch: 15 }, // Total Productos
      { wch: 15 }, // Total Variaciones
      { wch: 15 }  // Productos Activos
    ];
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Resumen por Categorías');

    // Crear hoja solo de productos (sin variaciones)
    const productsOnly = excelData.filter((row, index, array) => {
      // Mantener solo la primera ocurrencia de cada producto
      return array.findIndex(r => r['ID Producto'] === row['ID Producto']) === index;
    }).map(row => ({
      'ID Producto': row['ID Producto'],
      'Nombre Producto': row['Nombre Producto'],
      'Descripción': row['Descripción'],
      'Categoría': row['Categoría'],
      'Tipo': row['Tipo'],
      'Precio Base': row['Precio Base'],
      'Imagen': row['Imagen'],
      'Activo': row['Activo'],
      'Tiene Variaciones': row['Tiene Variaciones']
    }));

    const productsOnlyWorksheet = XLSX.utils.json_to_sheet(productsOnly);
    productsOnlyWorksheet['!cols'] = [
      { wch: 15 }, // ID Producto
      { wch: 30 }, // Nombre Producto
      { wch: 50 }, // Descripción
      { wch: 20 }, // Categoría
      { wch: 10 }, // Tipo
      { wch: 12 }, // Precio Base
      { wch: 40 }, // Imagen
      { wch: 8 },  // Activo
      { wch: 15 }  // Tiene Variaciones
    ];
    XLSX.utils.book_append_sheet(workbook, productsOnlyWorksheet, 'Solo Productos');

    // Generar nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const fileName = `productos-bunkerhouse-${timestamp}.xlsx`;
    const filePath = path.join(process.cwd(), fileName);

    // Escribir el archivo
    XLSX.writeFile(workbook, filePath);

    console.log(`✅ Archivo Excel generado exitosamente:`);
    console.log(`📁 Ubicación: ${filePath}`);
    console.log(`📊 Estadísticas:`);
    console.log(`   - Total productos: ${productCount}`);
    console.log(`   - Total variaciones: ${variationCount}`);
    console.log(`   - Total filas en Excel: ${excelData.length}`);
    console.log(`   - Hojas creadas: 3 (Productos Completos, Resumen por Categorías, Solo Productos)`);
    
    // Mostrar categorías encontradas
    const categories = Object.keys(categorySummary);
    console.log(`📂 Categorías encontradas: ${categories.join(', ')}`);

    console.log(`\n💡 NOTA: Este archivo usa datos de ejemplo.`);
    console.log(`   Para obtener datos reales de Firebase, configura las variables de entorno`);
    console.log(`   y usa el script export-products-to-excel.js`);

  } catch (error) {
    console.error('❌ Error al exportar productos:', error);
    process.exit(1);
  }
}

// Ejecutar el script
exportProductsToExcel();
