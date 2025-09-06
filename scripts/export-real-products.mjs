import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de Firebase - usando las credenciales del .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA6jSrBZtyIHQ1awz-srvYiZdx-7R20qs0",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "bunkerhouse-794fd.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "bunkerhouse-794fd",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "bunkerhouse-794fd.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1056317163273",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1056317163273:web:3b08b6c2097d7b25c335d8",
};

// Mostrar configuración que se está usando
console.log('🔧 Configuración Firebase:');
console.log(`   Project ID: ${firebaseConfig.projectId}`);
console.log(`   Auth Domain: ${firebaseConfig.authDomain}`);
console.log(`   Using .env.local: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅' : '❌ (usando valores por defecto)'}`);
console.log('');

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
    const fileName = `productos-bunkerhouse-reales-${timestamp}.xlsx`;
    const filePath = join(process.cwd(), fileName);

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

  } catch (error) {
    console.error('❌ Error al exportar productos:', error);
    if (error.code === 'auth/invalid-api-key') {
      console.log('💡 Verifica que tu API key de Firebase sea correcta');
    } else if (error.code === 'permission-denied') {
      console.log('💡 Verifica los permisos de Firestore');
    }
    process.exit(1);
  }
}

// Ejecutar el script
exportProductsToExcel();
