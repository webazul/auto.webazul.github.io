const admin = require('firebase-admin')

// Inicializar Firebase Admin (usando variáveis de ambiente do Firebase)
if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

async function updateStoreStructure() {
  try {
    console.log('🔍 Buscando lojas para atualizar estrutura...')

    const storesSnapshot = await db.collection('stores').get()

    if (storesSnapshot.empty) {
      console.log('❌ Nenhuma loja encontrada')
      return
    }

    for (const doc of storesSnapshot.docs) {
      const storeData = doc.data()
      const storeId = doc.id

      console.log(`📝 Atualizando loja: ${storeId}`)

      // Atualizar com os novos campos
      const updatedData = {
        ...storeData,
        name: storeData.name || 'Car Store', // Nome padrão se não existir
        logo: storeData.logo || null, // Logo padrão null - será ícone car se não tiver
        // Manter os campos existentes
        active: storeData.active,
        domain: storeData.domain,
        owner: storeData.owner
      }

      await db.collection('stores').doc(storeId).update(updatedData)

      console.log(`✅ Loja ${storeId} atualizada com nova estrutura`)
      console.log(`   - Nome: ${updatedData.name}`)
      console.log(`   - Logo: ${updatedData.logo || 'Ícone padrão (FaCar)'}`)
      console.log(`   - Domínio: ${updatedData.domain}`)
    }

    console.log('\\n🎉 Estrutura das lojas atualizada com sucesso!')
    console.log('\\n📋 Como usar:')
    console.log('1. Para usar logo personalizado: Adicione URL da imagem no campo "logo" da loja')
    console.log('2. Para usar nome personalizado: Atualize o campo "name" da loja')
    console.log('3. Se não tiver logo definido, aparecerá o ícone de carro padrão')
    console.log('4. O mesmo logo/nome aparecerá em: Header, Dashboard, Login')

  } catch (error) {
    console.error('❌ Erro ao atualizar estrutura das lojas:', error)
  } finally {
    process.exit(0)
  }
}

// Executar script
updateStoreStructure()