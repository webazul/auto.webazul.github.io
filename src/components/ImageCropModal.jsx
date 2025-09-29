import { useState, useRef, useEffect } from 'react'
import { FaTimes, FaCheck } from 'react-icons/fa'
import './ImageCropModal.css'

export default function ImageCropModal({
  isOpen,
  onClose,
  selectedFile,
  onCropComplete
}) {

  const [imageTransform, setImageTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [processing, setProcessing] = useState(false)

  const imageRef = useRef(null)
  const containerRef = useRef(null)
  const cropSize = 300 // Tamanho fixo do crop em px

  // Reset quando abrir modal
  useEffect(() => {
    if (isOpen && selectedFile) {
      setImageTransform({ x: 0, y: 0, scale: 1 })
      setImageLoaded(false)
      setProcessing(false)
    }
  }, [isOpen, selectedFile])

  const handleImageLoad = () => {
    setImageLoaded(true)
    // Auto-ajustar scale inicial para cobrir o círculo
    if (imageRef.current) {
      const img = imageRef.current
      const minScale = Math.max(cropSize / img.naturalWidth, cropSize / img.naturalHeight)
      setImageTransform(prev => ({ ...prev, scale: Math.max(1, minScale) }))
    }
  }

  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - imageTransform.x,
      y: e.clientY - imageTransform.y
    })
  }

  const handleMouseMove = (e) => {
    if (!isDragging || !imageRef.current) return

    e.preventDefault()
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    setImageTransform(prev => ({ ...prev, x: newX, y: newY }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch events para mobile
  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      x: touch.clientX - imageTransform.x,
      y: touch.clientY - imageTransform.y
    })
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return

    e.preventDefault()
    const touch = e.touches[0]
    const newX = touch.clientX - dragStart.x
    const newY = touch.clientY - dragStart.y

    setImageTransform(prev => ({ ...prev, x: newX, y: newY }))
  }

  const handleZoomChange = (e) => {
    const newScale = parseFloat(e.target.value)
    setImageTransform(prev => ({ ...prev, scale: newScale }))
  }

  const getCroppedImage = () => {
    return new Promise((resolve) => {
      if (!imageRef.current) return resolve(null)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = imageRef.current

      // Define tamanho do canvas = tamanho do crop
      canvas.width = cropSize
      canvas.height = cropSize

      // Cria clipping circular
      ctx.beginPath()
      ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2)
      ctx.clip()

      // Calcula posição da imagem no crop
      const containerRect = containerRef.current.getBoundingClientRect()
      const centerX = containerRect.width / 2
      const centerY = containerRect.height / 2

      const sourceX = (centerX - cropSize / 2 - imageTransform.x) / imageTransform.scale
      const sourceY = (centerY - cropSize / 2 - imageTransform.y) / imageTransform.scale
      const sourceSize = cropSize / imageTransform.scale

      // Desenha a imagem cropada
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceSize, sourceSize,
        0, 0, cropSize, cropSize
      )

      // Converte para blob JPEG com qualidade 90%
      canvas.toBlob(resolve, 'image/jpeg', 0.9)
    })
  }

  const handleConfirm = async () => {
    setProcessing(true)
    try {
      const croppedBlob = await getCroppedImage()
      if (croppedBlob && onCropComplete) {
        onCropComplete(croppedBlob)
      }
      onClose()
    } catch (error) {
      console.error('Erro ao processar imagem:', error)
    } finally {
      setProcessing(false)
    }
  }

  if (!isOpen || !selectedFile) return null

  const imageUrl = URL.createObjectURL(selectedFile)
  const minScale = imageRef.current ?
    Math.max(cropSize / imageRef.current.naturalWidth, cropSize / imageRef.current.naturalHeight, 1) : 1
  const maxScale = 3

  return (
    <div className="crop-modal-overlay">
      <div className="crop-modal">
        <div className="crop-modal-header">
          <h3>Ajustar Foto de Perfil</h3>
          <button className="crop-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="crop-modal-body">
          <div className="crop-container" ref={containerRef}>
            <div className="crop-overlay">
              <div className="crop-circle"></div>
            </div>

            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop preview"
              className="crop-image"
              style={{
                transform: `translate(${imageTransform.x}px, ${imageTransform.y}px) scale(${imageTransform.scale})`,
                cursor: isDragging ? 'grabbing' : 'grab'
              }}
              onLoad={handleImageLoad}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              draggable={false}
            />
          </div>

          {imageLoaded && (
            <div className="crop-controls">
              <div className="zoom-control">
                <label>Zoom:</label>
                <input
                  type="range"
                  min={minScale}
                  max={maxScale}
                  step={0.1}
                  value={imageTransform.scale}
                  onChange={handleZoomChange}
                />
              </div>
              <p className="crop-instructions">
                Arraste a imagem para posicionar e use o zoom para ajustar
              </p>
            </div>
          )}
        </div>

        <div className="crop-modal-footer">
          <button className="crop-btn cancel-btn" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="crop-btn confirm-btn"
            onClick={handleConfirm}
            disabled={!imageLoaded || processing}
          >
            {processing ? 'Processando...' : (
              <>
                <FaCheck />
                Confirmar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}