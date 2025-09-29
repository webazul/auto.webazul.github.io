const admin = require('firebase-admin');

// Usar a instância já inicializada ou inicializar nova
let app;
try {
  app = admin.app();
} catch {
  app = admin.initializeApp({
    projectId: 'webazul-cars'
  });
}

const db = admin.firestore();

async function updateDomain() {
  try {
    // Buscar a loja localhost
    const storesRef = db.collection('stores');
    const snapshot = await storesRef.where('domain', '==', 'localhost:5173').get();

    if (snapshot.empty) {
      console.log('❌ Nenhuma loja encontrada com domínio localhost:5173');

      // Listar todas as lojas para debug
      const allStores = await storesRef.get();
      console.log('\n📋 Lojas existentes:');
      allStores.forEach(doc => {
        const data = doc.data();
        console.log(`• ${doc.id}: domain="${data.domain}"`);
      });

      return;
    }

    // Atualizar domínio
    const storeDoc = snapshot.docs[0];
    await storeDoc.ref.update({
      domain: 'localhost:5174'
    });

    console.log('✅ Domínio atualizado!');
    console.log(`• Store ID: ${storeDoc.id}`);
    console.log('• Novo domínio: localhost:5174');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    process.exit();
  }
}

updateDomain();