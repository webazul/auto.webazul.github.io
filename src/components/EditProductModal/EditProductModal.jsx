import { useState, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../../firebase/config'
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaCamera,
  FaImages
} from 'react-icons/fa'
import CurrencyInput from 'react-currency-input-field'
import SearchableSelect from '../SearchableSelect'
import InlineCrop from '../InlineCrop'
import './EditProductModal.css'

export default function EditProductModal({
  isOpen,
  onClose,
  product,
  currentStore,
  formatCurrency,
  onProductUpdated,
  initialStep = 1 // Permite iniciar em qualquer step
}) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    mileage: '',
    price: '',
    originalPrice: '',
    fuel: '',
    color: '',
    transmission: 'Manual',
    doors: '',
    description: '',
    dataMatricula: '',
    stockNumber: '',
    iucMensal: '',
    iucAnual: '',
    profilePhoto: null,
    gallery: []
  })

  const [showSpecificFields, setShowSpecificFields] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [brands, setBrands] = useState([])
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [isCroppingPhoto, setIsCroppingPhoto] = useState(false)

  // Carregar brands
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const response = await fetch('/brands.json')
        if (response.ok) {
          const data = await response.json()
          setBrands(data.brands || [])
        }
      } catch (error) {
        console.error('Erro ao carregar brands:', error)
      }
    }
    loadBrands()
  }, [])

  // Popular form com dados do produto
  useEffect(() => {
    if (product) {
      // Preparar gallery com estrutura local
      const galleryPhotos = product.gallery && product.gallery.length > 0
        ? product.gallery.map((url, index) => ({
            preview: url,
            url: url,
            id: `existing_${index}`,
            isExisting: true
          }))
        : []

      setFormData({
        name: product.name || '',
        brand: product.brand || '',
        model: product.model || '',
        year: product.year || new Date().getFullYear(),
        mileage: product.mileage || '',
        price: product.price || '',
        originalPrice: product.originalPrice || '',
        fuel: product.fuel || '',
        color: product.color || '',
        transmission: product.transmission || 'Manual',
        doors: product.doors || '',
        description: product.description || '',
        dataMatricula: product.dataMatricula || '',
        stockNumber: product.stockNumber || '',
        iucMensal: product.iucMensal || '',
        iucAnual: product.iucAnual || '',
        profilePhoto: product.profilePhoto ? {
          preview: product.profilePhoto,
          url: product.profilePhoto,
          isExisting: true
        } : null,
        gallery: galleryPhotos
      })
    }
  }, [product])

  const marcasOptions = brands.map(brand => ({
    value: brand.nome,
    label: brand.nome
  }))

  const combustivelOptions = [
    { value: 'Gasolina', label: 'Gasolina' },
    { value: 'Diesel', label: 'Diesel' },
    { value: 'Híbrido', label: 'Híbrido' },
    { value: 'Elétrico', label: 'Elétrico' },
    { value: 'GPL', label: 'GPL' },
    { value: 'Etanol', label: 'Etanol' },
    { value: 'Flex', label: 'Flex (Etanol/Gasolina)' }
  ]

  const getCurrencyInputConfig = () => {
    const currency = currentStore?.currency || 'EUR'
    const country = currentStore?.country || 'PT'

    const localeMap = {
      'PT': 'pt-PT',
      'ES': 'es-ES',
      'FR': 'fr-FR',
      'IT': 'it-IT',
      'DE': 'de-DE',
      'GB': 'en-GB',
      'US': 'en-US',
      'BR': 'pt-BR'
    }

    return {
      locale: localeMap[country] || 'pt-PT',
      currency: currency
    }
  }

  const getCurrencySymbol = () => {
    const currency = currentStore?.currency || 'EUR'
    const symbols = {
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'BRL': 'R$'
    }
    return symbols[currency] || '€'
  }

  const parseFormattedNumber = (value) => {
    if (!value) return 0
    return parseFloat(value.toString()) || 0
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCurrencyChange = (value, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || ''
    }))
  }

  const validateStep1 = () => {
    return Boolean(formData.name && formData.brand && formData.model && formData.year)
  }

  const handleNextStep = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setCurrentStep(prev => Math.min(prev + 1, 4))
  }

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleStepClick = (stepNumber) => {
    if (stepNumber <= currentStep || currentStep === 4) {
      setCurrentStep(stepNumber)
    }
  }

  const handleClose = () => {
    setCurrentStep(initialStep)
    setShowSpecificFields(false)
    setIsCroppingPhoto(false)
    setSelectedImageFile(null)
    onClose()
  }

  // Reset currentStep quando initialStep mudar
  useEffect(() => {
    setCurrentStep(initialStep)
  }, [initialStep])

  // Photo handlers
  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      const maxSize = 10 * 1024 * 1024 // 10MB

      if (!allowedTypes.includes(file.type)) {
        alert('❌ Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.')
        return
      }

      if (file.size > maxSize) {
        alert('❌ Arquivo muito grande. Máximo 10MB.')
        return
      }

      setSelectedImageFile(file)
      setIsCroppingPhoto(true)
    }
  }

  const handleCropComplete = (croppedBlob) => {
    const previewUrl = URL.createObjectURL(croppedBlob)

    setFormData(prev => ({
      ...prev,
      profilePhoto: {
        file: croppedBlob,
        preview: previewUrl,
        name: `cropped_${Date.now()}.jpg`,
        isNew: true
      }
    }))

    setIsCroppingPhoto(false)
    setSelectedImageFile(null)
  }

  const handleCropCancel = () => {
    setIsCroppingPhoto(false)
    setSelectedImageFile(null)
  }

  const handleGalleryPhotosChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      Promise.all(
        files.map(file => {
          return new Promise(resolve => {
            const reader = new FileReader()
            reader.onload = (e) => {
              resolve({
                file: file,
                preview: e.target.result,
                name: file.name,
                id: Date.now() + Math.random(),
                isNew: true
              })
            }
            reader.readAsDataURL(file)
          })
        })
      ).then(newPhotos => {
        setFormData(prev => ({
          ...prev,
          gallery: [...prev.gallery, ...newPhotos]
        }))
      })
    }
  }

  const removeGalleryPhoto = (photoId) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter(photo => photo.id !== photoId)
    }))
  }

  const removeProfilePhoto = () => {
    setFormData(prev => ({
      ...prev,
      profilePhoto: null
    }))
  }

  // Upload functions
  const uploadImage = async (file, path) => {
    if (!file) return null

    try {
      const imageRef = ref(storage, path)
      const snapshot = await uploadBytes(imageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      return downloadURL
    } catch (error) {
      console.error('❌ Erro no upload:', error)
      throw error
    }
  }

  const uploadImages = async (files, basePath) => {
    const uploadPromises = files.map((file) => {
      const imageId = crypto.randomUUID()
      const path = `${basePath}/gallery_${imageId}`
      return uploadImage(file.file, path)
    })

    return Promise.all(uploadPromises)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!product?.id || !currentStore?.id) return

    setIsSubmitting(true)

    try {
      const basePath = `products/${currentStore.id}/${product.id}`
      const productRef = doc(db, 'products', product.id)

      // Upload da foto de perfil se for nova
      let profilePhotoURL = product.profilePhoto
      if (formData.profilePhoto && formData.profilePhoto.isNew && formData.profilePhoto.file) {
        const profileImageId = crypto.randomUUID()
        profilePhotoURL = await uploadImage(formData.profilePhoto.file, `${basePath}/profile_${profileImageId}`)
      } else if (!formData.profilePhoto) {
        profilePhotoURL = null
      }

      // Upload das novas fotos da galeria
      const newGalleryPhotos = formData.gallery.filter(photo => photo.isNew && photo.file)
      const existingGalleryPhotos = formData.gallery.filter(photo => photo.isExisting).map(photo => photo.url)

      let newGalleryURLs = []
      if (newGalleryPhotos.length > 0) {
        newGalleryURLs = await uploadImages(newGalleryPhotos, basePath)
      }

      const allGalleryURLs = [...existingGalleryPhotos, ...newGalleryURLs]

      const updateData = {
        name: formData.name,
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year) || new Date().getFullYear(),
        mileage: parseInt(formData.mileage) || 0,
        price: parseFormattedNumber(formData.price)
      }

      // Campos opcionais
      if (formData.originalPrice) {
        updateData.originalPrice = parseFormattedNumber(formData.originalPrice)
        updateData.isPromotional = true
      } else {
        updateData.isPromotional = false
      }

      if (formData.fuel) updateData.fuel = formData.fuel
      if (formData.color) updateData.color = formData.color
      if (formData.transmission) updateData.transmission = formData.transmission
      if (formData.doors) updateData.doors = formData.doors
      if (formData.description) updateData.description = formData.description

      // Campos específicos Portugal
      if (formData.dataMatricula) updateData.dataMatricula = formData.dataMatricula
      if (formData.stockNumber) updateData.stockNumber = formData.stockNumber
      if (formData.iucMensal) updateData.iucMensal = parseFormattedNumber(formData.iucMensal)
      if (formData.iucAnual) updateData.iucAnual = parseFormattedNumber(formData.iucAnual)

      // Fotos
      if (profilePhotoURL) updateData.profilePhoto = profilePhotoURL
      if (allGalleryURLs && allGalleryURLs.length > 0) updateData.gallery = allGalleryURLs

      await updateDoc(productRef, updateData)

      // Notificar Dashboard
      if (onProductUpdated) {
        onProductUpdated({ ...product, ...updateData })
      }

      handleClose()
      alert('Produto atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar produto:', error)
      alert('Erro ao atualizar produto. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const currencyConfig = getCurrencyInputConfig()

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100000,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="modal-content modal-wizard"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        <div className="modal-header">
          <h3>Editar Informações do Produto</h3>
          <button
            className="modal-close-btn"
            onClick={handleClose}
          >
            <FaTimes />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="wizard-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''} ${1 <= currentStep ? 'clickable' : ''}`}
               onClick={() => handleStepClick(1)}>
            <div className="step-number">1</div>
            <div className="step-label">Informações Básicas</div>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''} ${2 <= currentStep ? 'clickable' : ''}`}
               onClick={() => handleStepClick(2)}>
            <div className="step-number">2</div>
            <div className="step-label">Características</div>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''} ${3 <= currentStep ? 'clickable' : ''}`}
               onClick={() => handleStepClick(3)}>
            <div className="step-number">3</div>
            <div className="step-label">Fotos</div>
          </div>
          <div className={`step ${currentStep >= 4 ? 'active' : ''} ${4 <= currentStep ? 'clickable' : ''}`}
               onClick={() => handleStepClick(4)}>
            <div className="step-number">4</div>
            <div className="step-label">Revisão</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Step 1: Informações Básicas */}
            {currentStep === 1 && (
              <div className="wizard-step-content">
                <div className="form-group">
                  <label htmlFor="name">Nome do Anúncio *</label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={e => handleFormChange('name', e.target.value)}
                    placeholder="Ex: BMW X5 2024 Sport"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="brand">Marca *</label>
                    <SearchableSelect
                      options={marcasOptions}
                      value={formData.brand}
                      onChange={(value) => handleFormChange('brand', value)}
                      placeholder="Selecione a marca"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="model">Modelo *</label>
                    <input
                      id="model"
                      type="text"
                      value={formData.model}
                      onChange={e => handleFormChange('model', e.target.value)}
                      placeholder="Ex: X5"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="year">Ano *</label>
                    <input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={e => handleFormChange('year', e.target.value)}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="mileage">Quilometragem (km)</label>
                    <input
                      id="mileage"
                      type="number"
                      value={formData.mileage}
                      onChange={e => handleFormChange('mileage', e.target.value)}
                      placeholder="Ex: 50000"
                      min="0"
                    />
                  </div>
                </div>

                {/* Seção de Preço */}
                <div className="price-section">
                  <div className="price-header">
                    <label>Preço do Veículo</label>
                    <div className="promotional-checkbox">
                      <input
                        type="checkbox"
                        id="isPromotional"
                        checked={Boolean(formData.originalPrice)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleFormChange('originalPrice', formData.price || '0')
                          } else {
                            handleFormChange('originalPrice', '')
                          }
                        }}
                      />
                      <label htmlFor="isPromotional" className="promo-label">
                        <span>Preço promocional</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-row">
                    {formData.originalPrice && (
                      <div className="form-col">
                        <label className="price-label original">
                          Preço Original
                        </label>
                        <CurrencyInput
                          value={formData.originalPrice}
                          onValueChange={(value) => handleCurrencyChange(value, 'originalPrice')}
                          prefix={`${getCurrencySymbol()} `}
                          decimalsLimit={2}
                          decimalSeparator={currencyConfig.locale.includes('pt') ? ',' : '.'}
                          groupSeparator={currencyConfig.locale.includes('pt') ? '.' : ','}
                          placeholder={`${getCurrencySymbol()} 0,00`}
                        />
                      </div>
                    )}

                    <div className={`form-col ${!formData.originalPrice ? 'full-width' : ''}`}>
                      <label className={`price-label ${formData.originalPrice ? 'promotional' : ''}`}>
                        {formData.originalPrice ? 'Preço Promocional' : 'Preço'}
                      </label>
                      <CurrencyInput
                        value={formData.price}
                        onValueChange={(value) => handleCurrencyChange(value, 'price')}
                        prefix={`${getCurrencySymbol()} `}
                        decimalsLimit={2}
                        decimalSeparator={currencyConfig.locale.includes('pt') ? ',' : '.'}
                        groupSeparator={currencyConfig.locale.includes('pt') ? '.' : ','}
                        placeholder={`${getCurrencySymbol()} 0,00`}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Características */}
            {currentStep === 2 && (
              <div className="wizard-step-content">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fuel">Combustível</label>
                    <SearchableSelect
                      options={combustivelOptions}
                      value={formData.fuel}
                      onChange={(value) => handleFormChange('fuel', value)}
                      placeholder="Selecione o tipo"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="color">Cor</label>
                    <input
                      id="color"
                      type="text"
                      value={formData.color}
                      onChange={e => handleFormChange('color', e.target.value)}
                      placeholder="Ex: Preto"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="transmission">Transmissão</label>
                    <select
                      id="transmission"
                      value={formData.transmission}
                      onChange={e => handleFormChange('transmission', e.target.value)}
                    >
                      <option value="Manual">Manual</option>
                      <option value="Automática">Automática</option>
                      <option value="Semi-automática">Semi-automática</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="doors">Portas</label>
                    <input
                      id="doors"
                      type="number"
                      value={formData.doors}
                      onChange={e => handleFormChange('doors', e.target.value)}
                      placeholder="Ex: 4"
                      min="2"
                      max="5"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Descrição</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={e => handleFormChange('description', e.target.value)}
                    placeholder="Descreva o veículo..."
                    rows="4"
                  />
                </div>

                {/* Campos específicos Portugal */}
                <div className="form-group">
                  <button
                    type="button"
                    className="toggle-fields-btn"
                    onClick={() => setShowSpecificFields(!showSpecificFields)}
                  >
                    {showSpecificFields ? '▼' : '▶'} Campos específicos (Portugal)
                  </button>
                </div>

                {showSpecificFields && (
                  <div className="specific-fields">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="dataMatricula">Data de Matrícula</label>
                        <input
                          id="dataMatricula"
                          type="date"
                          value={formData.dataMatricula}
                          onChange={e => handleFormChange('dataMatricula', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="stockNumber">Nº de Stock</label>
                        <input
                          id="stockNumber"
                          type="text"
                          value={formData.stockNumber}
                          onChange={e => handleFormChange('stockNumber', e.target.value)}
                          placeholder="Ex: ST-2024-001"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="iucMensal">IUC Mensal</label>
                        <CurrencyInput
                          id="iucMensal"
                          value={formData.iucMensal}
                          onValueChange={(value) => handleCurrencyChange(value, 'iucMensal')}
                          prefix={`${getCurrencySymbol()} `}
                          decimalsLimit={2}
                          decimalSeparator=","
                          groupSeparator="."
                          placeholder={`${getCurrencySymbol()} 0,00`}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="iucAnual">IUC Anual</label>
                        <CurrencyInput
                          id="iucAnual"
                          value={formData.iucAnual}
                          onValueChange={(value) => handleCurrencyChange(value, 'iucAnual')}
                          prefix={`${getCurrencySymbol()} `}
                          decimalsLimit={2}
                          decimalSeparator=","
                          groupSeparator="."
                          placeholder={`${getCurrencySymbol()} 0,00`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Fotos */}
            {currentStep === 3 && (
              <div className="wizard-step-content">
                {/* Foto de Perfil */}
                <div className="photo-upload-section">
                  <label className="section-label">
                    <FaCamera /> Foto de Perfil (Principal)
                  </label>

                  {isCroppingPhoto && selectedImageFile ? (
                    <InlineCrop
                      selectedFile={selectedImageFile}
                      onCropComplete={handleCropComplete}
                      onCancel={handleCropCancel}
                    />
                  ) : (
                    <>
                      {formData.profilePhoto ? (
                        <div className="photo-preview-container">
                          <img
                            src={formData.profilePhoto.preview}
                            alt="Profile preview"
                            className="profile-photo-preview"
                          />
                          <button
                            type="button"
                            className="remove-photo-btn"
                            onClick={removeProfilePhoto}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <div className="profile-photo-upload">
                          <input
                            type="file"
                            id="profilePhoto"
                            accept="image/*"
                            onChange={handleProfilePhotoChange}
                            style={{ display: 'none' }}
                          />
                          <label htmlFor="profilePhoto" className="upload-label profile-upload-label">
                            <FaCamera size={32} />
                            <span>Adicionar foto</span>
                          </label>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Galeria */}
                <div className="photo-upload-section">
                  <label className="section-label">
                    <FaImages /> Galeria de Fotos
                  </label>

                  <div className="gallery-grid">
                    {formData.gallery.map(photo => (
                      <div key={photo.id} className="gallery-item">
                        <img src={photo.preview} alt={photo.name || 'Galeria'} />
                        <button
                          type="button"
                          className="remove-gallery-btn"
                          onClick={() => removeGalleryPhoto(photo.id)}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}

                    {/* Botão de adicionar como item da grade */}
                    <div className="gallery-item gallery-add-item">
                      <input
                        type="file"
                        id="gallery"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryPhotosChange}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="gallery" className="gallery-upload-label">
                        <FaImages size={24} />
                        <span>Adicionar fotos</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Revisão */}
            {currentStep === 4 && (
              <div className="wizard-step-content">
                <div className="review-section">
                  <div className="review-item">
                    <strong>Nome:</strong> {formData.name}
                  </div>
                  <div className="review-item">
                    <strong>Marca/Modelo:</strong> {formData.brand} {formData.model}
                  </div>
                  <div className="review-item">
                    <strong>Ano:</strong> {formData.year}
                  </div>
                  <div className="review-item">
                    <strong>Preço:</strong> {formatCurrency(parseFormattedNumber(formData.price))}
                  </div>
                  {formData.originalPrice && (
                    <div className="review-item">
                      <strong>Preço Original:</strong> {formatCurrency(parseFormattedNumber(formData.originalPrice))}
                    </div>
                  )}
                  <div className="review-item">
                    <strong>Quilometragem:</strong> {formData.mileage} km
                  </div>
                  {formData.fuel && (
                    <div className="review-item">
                      <strong>Combustível:</strong> {formData.fuel}
                    </div>
                  )}
                  {formData.color && (
                    <div className="review-item">
                      <strong>Cor:</strong> {formData.color}
                    </div>
                  )}
                  {formData.transmission && (
                    <div className="review-item">
                      <strong>Transmissão:</strong> {formData.transmission}
                    </div>
                  )}
                  {formData.doors && (
                    <div className="review-item">
                      <strong>Portas:</strong> {formData.doors}
                    </div>
                  )}
                  {formData.description && (
                    <div className="review-item">
                      <strong>Descrição:</strong> {formData.description}
                    </div>
                  )}
                  {formData.profilePhoto && (
                    <div className="review-item">
                      <strong>Foto de Perfil:</strong> ✓ {formData.profilePhoto.isNew ? 'Nova foto adicionada' : 'Mantida'}
                    </div>
                  )}
                  {formData.gallery.length > 0 && (
                    <div className="review-item">
                      <strong>Galeria:</strong> {formData.gallery.length} foto(s)
                      {formData.gallery.filter(p => p.isNew).length > 0 && (
                        <span> ({formData.gallery.filter(p => p.isNew).length} nova(s))</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            {currentStep > 1 && (
              <button
                type="button"
                className="wizard-btn prev-btn"
                onClick={handlePrevStep}
                disabled={isSubmitting}
              >
                <FaChevronLeft /> Anterior
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                className="wizard-btn next-btn"
                onClick={handleNextStep}
                disabled={currentStep === 1 && !validateStep1()}
              >
                Próximo <FaChevronRight />
              </button>
            ) : (
              <button
                type="submit"
                className="wizard-btn submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner"></div>
                    <span>Salvando...</span>
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
