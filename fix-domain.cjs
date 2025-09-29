const admin = require('firebase-admin');

let app;
try {
  app = admin.app();
} catch {
  app = admin.initializeApp({ projectId: 'webazul-cars' });
}

const db = admin.firestore();

async function fixDomain() {
  try {
    // Buscar loja com porta 5174
    const storesRef = db.collection('stores');
    const snapshot = await storesRef.where('domain', '==', 'localhost:5174').get();

    if (!snapshot.empty) {
      const storeDoc = snapshot.docs[0];
      await storeDoc.ref.update({ domain: 'localhost:5173' });
      console.log('✅ Domínio atualizado para localhost:5173');
    } else {
      console.log('❌ Loja com localhost:5174 não encontrada');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    process.exit();
  }
}

fixDomain();