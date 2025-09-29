const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// Inicializar com Application Default Credentials
admin.initializeApp({
  projectId: 'webazul-cars'
});

const auth = admin.auth();
const db = admin.firestore();

async function setupSimple() {
  try {
    console.log('🚀 Setup Simplificado...\n');

    // 1. Criar/Obter usuário no Firebase Auth
    console.log('1️⃣ Configurando usuário no Firebase Auth...');
    let userRecord;

    try {
      userRecord = await auth.createUser({
        email: 'jhony@webazul.pt',
        password: 'WebAzul2024!',
        displayName: 'Jhony WebAzul',
        emailVerified: true
      });
      console.log('✅ Usuário criado com UID:', userRecord.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('⚠️ Usuário já existe, obtendo UID...');
        userRecord = await auth.getUserByEmail('jhony@webazul.pt');
        console.log('✅ UID encontrado:', userRecord.uid);
      } else {
        throw error;
      }
    }

    // 2. Gerar storeId único
    const uuid = uuidv4();
    const storeId = `localhost-store-${uuid}`;
    console.log('📦 Store ID gerado:', storeId);

    // 3. Criar documento da loja (estrutura simples)
    console.log('\n2️⃣ Criando loja no Firestore...');
    const storeData = {
      active: true,
      domain: 'localhost:5173',
      owner: userRecord.uid
    };

    await db.collection('stores').doc(storeId).set(storeData);
    console.log('✅ Loja criada:', storeId);

    // 4. Exemplo: Criar alguns produtos de teste
    console.log('\n3️⃣ Criando produtos de exemplo...');

    const produtos = [
      {
        storeId: storeId,
        nome: 'BMW X5 2024',
        preco: 85000,
        ano: 2024,
        marca: 'BMW',
        modelo: 'X5',
        cor: 'Preto',
        combustivel: 'Gasolina',
        km: 0,
        ativo: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        storeId: storeId,
        nome: 'Audi A4 2023',
        preco: 45000,
        ano: 2023,
        marca: 'Audi',
        modelo: 'A4',
        cor: 'Branco',
        combustivel: 'Diesel',
        km: 15000,
        ativo: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    for (let produto of produtos) {
      await db.collection('products').add(produto);
      console.log('✅ Produto criado:', produto.nome);
    }

    console.log('\n🎉 Setup Simplificado Concluído!');
    console.log('\n📋 Dados:');
    console.log('• Email: jhony@webazul.pt');
    console.log('• Senha: WebAzul2024!');
    console.log('• UID:', userRecord.uid);
    console.log('• Store ID:', storeId);
    console.log('• Produtos: 2 carros de exemplo');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    process.exit();
  }
}

setupSimple();