import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { currentUser, authReady } = useAuth()

  if (!authReady) {
    return <div>Carregando...</div>
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return children
}