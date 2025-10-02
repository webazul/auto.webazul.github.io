import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../firebase/config'
import {
  FaTimes,
  FaUpload,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaFile
} from 'react-icons/fa'
import './AddFileModal.css'

export default function AddFileModal({
  isOpen,
  onClose,
  product,
  currentStore,
  onFileAdded
}) {
  const [selectedFiles, setSelectedFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)

    if (files.length > 5) {
      alert('Você pode selecionar no máximo 5 arquivos por vez.')
      return
    }

    // Validar tamanho de cada arquivo (máximo 50MB)
    const maxSize = 50 * 1024 * 1024
    const invalidFiles = files.filter(file => file.size > maxSize)

    if (invalidFiles.length > 0) {
      alert(`${invalidFiles.length} arquivo(s) excede(m) o tamanho máximo de 50MB.`)
      return
    }

    setSelectedFiles(files)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return <FaFilePdf />
    if (fileType.includes('word') || fileType.includes('document')) return <FaFileWord />
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return <FaFileExcel />
    if (fileType.includes('image')) return <FaFileImage />
    return <FaFile />
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !product?.id || !currentStore?.id) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const totalFiles = selectedFiles.length
      let uploadedCount = 0

      // Upload cada arquivo
      for (const file of selectedFiles) {
        // Upload para Storage
        const fileId = crypto.randomUUID()
        const filePath = `products/${currentStore.id}/${product.id}/files/${fileId}_${file.name}`
        const storageRef = ref(storage, filePath)

        // Upload
        await uploadBytes(storageRef, file)
        const fileUrl = await getDownloadURL(storageRef)

        // Salvar metadados no Firestore
        await addDoc(collection(db, 'product_files'), {
          productId: product.id,
          storeId: currentStore.id,
          fileName: file.name,
          fileUrl: fileUrl,
          fileSize: file.size,
          fileType: file.type,
          createdAt: serverTimestamp()
        })

        uploadedCount++
        setUploadProgress(Math.round((uploadedCount / totalFiles) * 100))
      }

      // Notificar sucesso
      if (onFileAdded) {
        onFileAdded()
      }

      alert(`${totalFiles} arquivo(s) enviado(s) com sucesso!`)
      handleClose()
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      alert('Erro ao enviar arquivo(s). Tente novamente.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleClose = () => {
    setSelectedFiles([])
    setUploadProgress(0)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay add-file-overlay"
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
        className="modal-content add-file-modal"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="modal-header">
          <h3>Enviar Arquivo</h3>
          <button
            className="modal-close-btn"
            onClick={handleClose}
            disabled={isUploading}
          >
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {selectedFiles.length === 0 ? (
            <div className="file-drop-zone">
              <input
                type="file"
                id="fileInput"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                multiple
              />
              <label htmlFor="fileInput" className="file-drop-label">
                <FaUpload size={48} />
                <h4>Selecione arquivos</h4>
                <p>PDF, Word, Excel ou Imagem</p>
                <p className="file-size-limit">Máximo 5 arquivos de 50MB cada</p>
                <span className="select-file-btn">
                  Escolher Arquivos
                </span>
              </label>
            </div>
          ) : (
            <div className="files-preview-list">
              <div className="files-header">
                <h4>{selectedFiles.length} arquivo(s) selecionado(s)</h4>
                {!isUploading && (
                  <button
                    type="button"
                    className="change-file-btn"
                    onClick={() => setSelectedFiles([])}
                  >
                    Trocar Arquivos
                  </button>
                )}
              </div>
              <div className="files-list">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="file-preview-item">
                    <div className="file-icon">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="file-info">
                      <h5>{file.name}</h5>
                      <p>{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isUploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p>Enviando... {uploadProgress}%</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="modal-btn cancel-btn"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancelar
          </button>
          <button
            className="modal-btn upload-btn"
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <div className="spinner"></div>
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <FaUpload />
                {selectedFiles.length > 1 ? `Enviar ${selectedFiles.length} Arquivos` : 'Enviar Arquivo'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
