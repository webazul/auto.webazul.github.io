import { useState } from 'react'
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa'
import ChangePasswordModal from '../ChangePasswordModal'
import './DashboardProfileView.css'

export default function DashboardProfileView({ currentUser, currentStore }) {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)

  return (
    <div className="dashboard-content">
      <div className="content-header">
        <div>
          <h1>Meu Perfil</h1>
          <p>Gerencie suas informações pessoais e segurança</p>
        </div>
      </div>

      <div className="profile-sections">
        {/* Informações do Usuário */}
        <div className="profile-section">
          <div className="section-header">
            <FaUser className="section-icon" />
            <h2>Informações do Usuário</h2>
          </div>
          <div className="section-content">
            <div className="info-row">
              <div className="info-label">
                <FaEnvelope className="info-icon" />
                <span>Email</span>
              </div>
              <div className="info-value">{currentUser?.email}</div>
            </div>
            <div className="info-row">
              <div className="info-label">
                <FaUser className="info-icon" />
                <span>ID do Usuário</span>
              </div>
              <div className="info-value user-id">{currentUser?.uid}</div>
            </div>
          </div>
        </div>

        {/* Segurança */}
        <div className="profile-section">
          <div className="section-header">
            <FaLock className="section-icon" />
            <h2>Segurança</h2>
          </div>
          <div className="section-content">
            <div className="security-action">
              <div className="action-info">
                <h3>Alterar Senha</h3>
                <p>Mantenha sua conta segura alterando sua senha regularmente</p>
              </div>
              <button
                className="change-password-btn"
                onClick={() => setShowChangePasswordModal(true)}
              >
                <FaLock />
                <span>Alterar Senha</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Troca de Senha */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        currentUser={currentUser}
      />
    </div>
  )
}
