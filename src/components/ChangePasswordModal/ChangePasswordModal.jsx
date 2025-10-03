import { useState, useEffect } from 'react'
import { FaTimes, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import './ChangePasswordModal.css'

export default function ChangePasswordModal({ isOpen, onClose, currentUser }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Bloquear scroll do body quando modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }

    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [isOpen])

  const handleClose = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    onClose()
  }

  const validateForm = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Preencha todos os campos')
      return false
    }

    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres')
      return false
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem')
      return false
    }

    if (currentPassword === newPassword) {
      setError('A nova senha deve ser diferente da senha atual')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Reautenticar o usuário com a senha atual
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      )
      await reauthenticateWithCredential(currentUser, credential)

      // 2. Atualizar para a nova senha
      await updatePassword(currentUser, newPassword)

      setSuccess('Senha alterada com sucesso!')

      // Fechar modal após 2 segundos
      setTimeout(() => {
        handleClose()
      }, 2000)

    } catch (error) {
      console.error('Erro ao alterar senha:', error)

      if (error.code === 'auth/wrong-password') {
        setError('Senha atual incorreta')
      } else if (error.code === 'auth/weak-password') {
        setError('A nova senha é muito fraca')
      } else if (error.code === 'auth/requires-recent-login') {
        setError('Por favor, faça login novamente e tente outra vez')
      } else {
        setError('Erro ao alterar senha. Tente novamente.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="modal-content change-password-modal"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '100%',
          position: 'relative'
        }}
      >
        <div className="modal-header">
          <h3>Alterar Senha</h3>
          <button
            className="modal-close-btn"
            onClick={handleClose}
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Senha Atual */}
            <div className="form-group">
              <label htmlFor="current-password">
                <FaLock className="label-icon" />
                <span>Senha Atual</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  id="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Digite sua senha atual"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  tabIndex={-1}
                >
                  {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Nova Senha */}
            <div className="form-group">
              <label htmlFor="new-password">
                <FaLock className="label-icon" />
                <span>Nova Senha</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  tabIndex={-1}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <small className="input-hint">Mínimo de 6 caracteres</small>
            </div>

            {/* Confirmar Nova Senha */}
            <div className="form-group">
              <label htmlFor="confirm-password">
                <FaLock className="label-icon" />
                <span>Confirmar Nova Senha</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite novamente a nova senha"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Mensagens */}
            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success">
                {success}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="modal-btn cancel-btn"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="modal-btn confirm-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
