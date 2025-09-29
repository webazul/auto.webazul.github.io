import { useState, useEffect } from 'react'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase/config'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  FaUser,
  FaLock,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaCar,
  FaArrowLeft,
  FaSpinner
} from 'react-icons/fa'
import '../styles/admin-design-system.css'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('auto@webazul.pt')
  const [password, setPassword] = useState('12345678')
  const [resetEmail, setResetEmail] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showResetForm, setShowResetForm] = useState(false)

  const navigate = useNavigate()
  const { currentUser, currentStore } = useAuth()

  // Redirecionar se já logado
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard')
    }
  }, [currentUser, navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/dashboard')
    } catch (error) {
      setError('Email ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await sendPasswordResetEmail(auth, resetEmail)
      setMessage('Email de redefinição enviado! Verifique sua caixa de entrada.')
      setShowResetForm(false)
      setResetEmail('')
    } catch (error) {
      setError('Erro ao enviar email de redefinição')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Background */}
      <div className="login-background">
        <div className="background-pattern"></div>
      </div>

      {/* Header */}
      <div className="login-header">
        <Link to="/" className="back-to-home">
          <FaArrowLeft />
          <span>Voltar ao Site</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="login-container">
        <div className="login-card">
          {/* Logo */}
          <div className="login-logo">
            {currentStore?.logo ? (
              <img
                src={currentStore.logo}
                alt={currentStore.name || 'Logo'}
                className="logo-image"
              />
            ) : (
              <>
                <div className="logo-icon">
                  <FaCar />
                </div>
                <div className="logo-text">
                  <span className="logo-name">{currentStore?.name || 'AutoAzul'}</span>
                </div>
              </>
            )}
          </div>

          {/* Title */}
          <div className="login-title">
            <h1>{showResetForm ? 'Redefinir Senha' : 'Área Administrativa'}</h1>
            <p>{showResetForm ? 'Digite seu email para receber as instruções' : 'Acesse sua conta para gerenciar o sistema'}</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert alert-error">
              <FaShieldAlt />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="alert alert-success">
              <FaShieldAlt />
              <span>{message}</span>
            </div>
          )}

          {/* Forms */}
          {!showResetForm ? (
            <form className="login-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email de Acesso</label>
                <div className="input-wrapper">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Senha</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`login-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spinner" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <>
                    <FaUser />
                    <span>Entrar no Sistema</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="forgot-password"
                onClick={() => setShowResetForm(true)}
              >
                Esqueci minha senha
              </button>
            </form>
          ) : (
            <form className="reset-form" onSubmit={handlePasswordReset}>
              <div className="form-group">
                <label>Email para Redefinição</label>
                <div className="input-wrapper">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className={`reset-btn ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="spinner" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <FaEnvelope />
                      <span>Enviar Instruções</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="back-btn"
                  onClick={() => {
                    setShowResetForm(false)
                    setError('')
                    setMessage('')
                  }}
                >
                  <FaArrowLeft />
                  <span>Voltar ao Login</span>
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="login-footer">
            <p>Sistema multi-tenant seguro</p>
            <div className="security-badges">
              <div className="security-badge">
                <FaShieldAlt />
                <span>SSL</span>
              </div>
              <div className="security-badge">
                <FaLock />
                <span>Seguro</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}