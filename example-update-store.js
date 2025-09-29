// Exemplo de como atualizar a loja com logo personalizado
// Execute este código no console do navegador na página do seu site

// 1. Para adicionar logo personalizado à loja atual:
/*
Adicione estes campos na collection 'stores' no Firestore Console:

{
  "active": true,
  "domain": "localhost:5174",
  "owner": "pH5UVo38qiYlzFbtUBZef6uaQqV2",
  "name": "Minha Auto Loja", // NOVO CAMPO
  "logo": "https://example.com/meu-logo.png" // NOVO CAMPO
}
*/

// 2. Exemplo com logo de uma empresa real:
const exampleStore = {
  active: true,
  domain: "localhost:5174",
  owner: "pH5UVo38qiYlzFbtUBZef6uaQqV2", // substitua pelo seu UID
  name: "BMW Premium Motors",
  logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg"
}

// 3. Para testar com uma imagem local:
const localExampleStore = {
  active: true,
  domain: "localhost:5174",
  owner: "pH5UVo38qiYlzFbtUBZef6uaQqV2",
  name: "Cars & Motors Ltd",
  logo: null // Null = usa ícone padrão FaCar
}

console.log('📋 Estrutura de exemplo para atualizar no Firestore:')
console.log(JSON.stringify(exampleStore, null, 2))

console.log('\n🎯 Como funciona:')
console.log('1. Se "logo" for uma URL válida → mostra a imagem')
console.log('2. Se "logo" for null/undefined → mostra ícone FaCar + nome')
console.log('3. O mesmo logo aparece em: Header, Dashboard, Login')
console.log('4. Campo "name" substitui "WebAzul Cars" quando não há logo')