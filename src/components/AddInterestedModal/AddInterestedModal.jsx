import { useState, useEffect } from 'react'
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import {
  FaTimes,
  FaPlus
} from 'react-icons/fa'
import SearchableSelect from '../SearchableSelect'
import './AddInterestedModal.css'

export default function AddInterestedModal({
  isOpen,
  onClose,
  product,
  allClientes,
  currentStore,
  onInterestedAdded,
  onClienteCreated
}) {
  const [interestedType, setInterestedType] = useState('existing')
  const [selectedCliente, setSelectedCliente] = useState(null)
  const [newInterestedData, setNewInterestedData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'interested',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setInterestedType('existing')
      setSelectedCliente(null)
      setNewInterestedData({
        name: '',
        email: '',
        phone: '',
        status: 'interested',
        notes: ''
      })
    }
  }, [isOpen])

  const handleClose = () => {
    setInterestedType('existing')
    setSelectedCliente(null)
    setNewInterestedData({
      name: '',
      email: '',
      phone: '',
      status: 'interested',
      notes: ''
    })
    onClose()
  }

  const handleAddInterested = async () => {
    if (!product?.id || !currentStore?.id) return

    setIsSubmitting(true)

    try {
      let clientId = null
      let clientName = ''
      let clientEmail = ''
      let clientPhone = ''

      // Se for cliente existente
      if (interestedType === 'existing' && selectedCliente) {
        clientId = selectedCliente.id
        clientName = selectedCliente.name
        clientEmail = selectedCliente.email || ''
        clientPhone = selectedCliente.phone || ''
      }
      // Se for novo cliente
      else if (interestedType === 'new') {
        // Primeiro criar o cliente na collection clients
        const newClientRef = await addDoc(collection(db, 'clients'), {
          name: newInterestedData.name,
          email: newInterestedData.email,
          phone: newInterestedData.phone,
          storeId: currentStore.id,
          status: 'active',
          type: 'lead',
          createdAt: serverTimestamp()
        })

        clientId = newClientRef.id
        clientName = newInterestedData.name
        clientEmail = newInterestedData.email
        clientPhone = newInterestedData.phone

        // Notificar Dashboard para recarregar lista de clientes
        if (onClienteCreated) {
          onClienteCreated()
        }
      }

      // Calcular posição na fila (contar quantos interessados já existem para este produto)
      const interestedQuery = query(
        collection(db, 'product_interested'),
        where('productId', '==', product.id),
        where('storeId', '==', currentStore.id)
      )
      const snapshot = await getDocs(interestedQuery)
      const position = snapshot.size + 1

      // Criar documento na collection product_interested
      await addDoc(collection(db, 'product_interested'), {
        productId: product.id,
        clientId: clientId,
        storeId: currentStore.id,
        // Status e metadados
        status: newInterestedData.status,
        notes: newInterestedData.notes,
        position: position,
        createdAt: serverTimestamp()
      })

      // Notificar Dashboard para recarregar
      if (onInterestedAdded) {
        onInterestedAdded(product) // Apenas notifica para recarregar
      }

      handleClose()
    } catch (error) {
      console.error('Erro ao adicionar interessado:', error)
      alert('Erro ao adicionar interessado. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay add-interested-overlay"
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
        className="modal-content add-interested-modal"
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
          <h3>Adicionar Interessado</h3>
          <button
            className="modal-close-btn"
            onClick={handleClose}
          >
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Cliente:</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="interestedType"
                  value="existing"
                  checked={interestedType === 'existing'}
                  onChange={(e) => setInterestedType(e.target.value)}
                />
                <span>Selecionar Existente</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="interestedType"
                  value="new"
                  checked={interestedType === 'new'}
                  onChange={(e) => setInterestedType(e.target.value)}
                />
                <span>Criar Novo</span>
              </label>
            </div>
          </div>

          {interestedType === 'existing' && (
            <div className="form-group">
              <label>Buscar Cliente:</label>
              <SearchableSelect
                options={allClientes
                  .filter(c => c.phone || c.email) // Só clientes com telefone OU email
                  .map(c => {
                    const contactInfo = c.phone ? c.phone : c.email // Prioridade: telefone primeiro
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

          {interestedType === 'new' && (
            <>
              <div className="form-group">
                <label>Nome Completo: *</label>
                <input
                  type="text"
                  value={newInterestedData.name}
                  onChange={(e) => setNewInterestedData({...newInterestedData, name: e.target.value})}
                  placeholder="Digite o nome"
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={newInterestedData.email}
                  onChange={(e) => setNewInterestedData({...newInterestedData, email: e.target.value})}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="form-group">
                <label>Telefone:</label>
                <input
                  type="tel"
                  value={newInterestedData.phone}
                  onChange={(e) => setNewInterestedData({...newInterestedData, phone: e.target.value})}
                  placeholder="+351 912 345 678"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Status:</label>
            <select
              value={newInterestedData.status}
              onChange={(e) => setNewInterestedData({...newInterestedData, status: e.target.value})}
            >
              <option value="interested">Interessado</option>
              <option value="negotiating">Em Negociação</option>
              <option value="proposal_sent">Proposta Enviada</option>
              <option value="waiting">Aguardando Resposta</option>
              <option value="gave_up">Desistiu</option>
            </select>
          </div>

          <div className="form-group">
            <label>Observações:</label>
            <textarea
              value={newInterestedData.notes}
              onChange={(e) => setNewInterestedData({...newInterestedData, notes: e.target.value})}
              placeholder="Ex: Cliente quer test drive, financiamento em 48x..."
              rows={3}
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
            onClick={handleAddInterested}
            disabled={isSubmitting || (interestedType === 'existing' ? !selectedCliente : !newInterestedData.name)}
          >
            {isSubmitting ? (
              <>
                <div className="spinner"></div>
                <span>Adicionando...</span>
              </>
            ) : (
              <>
                <FaPlus />
                Adicionar Interessado
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
