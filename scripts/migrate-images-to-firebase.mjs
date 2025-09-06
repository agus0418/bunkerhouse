import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
const storage = getStorage(app);

// Crear directorio temporal para imágenes
const tempDir = join(process.cwd(), 'temp-images');
if (!existsSync(tempDir)) {
  mkdirSync(tempDir, { recursive: true });
}

// Función para descargar imagen
async function downloadImage(url, filename) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000, // 30 segundos
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const filePath = join(tempDir, filename);
    const writer = createWriteStream(filePath);
    
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`❌ Error descargando ${url}:`, error.message);
    return null;
  }
}

// Función para subir imagen a Firebase Storage
async function uploadToFirebase(localPath, storagePath) {
  try {
    const fs = await import('fs');
    const imageBuffer = fs.readFileSync(localPath);
    
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, imageBuffer);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Limpiar archivo temporal
    unlinkSync(localPath);
    
    return downloadURL;
  } catch (error) {
    console.error(`❌ Error subiendo a Firebase:`, error.message);
    return null;
  }
}

// Función para generar nombre de archivo único
function generateFileName(originalUrl, productName) {
  const extension = originalUrl.split('.').pop().split('?')[0]; // Obtener extensión sin parámetros
  const cleanName = productName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const timestamp = Date.now();
  return `products/${cleanName}-${timestamp}.${extension}`;
}

// Función principal
async function migrateImages() {
  try {
    console.log('🔥 Iniciando migración de imágenes...');
    console.log(`📂 Directorio temporal: ${tempDir}`);
    console.log('');

    // Obtener todos los productos
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    
    if (snapshot.empty) {
      console.log('❌ No se encontraron productos');
      return;
    }

    console.log(`📦 Encontrados ${snapshot.size} productos`);
    
    // Filtrar productos con imágenes externas
    const productsToMigrate = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.image && data.image.includes('bunkerhouse.com.ar')) {
        productsToMigrate.push({
          id: doc.id,
          name: data.name || 'Sin nombre',
          currentImageUrl: data.image,
          docRef: doc.ref
        });
      }
    });

    console.log(`🌐 Productos con imágenes externas: ${productsToMigrate.length}`);
    
    if (productsToMigrate.length === 0) {
      console.log('✅ No hay imágenes externas para migrar');
      return;
    }

    console.log('');
    console.log('🚀 Comenzando migración...');
    console.log('');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Procesar cada producto
    for (let i = 0; i < productsToMigrate.length; i++) {
      const product = productsToMigrate[i];
      const progress = `[${i + 1}/${productsToMigrate.length}]`;
      
      console.log(`${progress} 📥 Descargando: ${product.name}`);
      console.log(`   URL: ${product.currentImageUrl}`);

      try {
        // Generar nombre de archivo
        const fileName = generateFileName(product.currentImageUrl, product.name);
        const tempFileName = `temp_${Date.now()}_${fileName.split('/').pop()}`;
        
        // Descargar imagen
        const localPath = await downloadImage(product.currentImageUrl, tempFileName);
        
        if (!localPath) {
          throw new Error('No se pudo descargar la imagen');
        }

        console.log(`   ✅ Descargada localmente`);
        
        // Subir a Firebase Storage
        console.log(`   ☁️  Subiendo a Firebase Storage...`);
        const newUrl = await uploadToFirebase(localPath, fileName);
        
        if (!newUrl) {
          throw new Error('No se pudo subir a Firebase Storage');
        }

        console.log(`   ✅ Subida a Firebase`);
        
        // Actualizar URL en la base de datos
        console.log(`   💾 Actualizando base de datos...`);
        await updateDoc(product.docRef, {
          image: newUrl
        });
        
        console.log(`   ✅ URL actualizada en BD`);
        console.log(`   🎯 Nueva URL: ${newUrl}`);
        console.log('');
        
        successCount++;
        
        // Pequeña pausa para no sobrecargar los servicios
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        errorCount++;
        const errorMsg = `${product.name}: ${error.message}`;
        errors.push(errorMsg);
        
        console.log(`   ❌ Error: ${error.message}`);
        console.log('');
      }
    }

    // Limpiar directorio temporal
    try {
      const fs = await import('fs');
      if (existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        files.forEach(file => {
          unlinkSync(join(tempDir, file));
        });
        fs.rmdirSync(tempDir);
      }
    } catch (error) {
      console.log('⚠️  No se pudo limpiar el directorio temporal');
    }

    // Resumen final
    console.log('🏁 MIGRACIÓN COMPLETADA');
    console.log('========================');
    console.log(`✅ Exitosas: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📊 Total procesadas: ${productsToMigrate.length}`);
    
    if (errors.length > 0) {
      console.log('');
      console.log('❌ Errores encontrados:');
      errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }
    
    if (successCount > 0) {
      console.log('');
      console.log('🎉 ¡Imágenes migradas exitosamente a Firebase Storage!');
      console.log('💡 Ahora todas las imágenes están centralizadas en tu servidor Firebase');
    }

  } catch (error) {
    console.error('💥 Error general:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrateImages();
