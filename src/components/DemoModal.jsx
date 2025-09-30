import { useEffect, useState } from 'react'
import { FiAlertCircle, FiX } from 'react-icons/fi'
import './DemoModal.css'

export default function DemoModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Sempre mostrar o modal com um pequeno delay
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className="demo-modal-overlay" onClick={handleClose}>
      <div className="demo-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="demo-modal-close" onClick={handleClose}>
          <FiX />
        </button>

        <div className="demo-modal-icon">
          <FiAlertCircle />
        </div>

        <h2 className="demo-modal-title">Site de Demonstração</h2>

        <p className="demo-modal-description">
          Este é um site de demonstração criado para apresentar as funcionalidades
          da plataforma WebAzul Cars.
        </p>

        <div className="demo-modal-warning">
          <strong>Atenção:</strong>
          <ul>
            <li>Os veículos apresentados não são reais</li>
            <li>Os preços são meramente ilustrativos</li>
            <li>As informações são fictícias para fins de demonstração</li>
          </ul>
        </div>

        <button className="demo-modal-button" onClick={handleClose}>
          Entendi, continuar
        </button>
      </div>
    </div>
  )
}