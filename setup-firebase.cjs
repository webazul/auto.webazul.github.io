const admin = require('firebase-admin');

// Inicializar com Application Default Credentials (já configurado com gcloud)
admin.initializeApp({
  projectId: 'webazul-cars'
});

const auth = admin.auth();
const db = admin.firestore();

async function setupFirebase() {
  try {
    console.log('🚀 Iniciando setup do Firebase...\n');

    // 1. Criar usuário no Authentication
    console.log('1️⃣ Criando usuário no Firebase Auth...');
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

    // 2. Criar documento da loja
    console.log('\n2️⃣ Criando loja no Firestore...');
    const storeData = {
      storeId: 'localhost-store',
      domain: 'localhost:5173',
      name: 'Localhost Development Store',
      owner: userRecord.uid,
      email: 'jhony@webazul.pt',
      settings: {
        theme: 'default',
        currency: 'EUR',
        language: 'pt'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true
    };

    await db.collection('stores').doc('localhost-store').set(storeData);
    console.log('✅ Loja criada: localhost-store');

    // 3. Criar documento do usuário
    console.log('\n3️⃣ Criando perfil do usuário no Firestore...');
    const userData = {
      uid: userRecord.uid,
      email: 'jhony@webazul.pt',
      storeId: 'localhost-store',
      role: 'owner',
      name: 'Jhony WebAzul',
      permissions: ['all'],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(userRecord.uid).set(userData);
    console.log('✅ Perfil do usuário criado');

    // 4. Configurar regras do Firestore
    console.log('\n4️⃣ Configurando regras do Firestore...');
    const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Stores - leitura pública, escrita apenas do owner
    match /stores/{storeId} {
      allow read: if true;
      allow write: if request.auth != null && resource.data.owner == request.auth.uid;
    }

    // Users - apenas o próprio usuário pode ver/editar
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Cars - leitura pública, escrita apenas se storeId bater
    match /cars/{carId} {
      allow read: if true;
      allow create: if request.auth != null &&
        request.resource.data.storeId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.storeId;
      allow update, delete: if request.auth != null &&
        resource.data.storeId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.storeId;
    }
  }
}`;

    // Salvar regras em arquivo (você precisará aplicar manualmente)
    require('fs').writeFileSync('firestore.rules', rules);
    console.log('✅ Regras salvas em firestore.rules (aplicar manualmente)');

    console.log('\n🎉 Setup concluído com sucesso!');
    console.log('\n📋 Resumo:');
    console.log('• Email: jhony@webazul.pt');
    console.log('• Senha: WebAzul2024!');
    console.log('• UID:', userRecord.uid);
    console.log('• Store ID: localhost-store');
    console.log('• Domínio: localhost:5173');

    console.log('\n🚀 Próximos passos:');
    console.log('1. Execute: npm run dev');
    console.log('2. Acesse: http://localhost:5173/login');
    console.log('3. Faça login e acesse /dashboard');

  } catch (error) {
    console.error('❌ Erro no setup:', error.message);
  } finally {
    process.exit();
  }
}

setupFirebase();