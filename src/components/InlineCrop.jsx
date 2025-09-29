import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { FaCheck, FaTimes } from 'react-icons/fa'
import './InlineCrop.css'

export default function InlineCrop({
  selectedFile,
  onCropComplete,
  onCancel
}) {
  const [imageTransform, setImageTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [minScale, setMinScale] = useState(1)
  const [maxScale] = useState(3)
  const [imageUrl, setImageUrl] = useState(null)

  const imageRef = useRef(null)
  const containerRef = useRef(null)
  const isProcessingRef = useRef(false)

  // Proporção 16:9 para imagens de carros
  const cropWidth = 320
  const cropHeight = 180
  const aspectRatio = 16 / 9

  // Criar URL quando receber novo arquivo
  useEffect(() => {
    if (selectedFile && !isProcessingRef.current) {
      isProcessingRef.current = true

      console.log('🔄 Processando novo arquivo:', selectedFile.name)

      // Criar nova URL
      const newUrl = URL.createObjectURL(selectedFile)
      console.log('✅ Nova URL criada:', newUrl)

      // Limpar URL anterior e definir nova
      setImageUrl(prevUrl => {
        if (prevUrl) {
          console.log('🗑️ Limpando URL anterior:', prevUrl)
          URL.revokeObjectURL(prevUrl)
        }
        return newUrl
      })

      // Reset estados
      setImageTransform({ x: 0, y: 0, scale: 1 })
      setImageLoaded(false)
      setProcessing(false)
      setMinScale(1)

      // Permitir próximo processamento após um pequeno delay
      setTimeout(() => {
        isProcessingRef.current = false
      }, 100)
    }
  }, [selectedFile])

  const handleImageLoad = useCallback(() => {
    // Evitar loop infinito - só executar se ainda não carregou
    if (imageLoaded) return

    console.log('📸 Imagem carregada')
    setImageLoaded(true)

    // Calcular scale inicial correto
    if (imageRef.current && imageRef.current.naturalWidth > 0) {
      const img = imageRef.current

      // Para cobrir o retângulo 16:9: usar o maior valor entre width e height
      const scaleToFitWidth = cropWidth / img.naturalWidth
      const scaleToFitHeight = cropHeight / img.naturalHeight

      // O minScale deve cobrir pelo menos uma dimensão do retângulo
      const calculatedMinScale = Math.max(scaleToFitWidth, scaleToFitHeight)

      // Scale inicial inteligente baseado na proporção da imagem
      const aspectRatio = img.naturalWidth / img.naturalHeight
      let initialScale

      if (aspectRatio > 1.5) {
        // Landscape muito ampla (ex: 1866x826) - zoom inicial menor
        initialScale = calculatedMinScale * 1.2
      } else if (aspectRatio > 1) {
        // Landscape moderada - zoom inicial médio
        initialScale = calculatedMinScale * 1.4
      } else if (aspectRatio > 0.7) {
        // Quase quadrada - zoom inicial balanceado
        initialScale = calculatedMinScale * 1.5
      } else {
        // Portrait (fotos de celular) - zoom inicial bem menor
        initialScale = calculatedMinScale * 1.1
      }

      console.log('📐 Calculando scales:', {
        cropWidth,
        cropHeight,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        aspectRatio: aspectRatio.toFixed(2),
        scaleToFitWidth: scaleToFitWidth.toFixed(3),
        scaleToFitHeight: scaleToFitHeight.toFixed(3),
        calculatedMinScale: calculatedMinScale.toFixed(3),
        initialScale: initialScale.toFixed(3),
        tipo: aspectRatio > 1.5 ? 'landscape-ampla' :
              aspectRatio > 1 ? 'landscape-moderada' :
              aspectRatio > 0.7 ? 'quase-quadrada' : 'portrait'
      })

      setMinScale(calculatedMinScale)
      setImageTransform(prev => ({ ...prev, scale: initialScale }))
    }
  }, [imageLoaded, cropWidth, cropHeight])

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
    console.log('🔍 Zoom alterado para:', newScale)
    setImageTransform(prev => ({ ...prev, scale: newScale }))
  }

  const getCroppedImage = () => {
    return new Promise((resolve) => {
      if (!imageRef.current || !containerRef.current) {
        console.log('❌ Referências não disponíveis')
        return resolve(null)
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = imageRef.current

      console.log('🖼️ Iniciando crop:', {
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        transform: imageTransform
      })

      // Define tamanho do canvas = tamanho do crop final 16:9
      const finalCropWidth = 640  // Dobro do tamanho de preview para boa qualidade
      const finalCropHeight = 360
      canvas.width = finalCropWidth
      canvas.height = finalCropHeight

      // Limpa o canvas com fundo branco
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, finalCropWidth, finalCropHeight)

      // Calcula a escala e posição da imagem no canvas
      const scaleX = finalCropWidth / cropWidth
      const scaleY = finalCropHeight / cropHeight
      const offsetX = (finalCropWidth / 2) + (imageTransform.x * scaleX)
      const offsetY = (finalCropHeight / 2) + (imageTransform.y * scaleY)
      const scaledWidth = img.naturalWidth * imageTransform.scale * scaleX
      const scaledHeight = img.naturalHeight * imageTransform.scale * scaleY

      // Desenha a imagem cropada (16:9)
      ctx.drawImage(
        img,
        offsetX - (scaledWidth / 2),
        offsetY - (scaledHeight / 2),
        scaledWidth,
        scaledHeight
      )

      console.log('✅ Canvas criado com sucesso')

      // Converte para blob JPEG com qualidade 90%
      canvas.toBlob((blob) => {
        console.log('📤 Blob criado:', blob?.size, 'bytes')
        resolve(blob)
      }, 'image/jpeg', 0.9)
    })
  }

  const handleConfirm = async () => {
    if (!imageRef.current || imageRef.current.naturalWidth === 0) {
      console.log('❌ Imagem ainda não carregou completamente')
      return
    }

    setProcessing(true)
    try {
      const croppedBlob = await getCroppedImage()
      if (croppedBlob && onCropComplete) {
        onCropComplete(croppedBlob)
      }
    } catch (error) {
      console.error('Erro ao processar imagem:', error)
    } finally {
      setProcessing(false)
    }
  }

  // Cleanup final quando componente desmonta
  useEffect(() => {
    return () => {
      if (imageUrl) {
        console.log('🗑️ Cleanup final da URL:', imageUrl)
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrl])

  if (!selectedFile || !imageUrl) return null

  return (
    <div className="inline-crop">
      <div className="inline-crop-header">
        <h5>Ajustar Foto de Perfil</h5>
        <p>Arraste a imagem e use o zoom para posicionar</p>
      </div>

      <div className="inline-crop-container" ref={containerRef}>
        <div className="inline-crop-overlay">
          <div
            className="inline-crop-area"
            style={{
              width: `${cropWidth}px`,
              height: `${cropHeight}px`
            }}
          ></div>
        </div>

        <img
          ref={imageRef}
          src={imageUrl}
          alt="Crop preview"
          className="inline-crop-image"
          style={{
            transform: `translate(-50%, -50%) translate(${imageTransform.x}px, ${imageTransform.y}px) scale(${imageTransform.scale})`,
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

      {imageLoaded && minScale > 0 && (
        <div className="inline-crop-controls">
          <div className="zoom-control">
            <label>Zoom:</label>
            <input
              type="range"
              min={minScale.toFixed(1)}
              max={maxScale}
              step={0.1}
              value={imageTransform.scale.toFixed(1)}
              onChange={handleZoomChange}
            />
          </div>
        </div>
      )}

      <div className="inline-crop-actions">
        <button
          className="crop-action-btn cancel-btn"
          onClick={onCancel}
          disabled={processing}
        >
          <FaTimes />
          Cancelar
        </button>
        <button
          className="crop-action-btn confirm-btn"
          onClick={handleConfirm}
          disabled={!imageLoaded || processing || !imageRef.current || imageRef.current.naturalWidth === 0}
        >
          {processing ? (
            'Processando...'
          ) : (
            <>
              <FaCheck />
              Confirmar
            </>
          )}
        </button>
      </div>
    </div>
  )
}