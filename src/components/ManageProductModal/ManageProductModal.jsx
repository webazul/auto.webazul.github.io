import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore'
import { db } from '../../firebase/config'
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
  FaEdit,
  FaTrash,
  FaPlus,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaStickyNote,
  FaClock,
  FaUsers,
  FaUpload,
  FaFilePdf,
  FaFileAlt,
  FaFileImage,
  FaEye,
  FaDownload,
  FaInfoCircle,
  FaCamera,
  FaImages
} from 'react-icons/fa'
import './ManageProductModal.css'

export default function ManageProductModal({
  isOpen,
  onClose,
  product,
  allClientes,
  currentStore,
  onDelete,
  onMarkAsSold,
  onEdit,
  onAddInterested, // Callback para abrir modal de adicionar interessado
  onAddFile, // Callback para abrir modal de adicionar arquivo
  formatCurrency,
  onProductUpdated, // Callback para notificar Dashboard de mudanças
  onClienteCreated // Callback para recarregar lista de clientes
}) {
  // States locais do modal
  const [activeTab, setActiveTab] = useState('info')
  const [localProduct, setLocalProduct] = useState(product)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [interestedList, setInterestedList] = useState([])
  const [loadingInterested, setLoadingInterested] = useState(false)
  const [filesList, setFilesList] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(false)

  // Sincronizar localProduct quando product mudar
  useEffect(() => {
    if (product) {
      setLocalProduct(product)
    }
  }, [product])

  // Carregar lista de interessados da collection product_interested
  useEffect(() => {
    const loadInterested = async () => {
      if (!product?.id || !currentStore?.id) return

      setLoadingInterested(true)
      try {
        const q = query(
          collection(db, 'product_interested'),
          where('productId', '==', product.id),
          where('storeId', '==', currentStore.id),
          orderBy('position', 'asc')
        )

        const snapshot = await getDocs(q)
        const interestedPromises = []

        snapshot.forEach(docSnap => {
          const data = docSnap.data()
          // Buscar dados do cliente
          const clientPromise = getDocs(
            query(collection(db, 'clients'), where('__name__', '==', data.clientId))
          ).then(clientSnapshot => {
            const clientData = clientSnapshot.docs[0]?.data() || {}
            return {
              id: docSnap.id,
              ...data,
              // Adicionar dados do cliente
              clientName: clientData.name || 'Cliente não encontrado',
              clientEmail: clientData.email || '',
              clientPhone: clientData.phone || ''
            }
          })

          interestedPromises.push(clientPromise)
        })

        const interested = await Promise.all(interestedPromises)
        setInterestedList(interested)
      } catch (error) {
        console.error('Erro ao carregar interessados:', error)
      } finally {
        setLoadingInterested(false)
      }
    }

    if (isOpen && activeTab === 'interested') {
      loadInterested()
    }
  }, [product?.id, currentStore?.id, isOpen, activeTab])

  // Carregar lista de arquivos da collection product_files
  useEffect(() => {
    const loadFiles = async () => {
      if (!product?.id || !currentStore?.id) return

      setLoadingFiles(true)
      try {
        const q = query(
          collection(db, 'product_files'),
          where('productId', '==', product.id),
          where('storeId', '==', currentStore.id),
          orderBy('createdAt', 'desc')
        )

        const snapshot = await getDocs(q)
        const files = []
        snapshot.forEach(doc => {
          files.push({
            id: doc.id,
            ...doc.data()
          })
        })

        setFilesList(files)
      } catch (error) {
        console.error('Erro ao carregar arquivos:', error)
      } finally {
        setLoadingFiles(false)
      }
    }

    if (isOpen && activeTab === 'files') {
      loadFiles()
    }
  }, [product?.id, currentStore?.id, isOpen, activeTab])

  const handleClose = () => {
    setActiveTab('info')
    setCurrentPhotoIndex(0)
    onClose()
  }

  // === FUNÇÕES PARA GERENCIAR ARQUIVOS ===

  // Recarregar lista de arquivos
  const reloadFiles = async () => {
    if (!product?.id || !currentStore?.id) return

    setLoadingFiles(true)
    try {
      const q = query(
        collection(db, 'product_files'),
        where('productId', '==', product.id),
        where('storeId', '==', currentStore.id),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(q)
      const files = []
      snapshot.forEach(doc => {
        files.push({
          id: doc.id,
          ...doc.data()
        })
      })

      setFilesList(files)
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error)
    } finally {
      setLoadingFiles(false)
    }
  }

  // Remover arquivo
  const handleDeleteFile = async (fileId, fileUrl) => {
    if (!confirm('Deseja remover este arquivo?')) return

    try {
      // Deletar do Firestore
      const fileRef = doc(db, 'product_files', fileId)
      await deleteDoc(fileRef)

      // TODO: Deletar do Storage (opcional, pode manter para histórico)
      // const storageRef = ref(storage, fileUrl)
      // await deleteObject(storageRef)

      // Recarregar lista
      await reloadFiles()

      alert('Arquivo removido com sucesso!')
    } catch (error) {
      console.error('Erro ao remover arquivo:', error)
      alert('Erro ao remover arquivo. Tente novamente.')
    }
  }

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // === FUNÇÕES INTERNAS PARA GERENCIAR INTERESSADOS ===

  // Recarregar lista de interessados
  const reloadInterested = async () => {
    if (!product?.id || !currentStore?.id) return

    setLoadingInterested(true)
    try {
      const q = query(
        collection(db, 'product_interested'),
        where('productId', '==', product.id),
        where('storeId', '==', currentStore.id),
        orderBy('position', 'asc')
      )

      const snapshot = await getDocs(q)
      const interestedPromises = []

      snapshot.forEach(docSnap => {
        const data = docSnap.data()
        // Buscar dados do cliente
        const clientPromise = getDocs(
          query(collection(db, 'clients'), where('__name__', '==', data.clientId))
        ).then(clientSnapshot => {
          const clientData = clientSnapshot.docs[0]?.data() || {}
          return {
            id: docSnap.id,
            ...data,
            // Adicionar dados do cliente
            clientName: clientData.name || 'Cliente não encontrado',
            clientEmail: clientData.email || '',
            clientPhone: clientData.phone || ''
          }
        })

        interestedPromises.push(clientPromise)
      })

      const interested = await Promise.all(interestedPromises)
      setInterestedList(interested)
    } catch (error) {
      console.error('Erro ao carregar interessados:', error)
    } finally {
      setLoadingInterested(false)
    }
  }

  // Atualizar status do interessado
  const handleUpdateInterestedStatus = async (interestedId, newStatus) => {
    try {
      const interestedRef = doc(db, 'product_interested', interestedId)
      await updateDoc(interestedRef, {
        status: newStatus
      })

      // Recarregar lista
      await reloadInterested()

      console.log('Status atualizado com sucesso')
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status. Tente novamente.')
    }
  }

  // Remover interessado e atualizar posições
  const handleRemoveInterested = async (interestedId) => {
    try {
      // Buscar o interessado para pegar sua posição
      const interestedRef = doc(db, 'product_interested', interestedId)
      const interestedSnap = await getDoc(interestedRef)
      const deletedPosition = interestedSnap.data()?.position

      // Deletar o interessado
      await deleteDoc(interestedRef)

      // Buscar todos os interessados com posição maior que a deletada
      const q = query(
        collection(db, 'product_interested'),
        where('productId', '==', product.id),
        where('storeId', '==', currentStore.id),
        where('position', '>', deletedPosition)
      )

      const snapshot = await getDocs(q)

      // Atualizar posição de cada um (decrementar em 1)
      const updatePromises = []
      snapshot.forEach(docSnap => {
        const docRef = doc(db, 'product_interested', docSnap.id)
        updatePromises.push(updateDoc(docRef, {
          position: docSnap.data().position - 1
        }))
      })

      await Promise.all(updatePromises)

      // Recarregar lista
      await reloadInterested()
    } catch (error) {
      console.error('Erro ao remover interessado:', error)
      alert('Erro ao remover interessado. Tente novamente.')
    }
  }

  if (!isOpen || !product) return null

  // Preparar todas as fotos (perfil + galeria)
  const allPhotos = []
  if (product.profilePhoto) allPhotos.push(product.profilePhoto)
  if (product.gallery && product.gallery.length > 0) {
    allPhotos.push(...product.gallery)
  }

  return (
    <>
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
          className="modal manage-modal"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'white',
            borderRadius: '12px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div className="modal-header">
            <h3>Gerenciar Produto</h3>
            <button className="modal-close" onClick={handleClose}>
              <FaTimes />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body manage-modal-body">
            <div className="product-summary-tabs">
                {/* Tabs Navigation */}
                <div className="tabs-nav">
                  <button
                    className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                    onClick={() => setActiveTab('info')}
                  >
                    Informações
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('photos')}
                  >
                    Fotos
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
                    onClick={() => setActiveTab('files')}
                  >
                    Arquivos
                  </button>
                  {product?.status === 'sold' ? (
                    <button
                      className={`tab-btn ${activeTab === 'buyer' ? 'active' : ''}`}
                      onClick={() => setActiveTab('buyer')}
                    >
                      Comprador
                    </button>
                  ) : (
                    <button
                      className={`tab-btn ${activeTab === 'interested' ? 'active' : ''}`}
                      onClick={() => setActiveTab('interested')}
                    >
                      Interessados
                    </button>
                  )}
                  <button
                    className={`tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('actions')}
                  >
                    Ações
                  </button>
                </div>

                {/* Tabs Content */}
                <div className="tabs-content">
                  {/* Aba Informações */}
                  {activeTab === 'info' && (
                    <div className="tab-panel">
                      {/* Informações Básicas */}
                      <div className="summary-section">
                        <div className="summary-item">
                          <span className="label">Nome:</span>
                          <span className="value">{product.name || product.nome}</span>
                        </div>
                        <div className="summary-item">
                          <span className="label">Marca:</span>
                          <span className="value">{product.brand || product.marca}</span>
                        </div>
                        <div className="summary-item">
                          <span className="label">Modelo:</span>
                          <span className="value">{product.model || product.modelo}</span>
                        </div>
                        <div className="summary-item">
                          <span className="label">Versão:</span>
                          <span className="value">{product.version || product.versao || '-'}</span>
                        </div>
                        <div className="summary-item">
                          <span className="label">Ano:</span>
                          <span className="value">{product.year || product.ano}</span>
                        </div>
                        <div className="summary-item">
                          <span className="label">Preço de Venda:</span>
                          <span className="value price">{formatCurrency(product.price || product.preco)}</span>
                        </div>
                        {(product.originalPrice || product.precoOriginal) && (
                          <div className="summary-item">
                            <span className="label">Preço Original:</span>
                            <span className="value">{formatCurrency(product.originalPrice || product.precoOriginal)}</span>
                          </div>
                        )}
                        <div className="summary-item">
                          <span className="label">Status:</span>
                          <span className={`status-badge ${
                            (product.status || (product.ativo ? 'active' : 'inactive'))
                          }`}>
                            {(() => {
                              const status = product.status || (product.vendido ? 'sold' : product.excluido ? 'deleted' : product.ativo ? 'active' : 'inactive')
                              switch (status) {
                                case 'active': return 'Ativo'
                                case 'sold': return 'Vendido'
                                case 'deleted': return 'Excluído'
                                default: return 'Inativo'
                              }
                            })()}
                          </span>
                        </div>
                        {product.stockNumber && (
                          <div className="summary-item">
                            <span className="label">Nº Stock:</span>
                            <span className="value">{product.stockNumber}</span>
                          </div>
                        )}
                        {product.vin && (
                          <div className="summary-item">
                            <span className="label">VIN:</span>
                            <span className="value">{product.vin}</span>
                          </div>
                        )}
                        {product.licensePlate && (
                          <div className="summary-item">
                            <span className="label">Matrícula:</span>
                            <span className="value">{product.licensePlate}</span>
                          </div>
                        )}
                        {((product.description && product.description.trim()) || (product.descricao && product.descricao.trim())) && (
                          <div className="summary-item full-width">
                            <span className="label">Descrição:</span>
                            <p className="description-text">{product.description || product.descricao}</p>
                          </div>
                        )}
                      </div>

                      {/* Especificações Técnicas (anteriormente em Detalhes) */}
                      <div className="summary-section">
                        {((product.color && product.color.trim()) || (product.cor && product.cor.trim())) && (
                          <div className="summary-item">
                            <span className="label">Cor:</span>
                            <span className="value">{product.color || product.cor}</span>
                          </div>
                        )}
                        {((product.fuel && product.fuel.trim()) || (product.combustivel && product.combustivel.trim())) && (
                          <div className="summary-item">
                            <span className="label">Combustível:</span>
                            <span className="value">{product.fuel || product.combustivel}</span>
                          </div>
                        )}
                        {(() => {
                          const mileage = product.mileage ?? product.km
                          const hasValidMileage = mileage !== undefined &&
                                                  mileage !== null &&
                                                  mileage !== '' &&
                                                  (typeof mileage === 'number' || (typeof mileage === 'string' && mileage.trim() !== ''))
                          return hasValidMileage && (
                            <div className="summary-item">
                              <span className="label">Quilometragem:</span>
                              <span className="value">{mileage.toLocaleString()} km</span>
                            </div>
                          )
                        })()}
                        {product.transmission && (
                          <div className="summary-item">
                            <span className="label">Transmissão:</span>
                            <span className="value">{product.transmission}</span>
                          </div>
                        )}
                        {product.caixa && (
                          <div className="summary-item">
                            <span className="label">Caixa:</span>
                            <span className="value">{product.caixa}</span>
                          </div>
                        )}
                        {product.doors && (
                          <div className="summary-item">
                            <span className="label">Portas:</span>
                            <span className="value">{product.doors}</span>
                          </div>
                        )}
                        {product.seats && (
                          <div className="summary-item">
                            <span className="label">Lugares:</span>
                            <span className="value">{product.seats}</span>
                          </div>
                        )}
                        {product.power && (
                          <div className="summary-item">
                            <span className="label">Potência:</span>
                            <span className="value">{product.power} cv</span>
                          </div>
                        )}
                        {product.engineCapacity && (
                          <div className="summary-item">
                            <span className="label">Cilindrada:</span>
                            <span className="value">{product.engineCapacity} cm³</span>
                          </div>
                        )}
                        {product.condition && (
                          <div className="summary-item">
                            <span className="label">Condição:</span>
                            <span className="value">{product.condition}</span>
                          </div>
                        )}
                      </div>

                      {/* Equipamentos */}
                      {product.features && product.features.length > 0 && (
                        <div className="summary-section">
                          <div className="features-list">
                            {product.features.map((feature, index) => (
                              <div key={index} className="feature-item">
                                <FaCheck className="feature-icon" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Aba Detalhes */}
                  {activeTab === 'details' && (
                    <div className="tab-panel">
                      <div className="summary-section">
                        {((product.color && product.color.trim()) || (product.cor && product.cor.trim())) && (
                          <div className="summary-item">
                            <span className="label">Cor:</span>
                            <span className="value">{product.color || product.cor}</span>
                          </div>
                        )}
                        {((product.fuel && product.fuel.trim()) || (product.combustivel && product.combustivel.trim())) && (
                          <div className="summary-item">
                            <span className="label">Combustível:</span>
                            <span className="value">{product.fuel || product.combustivel}</span>
                          </div>
                        )}
                        {(() => {
                          const mileage = product.mileage ?? product.km
                          const hasValidMileage = mileage !== undefined &&
                                                  mileage !== null &&
                                                  mileage !== '' &&
                                                  (typeof mileage === 'number' || (typeof mileage === 'string' && mileage.trim() !== ''))
                          return hasValidMileage && (
                            <div className="summary-item">
                              <span className="label">Quilometragem:</span>
                              <span className="value">{mileage.toLocaleString()} km</span>
                            </div>
                          )
                        })()}
                        {product.transmission && (
                          <div className="summary-item">
                            <span className="label">Transmissão:</span>
                            <span className="value">{product.transmission}</span>
                          </div>
                        )}
                        {product.caixa && (
                          <div className="summary-item">
                            <span className="label">Caixa:</span>
                            <span className="value">{product.caixa}</span>
                          </div>
                        )}
                        {product.doors && (
                          <div className="summary-item">
                            <span className="label">Portas:</span>
                            <span className="value">{product.doors}</span>
                          </div>
                        )}
                        {product.seats && (
                          <div className="summary-item">
                            <span className="label">Lugares:</span>
                            <span className="value">{product.seats}</span>
                          </div>
                        )}
                        {product.power && (
                          <div className="summary-item">
                            <span className="label">Potência:</span>
                            <span className="value">{product.power} cv</span>
                          </div>
                        )}
                        {product.engineCapacity && (
                          <div className="summary-item">
                            <span className="label">Cilindrada:</span>
                            <span className="value">{product.engineCapacity} cm³</span>
                          </div>
                        )}
                        {product.condition && (
                          <div className="summary-item">
                            <span className="label">Condição:</span>
                            <span className="value">{product.condition}</span>
                          </div>
                        )}
                      </div>

                      {/* Equipamentos */}
                      {product.features && product.features.length > 0 && (
                        <div className="summary-section">
                          <div className="features-list">
                            {product.features.map((feature, index) => (
                              <div key={index} className="feature-item">
                                <FaCheck className="feature-icon" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Aba Fotos */}
                  {activeTab === 'photos' && localProduct && (
                    <div className="tab-panel">
                      <div className="photos-section">
                        {/* Foto de Perfil */}
                        <div className="photo-group">
                          <div className="profile-photo-container">
                            {localProduct.profilePhoto ? (
                              <img
                                src={localProduct.profilePhoto}
                                alt="Foto de perfil"
                                className="profile-photo-preview"
                              />
                            ) : (
                              <div className="profile-photo-upload">
                                <div className="profile-upload-label">
                                  <FaCamera size={32} />
                                  <span>Nenhuma foto de perfil</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Galeria de Fotos */}
                        <div className="photo-group">
                          <div className="gallery-grid">
                            {localProduct.gallery && localProduct.gallery.length > 0 ? (
                              localProduct.gallery.map((photo, index) => (
                                <div key={index} className="gallery-item">
                                  <img src={photo} alt={`Galeria ${index + 1}`} />
                                </div>
                              ))
                            ) : (
                              <div className="empty-gallery">
                                <FaImages size={48} />
                                <p>Nenhuma foto na galeria</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Aba Arquivos */}
                  {activeTab === 'files' && (
                    <div className="tab-panel">
                      <div className="files-section">
                        {loadingFiles ? (
                          <div className="loading-files">
                            <div className="spinner"></div>
                            <p>Carregando arquivos...</p>
                          </div>
                        ) : filesList && filesList.length > 0 ? (
                          <>
                            <div className="files-list">
                              {filesList.map((file) => {
                                const getFileIcon = () => {
                                  if (file.fileType.includes('pdf')) return <FaFilePdf />
                                  if (file.fileType.includes('word') || file.fileType.includes('document')) return <FaFileAlt />
                                  if (file.fileType.includes('excel') || file.fileType.includes('spreadsheet')) return <FaFileAlt />
                                  if (file.fileType.includes('image')) return <FaFileImage />
                                  return <FaFile />
                                }

                                return (
                                  <div key={file.id} className="file-item">
                                    <div className="file-icon">
                                      {getFileIcon()}
                                    </div>
                                    <div className="file-info">
                                      <div className="file-name">{file.fileName}</div>
                                      <div className="file-meta">
                                        <span className="file-size">{formatFileSize(file.fileSize)}</span>
                                        <span className="file-date">
                                          {new Date(file.createdAt?.seconds * 1000).toLocaleDateString('pt-PT')}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="file-actions">
                                      <a
                                        href={file.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="file-action-btn download"
                                        title="Download"
                                      >
                                        <FaDownload />
                                      </a>
                                      <button
                                        className="file-action-btn delete"
                                        onClick={() => handleDeleteFile(file.id, file.fileUrl)}
                                        title="Excluir"
                                      >
                                        <FaTrash />
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            <div className="files-info">
                              <p>
                                <strong>Total:</strong> {filesList.length} arquivo{filesList.length !== 1 ? 's' : ''} (
                                {formatFileSize(filesList.reduce((acc, file) => acc + file.fileSize, 0))})
                              </p>
                              <p className="info-note">
                                <FaInfoCircle /> Os arquivos são armazenados de forma segura e podem ser acessados a qualquer momento.
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="empty-files">
                            <FaUpload size={48} />
                            <p>Nenhum arquivo anexado</p>
                            <span>Envie documentos, certificados ou outros arquivos relacionados ao veículo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Aba Interessados */}
                  {activeTab === 'interested' && (
                    <div className="tab-panel">
                      <div className="interested-section">
                        {loadingInterested ? (
                          <div className="loading-interested">
                            <div className="spinner"></div>
                            <p>Carregando interessados...</p>
                          </div>
                        ) : interestedList && interestedList.length > 0 ? (
                          <div className="interested-list">
                            {interestedList.map((person) => (
                              <div key={person.id} className="interested-item">
                                <div className="interested-position">
                                  #{person.position}
                                </div>
                                <div className="interested-avatar">
                                  <FaUser />
                                </div>
                                <div className="interested-info">
                                  <div className="interested-name">{person.clientName}</div>
                                  <div className="interested-contact">
                                    {person.clientPhone && (
                                      <span className="contact-item">
                                        <FaPhone /> {person.clientPhone}
                                      </span>
                                    )}
                                    {person.clientEmail && (
                                      <span className="contact-item">
                                        <FaEnvelope /> {person.clientEmail}
                                      </span>
                                    )}
                                  </div>
                                  {person.notes && (
                                    <div className="interested-notes">
                                      <FaStickyNote /> {person.notes}
                                    </div>
                                  )}
                                  <div className="interested-meta">
                                    <FaClock /> Adicionado em {new Date(person.createdAt?.seconds * 1000).toLocaleDateString('pt-PT')}
                                  </div>
                                </div>
                                <div className="interested-actions">
                                  <select
                                    className="status-select"
                                    value={person.status}
                                    onChange={(e) => handleUpdateInterestedStatus(person.id, e.target.value)}
                                  >
                                    <option value="interested">Interessado</option>
                                    <option value="negotiating">Em Negociação</option>
                                    <option value="proposal_sent">Proposta Enviada</option>
                                    <option value="waiting">Aguardando Resposta</option>
                                    <option value="gave_up">Desistiu</option>
                                  </select>
                                  <button
                                    className="interested-action-btn remove"
                                    onClick={() => handleRemoveInterested(person.id)}
                                    title="Remover"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-interested">
                            <FaUsers />
                            <p>Nenhum interessado ainda</p>
                            <span>Adicione clientes interessados neste veículo</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Aba Comprador */}
                  {activeTab === 'buyer' && (
                    <div className="tab-panel">
                      <div className="buyer-section">
                        {product?.soldTo ? (
                          <div className="buyer-info-card">
                            <div className="buyer-header">
                              <div className="buyer-avatar">
                                <FaUser />
                              </div>
                              <div className="buyer-main-info">
                                <h3>{product.soldTo.clientName}</h3>
                                <span className="buyer-label">Comprador</span>
                              </div>
                            </div>

                            <div className="buyer-details">
                              <div className="buyer-detail-item">
                                <span className="detail-label">Preço de Venda:</span>
                                <span className="detail-value price">{formatCurrency(product.soldTo.salePrice)}</span>
                              </div>

                              <div className="buyer-detail-item">
                                <span className="detail-label">Data da Venda:</span>
                                <span className="detail-value">
                                  <FaClock /> {product.soldTo.soldAt?.seconds
                                    ? new Date(product.soldTo.soldAt.seconds * 1000).toLocaleDateString('pt-PT', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })
                                    : 'Data não disponível'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="empty-buyer">
                            <FaInfoCircle />
                            <p>Informações do comprador não disponíveis</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Aba Ações */}
                  {activeTab === 'actions' && (
                    <div className="tab-panel">
                      <div className="actions-section">
                        {/* Status Atual - Comentado por enquanto */}
                        {/* <div className="current-status">
                          <h4>Status Atual</h4>
                          <span className={`product-status-badge ${
                            product?.status || (
                              product?.vendido ? 'sold' :
                              product?.excluido ? 'deleted' :
                              product?.ativo ? 'active' : 'inactive'
                            )
                          }`}>
                            {(() => {
                              const status = product?.status || (
                                product?.vendido ? 'sold' :
                                product?.excluido ? 'deleted' :
                                product?.ativo ? 'active' : 'inactive'
                              )
                              switch (status) {
                                case 'active': return 'Ativo'
                                case 'sold': return 'Vendido'
                                case 'deleted': return 'Excluído'
                                default: return 'Inativo'
                              }
                            })()}
                          </span>
                        </div> */}

                        {/* Ações Disponíveis */}
                        <div className="available-actions">
                          <h4>Ações Disponíveis</h4>

                          {(() => {
                            const currentStatus = product?.status || (
                              product?.vendido ? 'sold' :
                              product?.excluido ? 'deleted' :
                              product?.ativo ? 'active' : 'active'
                            )

                            if (currentStatus === 'deleted') {
                              return (
                                <div className="info-message">
                                  <FaInfoCircle />
                                  <p>Este produto foi excluído e não pode ser modificado.</p>
                                </div>
                              )
                            }

                            if (currentStatus === 'sold') {
                              return (
                                <div className="action-buttons">
                                  <button
                                    className="contextual-btn danger"
                                    onClick={onDelete}
                                    style={{ width: '100%' }}
                                  >
                                    <FaTrash />
                                    Excluir Permanentemente
                                  </button>
                                </div>
                              )
                            }

                            return (
                              <div className="action-buttons">
                                <button
                                  className="contextual-btn success"
                                  onClick={onMarkAsSold}
                                >
                                  <FaCheck />
                                  Marcar como Vendido
                                </button>

                                <button
                                  className="contextual-btn danger"
                                  onClick={onDelete}
                                >
                                  <FaTrash />
                                  Excluir Produto
                                </button>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
          </div>

          {/* Footer com botões contextuais */}
          <div className="modal-footer manage-modal-footer">
            <div className="contextual-actions">
              {activeTab === 'info' && (
                product?.status !== 'sold' ? (
                  <button
                    className="contextual-btn primary"
                    onClick={() => {
                      if (onEdit) {
                        onEdit(product, 1) // Chama callback do Dashboard com step 1
                      }
                    }}
                  >
                    <FaEdit />
                    Editar Informações
                  </button>
                ) : (
                  <button
                    className="contextual-btn secondary"
                    onClick={handleClose}
                  >
                    Fechar
                  </button>
                )
              )}

              {activeTab === 'photos' && (
                product?.status !== 'sold' ? (
                  <button
                    className="contextual-btn primary"
                    onClick={() => {
                      if (onEdit) {
                        onEdit(product, 3) // Chama callback do Dashboard com step 3
                      }
                    }}
                  >
                    <FaImages />
                    Gerenciar Fotos
                  </button>
                ) : (
                  <button
                    className="contextual-btn secondary"
                    onClick={handleClose}
                  >
                    Fechar
                  </button>
                )
              )}

              {activeTab === 'files' && (
                <button
                  className="contextual-btn primary"
                  onClick={() => onAddFile && onAddFile(product)}
                >
                  <FaUpload />
                  Enviar Arquivo
                </button>
              )}

              {activeTab === 'interested' && (
                <button
                  className="contextual-btn success"
                  onClick={() => {
                    if (onAddInterested) {
                      onAddInterested(product)
                    }
                  }}
                >
                  <FaPlus />
                  Adicionar Interessado
                </button>
              )}

              {activeTab === 'buyer' && (
                <button
                  className="contextual-btn secondary"
                  onClick={handleClose}
                >
                  Fechar
                </button>
              )}

              {activeTab === 'actions' && (
                <button
                  className="contextual-btn secondary"
                  onClick={handleClose}
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
