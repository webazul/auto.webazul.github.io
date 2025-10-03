import {
  FaCar,
  FaUser,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaTimes
} from 'react-icons/fa'
import './DashboardSidebar.css'

export default function DashboardSidebar({
  isOpen,
  isCollapsed,
  onToggleOpen,
  onToggleCollapse,
  onClose,
  activeMenu,
  onMenuChange,
  menuItems,
  currentUser,
  currentStore,
  onLogout,
  onProfileClick
}) {
  const handleMenuClick = (menuId) => {
    onMenuChange(menuId)
    onClose() // Fecha sidebar no mobile após selecionar
  }

  return (
    <>
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
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
                  <span className="logo-name">{currentStore?.name || 'Car Store'}</span>
                </div>
              </>
            )}
          </div>
          <div className="sidebar-controls">
            <button
              className="sidebar-toggle-collapse desktop-only"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expandir sidebar' : 'Retrair sidebar'}
            >
              {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </button>
            <button
              className="sidebar-close mobile-only"
              onClick={onClose}
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => {
            const IconComponent = item.icon
            return (
              <button
                key={item.id}
                className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => handleMenuClick(item.id)}
              >
                <IconComponent className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div
              className="user-info-clickable"
              onClick={onProfileClick}
              title="Ver perfil"
            >
              <FaUser className="user-icon" />
              <div className="user-details">
                <span className="user-email">{currentUser?.email}</span>
                {currentStore?.domain && (
                  <span className="user-domain">{currentStore.domain}</span>
                )}
              </div>
            </div>
            <button
              className="logout-icon-btn"
              onClick={onLogout}
              title="Sair do sistema"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}
    </>
  )
}
