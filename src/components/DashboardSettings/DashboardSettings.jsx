import { FaCheck } from 'react-icons/fa'
import './DashboardSettings.css'

export default function DashboardSettings({
  storeSettings,
  onSettingsChange,
  onSaveSettings,
  isSubmitting,
  submitStatus,
  currentStore
}) {
  return (
    <div className="dashboard-content">
      <div className="content-header">
        <div>
          <h1>Configurações da Loja</h1>
          <p>Configure as preferências do seu site</p>
        </div>
      </div>

      {/* Localização & Moeda */}
      <div className="filters-section" style={{
        flexDirection: 'column',
        gap: '1rem',
        alignItems: 'stretch',
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#1f2937',
            margin: '0 0 0.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>Localização & Idioma</h2>
          <p style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            margin: '0'
          }}>Configure o país, moeda e idioma que serão usados no seu site</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '1.5rem'
        }}>
          <div className="form-group">
            <label htmlFor="country">País</label>
            <select
              id="country"
              value={storeSettings.country}
              onChange={(e) => onSettingsChange('country', e.target.value)}
            >
              <option value="PT">🇵🇹 Portugal</option>
              <option value="ES">🇪🇸 Espanha</option>
              <option value="FR">🇫🇷 França</option>
              <option value="IT">🇮🇹 Itália</option>
              <option value="DE">🇩🇪 Alemanha</option>
              <option value="GB">🇬🇧 Reino Unido</option>
              <option value="US">🇺🇸 Estados Unidos</option>
              <option value="BR">🇧🇷 Brasil</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="currency">Moeda</label>
            <select
              id="currency"
              value={storeSettings.currency}
              onChange={(e) => onSettingsChange('currency', e.target.value)}
            >
              <option value="EUR">€ Euro (EUR)</option>
              <option value="USD">$ Dólar Americano (USD)</option>
              <option value="GBP">£ Libra Esterlina (GBP)</option>
              <option value="BRL">R$ Real Brasileiro (BRL)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="language">Idioma</label>
            <select
              id="language"
              value={storeSettings.language}
              onChange={(e) => onSettingsChange('language', e.target.value)}
            >
              <option value="pt">Português</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button
            className="add-btn"
            onClick={onSaveSettings}
            disabled={isSubmitting}
            style={{ background: isSubmitting ? '#6b7280' : undefined }}
          >
            {isSubmitting ? (
              <>
                <div className="spinner"></div>
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <FaCheck />
                <span>Salvar Configurações</span>
              </>
            )}
          </button>
        </div>

        {submitStatus && (
          <div className={`alert ${submitStatus.includes('erro') ? 'alert-danger' : 'alert-success'}`}>
            {submitStatus}
          </div>
        )}
      </div>

      {/* Informações da Loja */}
      <div className="filters-section" style={{
        flexDirection: 'column',
        gap: '1rem',
        alignItems: 'stretch',
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#1f2937',
            margin: '0 0 0.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>Informações da Loja</h2>
          <p style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            margin: '0'
          }}>Dados técnicos da sua loja</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <label style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}>ID da Loja</label>
            {currentStore?.id}
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <label style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}>Domínio</label>
            {currentStore?.domain}
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <label style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}>Status</label>
            <span className={`product-status-badge ${currentStore?.active ? 'active' : 'inactive'}`} style={{
              alignSelf: 'flex-start',
              width: 'fit-content'
            }}>
              {currentStore?.active ? 'Ativa' : 'Inativa'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
