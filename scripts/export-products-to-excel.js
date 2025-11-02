const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Configuración de Firebase - usando variables de entorno
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Verificar que las variables de entorno estén configuradas
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Error: Variables de entorno de Firebase no configuradas');
  console.log('💡 Crea un archivo .env.local con:');
  console.log('NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key');
  console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain');
  console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id');
  console.log('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket');
  console.log('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id');
  console.log('NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id');
  process.exit(1);
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function exportProductsToExcel() {
  try {
    console.log('🔥 Conectando a Firebase...');
    
    // Obtener todos los productos de Firebase
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    
    if (snapshot.empty) {
      console.log('❌ No se encontraron productos en Firebase');
      return;
    }

    console.log(`📦 Encontrados ${snapshot.size} productos`);

    // Preparar datos para Excel
    const excelData = [];
    let productCount = 0;
    let variationCount = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const product = {
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
        price: data.price || 0,
        image: data.image || '',
        category: data.category || '',
        type: data.type || '',
        variations: data.variations || [],
        isActive: data.isActive !== false
      };

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
    const workbook = new ExcelJS.Workbook();
    
    // Crear hoja principal con todos los datos
    const worksheet = workbook.addWorksheet('Productos Completos');
    
    // Definir columnas con anchos
    worksheet.columns = [
      { header: 'ID Producto', key: 'ID Producto', width: 15 },
      { header: 'Nombre Producto', key: 'Nombre Producto', width: 30 },
      { header: 'Descripción', key: 'Descripción', width: 50 },
      { header: 'Categoría', key: 'Categoría', width: 20 },
      { header: 'Tipo', key: 'Tipo', width: 10 },
      { header: 'Precio Base', key: 'Precio Base', width: 12 },
      { header: 'Imagen', key: 'Imagen', width: 40 },
      { header: 'Activo', key: 'Activo', width: 8 },
      { header: 'Tiene Variaciones', key: 'Tiene Variaciones', width: 15 },
      { header: 'ID Variación', key: 'ID Variación', width: 15 },
      { header: 'Nombre Variación', key: 'Nombre Variación', width: 30 },
      { header: 'Precio Variación', key: 'Precio Variación', width: 12 },
      { header: 'Tags Variación', key: 'Tags Variación', width: 30 }
    ];
    
    // Agregar datos
    worksheet.addRows(excelData);

    // Crear hoja resumen por categorías
    const categorySummary = {};
    excelData.forEach(row => {
      const category = row['Categoría'] || 'Sin Categoría';
      if (!categorySummary[category]) {
        categorySummary[category] = {
          'Categoría': category,
          'Total Productos': 0,
          'Total Variaciones': 0,
          'Productos Activos': 0
        };
      }
      
      // Contar productos únicos por categoría
      if (!categorySummary[category].productIds) {
        categorySummary[category].productIds = new Set();
      }
      
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
    Object.values(categorySummary).forEach(summary => {
      delete summary.productIds;
    });

    const summaryWorksheet = workbook.addWorksheet('Resumen por Categorías');
    summaryWorksheet.columns = [
      { header: 'Categoría', key: 'Categoría', width: 25 },
      { header: 'Total Productos', key: 'Total Productos', width: 15 },
      { header: 'Total Variaciones', key: 'Total Variaciones', width: 15 },
      { header: 'Productos Activos', key: 'Productos Activos', width: 15 }
    ];
    summaryWorksheet.addRows(Object.values(categorySummary));

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

    const productsOnlyWorksheet = workbook.addWorksheet('Solo Productos');
    productsOnlyWorksheet.columns = [
      { header: 'ID Producto', key: 'ID Producto', width: 15 },
      { header: 'Nombre Producto', key: 'Nombre Producto', width: 30 },
      { header: 'Descripción', key: 'Descripción', width: 50 },
      { header: 'Categoría', key: 'Categoría', width: 20 },
      { header: 'Tipo', key: 'Tipo', width: 10 },
      { header: 'Precio Base', key: 'Precio Base', width: 12 },
      { header: 'Imagen', key: 'Imagen', width: 40 },
      { header: 'Activo', key: 'Activo', width: 8 },
      { header: 'Tiene Variaciones', key: 'Tiene Variaciones', width: 15 }
    ];
    productsOnlyWorksheet.addRows(productsOnly);

    // Generar nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const fileName = `productos-bunkerhouse-${timestamp}.xlsx`;
    const filePath = path.join(process.cwd(), fileName);

    // Escribir el archivo
    await workbook.xlsx.writeFile(filePath);

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

  } catch (error) {
    console.error('❌ Error al exportar productos:', error);
    process.exit(1);
  }
}

// Ejecutar el script
exportProductsToExcel();