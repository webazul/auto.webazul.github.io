import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { useNavigate } from 'react-router-dom'

export default function InitialSetup() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const setupInitialData = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      // 1. Verificar se já existe
      const storeDoc = await getDoc(doc(db, 'stores', 'localhost-store'))
      if (storeDoc.exists()) {
        setError('Store localhost já existe!')
        setLoading(false)
        return
      }

      // 2. Criar usuário no Firebase Auth
      setMessage('Criando usuário no Firebase Auth...')
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        'jhony@webazul.pt',
        'WebAzul2024!' // Senha padrão - MUDE DEPOIS!
      )

      const userId = userCredential.user.uid

      // 3. Criar documento da loja
      setMessage('Criando loja no Firestore...')
      await setDoc(doc(db, 'stores', 'localhost-store'), {
        storeId: 'localhost-store',
        domain: 'localhost:5173',
        name: 'Localhost Development Store',
        owner: userId,
        email: 'jhony@webazul.pt',
        settings: {
          theme: 'default',
          currency: 'EUR',
          language: 'pt'
        },
        createdAt: new Date(),
        active: true
      })

      // 4. Criar documento do usuário
      setMessage('Criando perfil do usuário...')
      await setDoc(doc(db, 'users', userId), {
        uid: userId,
        email: 'jhony@webazul.pt',
        storeId: 'localhost-store',
        role: 'owner',
        name: 'Jhony WebAzul',
        permissions: ['all'],
        createdAt: new Date()
      })

      setMessage('✅ Setup concluído com sucesso!')

      setTimeout(() => {
        navigate('/login')
      }, 2000)

    } catch (error) {
      console.error('Erro:', error)
      if (error.code === 'auth/email-already-in-use') {
        setError('Email já cadastrado! Fazendo setup apenas do Firestore...')

        // Se o user já existe, vamos pegar o UID e criar só os docs do Firestore
        try {
          // Você precisaria fazer login primeiro para pegar o UID
          setMessage('Por favor, faça login para continuar o setup')
          setTimeout(() => navigate('/login'), 2000)
        } catch (err) {
          setError('Erro ao configurar Firestore: ' + err.message)
        }
      } else {
        setError('Erro no setup: ' + error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '3rem',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
          🚀 Setup Inicial - WebAzul Cars
        </h1>

        <div style={{
          backgroundColor: '#f0f8ff',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h3>Este setup irá criar:</h3>
          <ul>
            <li>✉️ Usuário: <strong>jhony@webazul.pt</strong></li>
            <li>🔑 Senha: <strong>WebAzul2024!</strong> (mude depois)</li>
            <li>🏢 Loja: <strong>localhost-store</strong></li>
            <li>🌐 Domínio: <strong>localhost:5173</strong></li>
            <li>👤 Role: <strong>Owner</strong></li>
          </ul>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c00',
            padding: '1rem',
            borderRadius: '5px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            backgroundColor: '#e7f5e7',
            color: '#2d5f2d',
            padding: '1rem',
            borderRadius: '5px',
            marginBottom: '1rem'
          }}>
            {message}
          </div>
        )}

        <button
          onClick={setupInitialData}
          disabled={loading}
          style={{
            width: '100%',
            padding: '1rem',
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Processando...' : '🚀 Iniciar Setup'}
        </button>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#fff3cd',
          borderRadius: '5px',
          fontSize: '0.9rem'
        }}>
          <strong>⚠️ Atenção:</strong> Execute este setup apenas uma vez.
          Após criar, use a página de login normal.
        </div>
      </div>
    </div>
  )
}