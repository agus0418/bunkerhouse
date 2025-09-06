import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA6jSrBZtyIHQ1awz-srvYiZdx-7R20qs0",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "bunkerhouse-794fd.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "bunkerhouse-794fd",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "bunkerhouse-794fd.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1056317163273",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1056317163273:web:3b08b6c2097d7b25c335d8",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function previewMigration() {
  try {
    console.log('🔍 VISTA PREVIA DE MIGRACIÓN DE IMÁGENES');
    console.log('=========================================');
    console.log('');

    // Obtener todos los productos
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    
    if (snapshot.empty) {
      console.log('❌ No se encontraron productos');
      return;
    }

    console.log(`📦 Total productos en BD: ${snapshot.size}`);

    // Analizar imágenes
    const stats = {
      external: [],
      local: [],
      noImage: [],
      other: []
    };

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const product = {
        id: doc.id,
        name: data.name || 'Sin nombre',
        image: data.image || null,
        category: data.category || 'Sin categoría'
      };

      if (!product.image) {
        stats.noImage.push(product);
      } else if (product.image.includes('bunkerhouse.com.ar')) {
        stats.external.push(product);
      } else if (product.image.startsWith('/images/')) {
        stats.local.push(product);
      } else {
        stats.other.push(product);
      }
    });

    // Mostrar estadísticas
    console.log('📊 ANÁLISIS DE IMÁGENES:');
    console.log(`   🌐 Imágenes externas (bunkerhouse.com.ar): ${stats.external.length}`);
    console.log(`   🏠 Imágenes locales (/images/): ${stats.local.length}`);
    console.log(`   ❌ Sin imagen: ${stats.noImage.length}`);
    console.log(`   ❓ Otras URLs: ${stats.other.length}`);
    console.log('');

    // Mostrar imágenes externas que se migrarán
    if (stats.external.length > 0) {
      console.log('🚀 IMÁGENES QUE SE MIGRARÁN:');
      console.log('============================');
      
      // Agrupar por URL para ver duplicados
      const urlGroups = {};
      stats.external.forEach(product => {
        if (!urlGroups[product.image]) {
          urlGroups[product.image] = [];
        }
        urlGroups[product.image].push(product);
      });

      const uniqueUrls = Object.keys(urlGroups);
      console.log(`📸 URLs únicas a descargar: ${uniqueUrls.length}`);
      console.log('');

      uniqueUrls.forEach((url, i) => {
        const products = urlGroups[url];
        console.log(`${i + 1}. ${url}`);
        console.log(`   📦 Productos que usan esta imagen: ${products.length}`);
        
        if (products.length <= 3) {
          products.forEach(p => {
            console.log(`      - ${p.name} (${p.category})`);
          });
        } else {
          products.slice(0, 2).forEach(p => {
            console.log(`      - ${p.name} (${p.category})`);
          });
          console.log(`      ... y ${products.length - 2} más`);
        }
        console.log('');
      });

      console.log('💾 PROCESO DE MIGRACIÓN:');
      console.log('========================');
      console.log('1. 📥 Descargar cada imagen única desde bunkerhouse.com.ar');
      console.log('2. ☁️  Subir imágenes a Firebase Storage');
      console.log('3. 🔄 Actualizar URLs en la base de datos');
      console.log('4. 🧹 Limpiar archivos temporales');
      console.log('');

      console.log('📂 ESTRUCTURA EN FIREBASE STORAGE:');
      console.log('==================================');
      console.log('products/');
      stats.external.slice(0, 3).forEach(product => {
        const fileName = product.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        console.log(`├── ${fileName}-[timestamp].webp`);
      });
      if (stats.external.length > 3) {
        console.log(`└── ... y ${stats.external.length - 3} más`);
      }
      console.log('');

      console.log('⚠️  CONSIDERACIONES:');
      console.log('====================');
      console.log('• Las imágenes se descargarán a un directorio temporal');
      console.log('• Se subirán a Firebase Storage en la carpeta "products/"');
      console.log('• Las URLs en la BD se actualizarán automáticamente');
      console.log('• Los archivos temporales se eliminarán al finalizar');
      console.log('• El proceso puede tomar varios minutos dependiendo del tamaño');
      console.log('');

      console.log('🚀 PARA EJECUTAR LA MIGRACIÓN:');
      console.log('==============================');
      console.log('node scripts/migrate-images-to-firebase.mjs');
      console.log('');

    } else {
      console.log('✅ No hay imágenes externas para migrar');
      console.log('   Todas las imágenes ya están en tu servidor o son locales');
    }

    // Mostrar productos sin imagen
    if (stats.noImage.length > 0) {
      console.log(`📝 PRODUCTOS SIN IMAGEN (${stats.noImage.length}):`);
      stats.noImage.slice(0, 10).forEach((product, i) => {
        console.log(`   ${i + 1}. ${product.name} (${product.category})`);
      });
      if (stats.noImage.length > 10) {
        console.log(`   ... y ${stats.noImage.length - 10} más`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

// Ejecutar vista previa
previewMigration();
