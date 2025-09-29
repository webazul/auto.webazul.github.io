# WebAzul Cars - Sistema Multi-Tenant

## 📋 Resumo do Projeto
Sistema multi-tenant para gestão de carros onde cada cliente terá seu próprio site mas todos compartilham o mesmo Firebase backend. Visitantes podem ver produtos publicamente, apenas owners podem gerenciar.

## 🛠 Stack Tecnológica
- **Framework**: React 19.1.0 + Vite 6.3.5
- **Linguagem**: JavaScript (JSX)
- **Backend**: Firebase (Authentication + Firestore)
- **Roteamento**: React Router DOM
- **Ícones**: React Icons
- **Build Tool**: Vite

## 🏗 Arquitetura Multi-Tenant

### **Identificação de Loja por Domínio**
```javascript
// AuthContext identifica automaticamente a loja pelo domínio
const domain = window.location.hostname + ':' + window.location.port
// Exemplo: "localhost:5174" ou "cliente-cars.pt"

// Busca no Firestore
const q = query(storesRef, where('domain', '==', domain))
```

### **Estrutura Firestore**

**Collection `stores/{storeId}`:**
```json
{
  "active": true,
  "domain": "localhost:5174", // ou "cliente-cars.pt"
  "owner": "pH5UVo38qiYlzFbtUBZef6uaQqV2"
}
```
- **Store ID**: Formato `localhost-store-{UUID}` ou `cliente-store-{UUID}`
- **Domain**: Domínio que identifica a loja
- **Owner**: UID do Firebase Auth do proprietário

**Collection `products/{productId}`:**
```json
{
  "storeId": "localhost-store-9fe74099-83be-41c3-a0df-62c91318c86c",
  "nome": "BMW X5 2024",
  "marca": "BMW",
  "modelo": "X5",
  "ano": 2024,
  "preco": 85000,
  "cor": "Preto",
  "combustivel": "Gasolina",
  "km": 0,
  "ativo": true,
  "createdAt": "timestamp"
}
```

## 🔒 Sistema de Autenticação

### **Firebase Auth**
- **Usuários**: Cadastro padrão Firebase (email/senha)
- **Sem collection users**: Dados mínimos apenas no Firebase Auth
- **Validação**: `user.uid === store.owner`

### **AuthContext**
```javascript
const value = {
  currentUser,        // Firebase Auth user
  currentStore,       // Loja identificada por domínio
  loading,
  authReady,
  canAccessStore: () => currentStore.owner === currentUser.uid
}
```

## 📄 Estrutura de Páginas

### **Páginas Públicas (sem autenticação)**

**Home (`/`)**
- Identifica loja pelo domínio
- Exibe 3 produtos em destaque
- Links para catálogo e área admin
- Query: `where('storeId', '==', storeId) + limit(3)`

**Cars (`/cars`)**
- Lista completa de produtos da loja
- Filtros por marca, modelo, ano
- Cards com detalhes e preços
- Query: `where('storeId', '==', storeId)`

### **Páginas Protegidas (apenas owners)**

**Login (`/login`)**
- Formulário email/senha
- Reset de senha por email
- Redireciona para dashboard se já logado

**Dashboard (`/dashboard`)**
- Informações da loja identificada
- Dados do usuário Firebase Auth
- Validação owner vs loja atual

**Admin (`/admin`)**
- Área administrativa
- Gestão de produtos (futuro)
- Relatórios (futuro)

### **Proteção de Rotas**
```jsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Verifica se user está logado e redireciona para /login se não
```

## 🔥 Firestore Security Rules

### **Estratégia de Segurança**
- **Leitura pública**: Visitantes podem ver produtos e lojas
- **Escrita restrita**: Apenas owner da loja pode criar/editar

### **Rules Implementadas**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Stores - leitura pública (identificação de loja)
    // Escrita apenas do owner
    match /stores/{storeId} {
      allow read: if true;
      allow write: if request.auth != null &&
        request.auth.uid == resource.data.owner;
    }

    // Products - leitura pública (catálogo público)
    // Escrita apenas se usuário for owner da loja
    match /products/{productId} {
      allow read: if true;

      allow create: if request.auth != null &&
        request.auth.uid == get(/databases/$(database)/documents/stores/$(request.resource.data.storeId)).data.owner;

      allow update, delete: if request.auth != null &&
        request.auth.uid == get(/databases/$(database)/documents/stores/$(resource.data.storeId)).data.owner;
    }
  }
}
```

### **Validação de Ownership**
As rules fazem lookup na collection `stores` para validar se o usuário logado é owner:
```javascript
// Busca o documento da loja usando storeId do produto
get(/databases/$(database)/documents/stores/$(request.resource.data.storeId)).data.owner
```

## 🚀 Fluxo de Funcionamento

### **Para Visitantes (não logados)**
1. Acessa `cliente-cars.pt`
2. Sistema identifica `storeId` pelo domínio
3. Busca produtos `where('storeId', '==', storeId)`
4. Exibe catálogo público
5. **Sem necessidade de login**

### **Para Administradores (logados)**
1. Acessa `/login`
2. Faz login Firebase Auth
3. Sistema valida se `user.uid === store.owner`
4. Acessa área administrativa
5. CRUD de produtos com validação automática via rules

### **Queries Automáticas por Loja**
```javascript
// Todos os componentes filtram automaticamente por storeId
const q = query(
  collection(db, 'products'),
  where('storeId', '==', currentStore.id),
  where('ativo', '==', true)  // Apenas produtos ativos para público
)
```

## 📂 Estrutura de Arquivos
```
webazul-cars.pt/
├── src/
│   ├── contexts/
│   │   └── AuthContext.jsx        # Context global (user + store)
│   ├── components/
│   │   └── ProtectedRoute.jsx     # Proteção de rotas
│   ├── pages/
│   │   ├── Home.jsx              # Produtos em destaque (público)
│   │   ├── Cars.jsx              # Catálogo completo (público)
│   │   ├── Login.jsx             # Autenticação
│   │   ├── Dashboard.jsx         # Admin dashboard
│   │   └── Admin.jsx             # Área administrativa
│   ├── firebase/
│   │   └── config.js             # Configuração Firebase
│   └── App.jsx                   # Roteamento principal
├── firebase.json                 # Config Firebase CLI
├── firestore.rules              # Security rules
└── .env                         # Credenciais Firebase
```

## 🔧 Scripts de Setup

### **Configuração Inicial**
```bash
# Instalar dependências
npm install

# Configurar Firebase
npm install firebase-admin uuid
node setup-simple.cjs  # Cria user + loja + produtos exemplo
```

### **Dados de Desenvolvimento**
- **Email**: jhony@webazul.pt
- **Senha**: WebAzul2024!
- **Store ID**: localhost-store-{UUID}
- **Domínio**: localhost:5174
- **Produtos**: 2 carros de exemplo (BMW X5, Audi A4)

## 🌐 Deploy Multi-Tenant

### **Para cada novo cliente:**
1. **Criar usuário** no Firebase Auth
2. **Criar loja** em `stores/cliente-store-{UUID}`:
   ```json
   {
     "active": true,
     "domain": "cliente-cars.pt",
     "owner": "novo-user-uid"
   }
   ```
3. **Deploy** da mesma aplicação no domínio do cliente
4. **Sistema identifica automaticamente** a loja pelo domínio

### **Isolamento de Dados**
- Cada loja vê apenas seus produtos
- Rules garantem segurança no backend
- Frontend filtra automaticamente por `storeId`
- Zero vazamento entre lojas

## 📊 Vantagens da Arquitetura

### **Escalabilidade**
- ✅ Um Firebase para N clientes
- ✅ Deploy único, domínios múltiplos
- ✅ Maintenance centralizado
- ✅ Costs sharing

### **Segurança**
- ✅ Rules validam ownership no backend
- ✅ Frontend não pode burlar filtros
- ✅ Isolamento automático por loja
- ✅ Leitura pública, escrita restrita

### **Desenvolvimento**
- ✅ Same codebase para todos
- ✅ Feature rollout simultâneo
- ✅ Testing centralizado
- ✅ Bug fixes para todos os clientes

## 🚀 Comandos Úteis

```bash
# Desenvolvimento
npm run dev                    # http://localhost:5174

# Setup
node setup-simple.cjs         # Criar dados iniciais
node update-domain.cjs        # Atualizar domínio da loja

# Firebase
firebase deploy --only firestore:rules  # Aplicar security rules
```

## 🔄 Próximas Funcionalidades
- [ ] CRUD de produtos na área admin
- [ ] Upload de imagens para produtos
- [ ] Sistema de filtros avançados
- [ ] Dashboard de vendas
- [ ] Integração com pagamentos
- [ ] SEO por loja (meta tags dinâmicas)
- [ ] PWA support