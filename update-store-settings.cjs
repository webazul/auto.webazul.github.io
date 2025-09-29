const admin = require('firebase-admin');

// Inicializar com Application Default Credentials
admin.initializeApp({
  projectId: 'webazul-cars'
});

const db = admin.firestore();

async function updateStoreSettings() {
  try {
    console.log('🚀 Atualizando configurações da loja...\n');

    // 1. Buscar todas as lojas
    console.log('1️⃣ Buscando lojas existentes...');
    const storesSnapshot = await db.collection('stores').get();

    if (storesSnapshot.empty) {
      console.log('❌ Nenhuma loja encontrada!');
      return;
    }

    // 2. Atualizar cada loja com os novos campos
    console.log('2️⃣ Adicionando campos de país e moeda...');

    for (const doc of storesSnapshot.docs) {
      const storeData = doc.data();
      console.log(`📦 Atualizando loja: ${doc.id}`);

      // Adicionar campos de configuração se não existirem
      const updates = {
        ...storeData,
        // Adicionar apenas se não existir
        ...(storeData.country === undefined && { country: 'PT' }),
        ...(storeData.currency === undefined && { currency: 'EUR' }),
        ...(storeData.language === undefined && { language: 'pt' }),
        ...(storeData.name === undefined && { name: 'AutoAzul' }),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('stores').doc(doc.id).update(updates);
      console.log(`✅ Loja ${doc.id} atualizada`);
    }

    console.log('\n🎉 Atualização concluída com sucesso!');
    console.log('\nCampos adicionados:');
    console.log('- country: "PT" (Portugal)');
    console.log('- currency: "EUR" (Euro)');
    console.log('- language: "pt" (Português)');
    console.log('- name: "AutoAzul" (se não existia)');
    console.log('- updatedAt: timestamp');

  } catch (error) {
    console.error('❌ Erro durante a atualização:', error);
  }
}

// Executar o script
updateStoreSettings()
  .then(() => {
    console.log('\n✨ Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha no script:', error);
    process.exit(1);
  });