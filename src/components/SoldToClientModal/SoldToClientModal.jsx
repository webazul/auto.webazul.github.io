import { useState, useEffect } from 'react'
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import {
  FaTimes,
  FaCheck
} from 'react-icons/fa'
import SearchableSelect from '../SearchableSelect'
import CurrencyInput from 'react-currency-input-field'
import './SoldToClientModal.css'

export default function SoldToClientModal({
  isOpen,
  onClose,
  product,
  allClientes,
  currentStore,
  onSaleConfirmed,
  onClienteCreated
}) {
  const [clientType, setClientType] = useState('existing')
  const [selectedCliente, setSelectedCliente] = useState(null)
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [salePrice, setSalePrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset ao abrir e definir preço inicial
  useEffect(() => {
    if (isOpen && product) {
      setClientType('existing')
      setSelectedCliente(null)
      setNewClientData({
        name: '',
        email: '',
        phone: ''
      })

      // Definir preço inicial (promocional se houver, senão o preço normal)
      const initialPrice = product.isPromotional && product.price
        ? product.price
        : product.price || product.preco || 0
      setSalePrice(initialPrice.toString())
    }
  }, [isOpen, product])

  const handleClose = () => {
    setClientType('existing')
    setSelectedCliente(null)
    setNewClientData({
      name: '',
      email: '',
      phone: ''
    })
    setSalePrice('')
    onClose()
  }

  const handleConfirmSale = async () => {
    if (!product?.id || !currentStore?.id) return

    setIsSubmitting(true)

    try {
      let clientId = null

      // Se for cliente existente
      if (clientType === 'existing' && selectedCliente) {
        clientId = selectedCliente.id
      }
      // Se for novo cliente
      else if (clientType === 'new') {
        // Criar o cliente na collection clients
        const newClientRef = await addDoc(collection(db, 'clients'), {
          name: newClientData.name,
          email: newClientData.email,
          phone: newClientData.phone,
          storeId: currentStore.id,
          status: 'active',
          type: 'buyer',
          createdAt: serverTimestamp()
        })

        clientId = newClientRef.id

        // Notificar que cliente foi criado para atualizar a lista
        if (onClienteCreated) {
          onClienteCreated()
        }
      }

      // Atualizar o produto com informações da venda
      const productRef = doc(db, 'products', product.id)
      await updateDoc(productRef, {
        status: 'sold',
        soldTo: {
          clientId: clientId,
          clientName: clientType === 'existing' ? selectedCliente.name : newClientData.name,
          salePrice: parseFloat(salePrice) || 0,
          soldAt: serverTimestamp()
        }
      })

      // Notificar componente pai - ele já fecha os modais
      if (onSaleConfirmed) {
        onSaleConfirmed()
      }
      // Não chamar handleClose() aqui, pois onSaleConfirmed já fecha os modais
    } catch (error) {
      console.error('Erro ao confirmar venda:', error)
      alert('Erro ao confirmar venda. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay sold-to-client-overlay"
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 99999
      }}
    >
      <div
        className="modal-content sold-to-client-modal"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="modal-header">
          <h3>Marcar como Vendido</h3>
          <button
            className="modal-close-btn"
            onClick={handleClose}
          >
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="product-info-box">
            <h4>Veículo: {product?.name}</h4>
          </div>

          <div className="form-group">
            <label>Cliente Comprador:</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="clientType"
                  value="existing"
                  checked={clientType === 'existing'}
                  onChange={(e) => setClientType(e.target.value)}
                />
                <span>Selecionar Existente</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="clientType"
                  value="new"
                  checked={clientType === 'new'}
                  onChange={(e) => setClientType(e.target.value)}
                />
                <span>Criar Novo</span>
              </label>
            </div>
          </div>

          {clientType === 'existing' && (
            <div className="form-group">
              <label>Buscar Cliente:</label>
              <SearchableSelect
                options={allClientes
                  .filter(c => c.phone || c.email)
                  .map(c => {
                    const contactInfo = c.phone ? c.phone : c.email
                    return {
                      value: c.id,
                      label: `${c.name || 'Sem nome'} - ${contactInfo}`
                    }
                  })}
                value={selectedCliente?.id || ''}
                onChange={(value) => {
                  const cliente = allClientes.find(c => c.id === value)
                  setSelectedCliente(cliente)
                }}
                placeholder="Digite para buscar..."
                maxInitialOptions={15}
              />
              {selectedCliente && (
                <div className="selected-client-preview">
                  <div><strong>Nome:</strong> {selectedCliente.name}</div>
                  {selectedCliente.phone && <div><strong>Telefone:</strong> {selectedCliente.phone}</div>}
                  {selectedCliente.email && <div><strong>Email:</strong> {selectedCliente.email}</div>}
                </div>
              )}
            </div>
          )}

          {clientType === 'new' && (
            <>
              <div className="form-group">
                <label>Nome Completo: *</label>
                <input
                  type="text"
                  value={newClientData.name}
                  onChange={(e) => setNewClientData({...newClientData, name: e.target.value})}
                  placeholder="Digite o nome"
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData({...newClientData, email: e.target.value})}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="form-group">
                <label>Telefone:</label>
                <input
                  type="tel"
                  value={newClientData.phone}
                  onChange={(e) => setNewClientData({...newClientData, phone: e.target.value})}
                  placeholder="+351 912 345 678"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Preço de Venda: *</label>
            <CurrencyInput
              value={salePrice}
              onValueChange={(value) => setSalePrice(value || '')}
              decimalsLimit={2}
              decimalSeparator=","
              groupSeparator="."
              prefix={currentStore?.currency === 'EUR' ? '€ ' : currentStore?.currency === 'USD' ? '$ ' : '€ '}
              placeholder="0,00"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="modal-btn cancel-btn"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            className="modal-btn primary-btn"
            onClick={handleConfirmSale}
            disabled={isSubmitting || (clientType === 'existing' ? !selectedCliente : !newClientData.name) || !salePrice}
          >
            {isSubmitting ? (
              <>
                <div className="spinner"></div>
                <span>Confirmando...</span>
              </>
            ) : (
              <>
                <FaCheck />
                Confirmar Venda
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
