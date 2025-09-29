import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Admin() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <div style={{
        backgroundColor: '#e8f5e8',
        padding: '2rem',
        borderRadius: '10px',
        marginBottom: '2rem',
        border: '2px solid #28a745'
      }}>
        <h1>✅ OK - Área Administrativa - Acessou logado!</h1>

        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '5px',
          marginTop: '1rem'
        }}>
          <h3>Usuário Administrador:</h3>
          <p><strong>Email:</strong> {currentUser?.email}</p>
          <p><strong>UID:</strong> {currentUser?.uid}</p>
          <p><strong>Email Verificado:</strong> {currentUser?.emailVerified ? 'Sim' : 'Não'}</p>
          <p><strong>Criado em:</strong> {new Date(currentUser?.metadata?.creationTime).toLocaleString('pt-BR')}</p>
          <p><strong>Último login:</strong> {new Date(currentUser?.metadata?.lastSignInTime).toLocaleString('pt-BR')}</p>
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#fff3cd',
          borderRadius: '5px',
          border: '1px solid #ffeaa7'
        }}>
          <h4>🔧 Funcionalidades Administrativas</h4>
          <p>Esta é uma área protegida apenas para usuários autenticados.</p>
          <p>Aqui futuramente terão funcionalidades como:</p>
          <ul>
            <li>Gerenciamento de carros</li>
            <li>Relatórios</li>
            <li>Configurações do sistema</li>
            <li>Gestão de usuários</li>
          </ul>
        </div>

        <button
          onClick={handleLogout}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}