import { useState, useRef, useEffect } from 'react'
import { collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
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
import './CreateProductModal.css'

export default function CreateProductModal({
  isOpen,
  onClose,
  onProductCreated,
  currentStore,
  formatCurrency
}) {
  const modalRef = useRef(null)

  // Estados do formulário
  const [currentStep, setCurrentStep] = useState(1)
  const [carForm, setCarForm] = useState({
    name: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    originalPrice: '',
    isPromotional: false,
    color: '',
    fuel: '',
    mileage: '',
    description: '',
    doors: '',
    transmission: 'Manual',
    condition: 'Used',
    active: true,
    profilePhoto: null,
    gallery: [],
    // Campos específicos Portugal
    stockNumber: '',
    registrationDate: '',
    monthlyTax: '',
    annualTax: '',
    stamp: '',
    moderatorFee: ''
  })

  const [showSpecificFields, setShowSpecificFields] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [isCroppingPhoto, setIsCroppingPhoto] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('')
  const [brands, setBrands] = useState([])

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

  // Opções
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

  // Helper functions
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

  const resetCarForm = () => {
    setCarForm({
      name: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      price: '',
      originalPrice: '',
      isPromotional: false,
      color: '',
      fuel: '',
      mileage: '',
      description: '',
      doors: '',
      transmission: 'Manual',
      condition: 'Used',
      active: true,
      profilePhoto: null,
      gallery: [],
      stockNumber: '',
      registrationDate: '',
      monthlyTax: '',
      annualTax: '',
      stamp: '',
      moderatorFee: ''
    })
    setCurrentStep(1)
    setShowSpecificFields(false)
    setIsCroppingPhoto(false)
    setSelectedImageFile(null)
  }

  // Form handlers
  const handleCarFormChange = (field, value) => {
    setCarForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCurrencyChange = (value, field) => {
    setCarForm(prev => ({
      ...prev,
      [field]: value || ''
    }))
  }

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

    setCarForm(prev => ({
      ...prev,
      profilePhoto: {
        file: croppedBlob,
        preview: previewUrl,
        name: `cropped_${Date.now()}.jpg`
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
                id: Date.now() + Math.random()
              })
            }
            reader.readAsDataURL(file)
          })
        })
      ).then(newPhotos => {
        setCarForm(prev => ({
          ...prev,
          gallery: [...prev.gallery, ...newPhotos]
        }))
      })
    }
  }

  const removeGalleryPhoto = (photoId) => {
    setCarForm(prev => ({
      ...prev,
      gallery: prev.gallery.filter(photo => photo.id !== photoId)
    }))
  }

  const removeProfilePhoto = () => {
    setCarForm(prev => ({
      ...prev,
      profilePhoto: null
    }))
  }

  // Navigation
  const validateStep1 = () => {
    return Boolean(carForm.name && carForm.brand && carForm.model && carForm.year)
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
    if (stepNumber <= currentStep) {
      setCurrentStep(stepNumber)
    }
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

  // Submit
  const handleAddCar = async (e) => {
    e.preventDefault()
    if (!currentStore?.id) return

    setIsSubmitting(true)
    setSubmitStatus('Criando produto...')

    try {
      // Criar o documento primeiro para ter um ID
      const docRef = await addDoc(collection(db, 'products'), {
        name: carForm.name,
        brand: carForm.brand,
        model: carForm.model,
        year: parseInt(carForm.year) || new Date().getFullYear(),
        storeId: currentStore.id,
        createdAt: serverTimestamp(),
        status: 'creating'
      })

      const carId = docRef.id
      const basePath = `products/${currentStore.id}/${carId}`

      // Upload da foto de perfil
      let profilePhotoURL = null
      if (carForm.profilePhoto && carForm.profilePhoto.file) {
        setSubmitStatus('Enviando foto de perfil...')
        const profileImageId = crypto.randomUUID()
        profilePhotoURL = await uploadImage(carForm.profilePhoto.file, `${basePath}/profile_${profileImageId}`)
      }

      // Upload das fotos da galeria
      let galleryURLs = []
      if (carForm.gallery && carForm.gallery.length > 0) {
        setSubmitStatus(`Enviando ${carForm.gallery.length} foto(s) da galeria...`)
        galleryURLs = await uploadImages(carForm.gallery, basePath)
      }

      // Preparar dados básicos
      const productData = {
        name: carForm.name || '',
        brand: carForm.brand || '',
        model: carForm.model || '',
        year: parseInt(carForm.year) || new Date().getFullYear(),
        price: parseFormattedNumber(carForm.price),
        mileage: parseInt(carForm.mileage) || 0,
        active: carForm.active !== undefined ? carForm.active : true,
        storeId: currentStore.id,
        createdAt: serverTimestamp(),
        status: 'active'
      }

      // Adicionar campos opcionais
      if (carForm.originalPrice) {
        productData.originalPrice = parseFormattedNumber(carForm.originalPrice)
        productData.isPromotional = true
      } else {
        productData.isPromotional = false
      }
      if (carForm.color) productData.color = carForm.color
      if (carForm.fuel) productData.fuel = carForm.fuel
      if (carForm.description) productData.description = carForm.description
      if (carForm.doors) productData.doors = carForm.doors
      if (carForm.transmission) productData.transmission = carForm.transmission
      if (carForm.condition) productData.condition = carForm.condition

      // URLs das imagens
      if (profilePhotoURL) productData.profilePhoto = profilePhotoURL
      if (galleryURLs && galleryURLs.length > 0) productData.gallery = galleryURLs

      // Campos específicos Portugal
      if (carForm.dataMatricula) productData.dataMatricula = carForm.dataMatricula
      if (carForm.iucMensal) productData.iucMensal = parseFormattedNumber(carForm.iucMensal)
      if (carForm.iucAnual) productData.iucAnual = parseFormattedNumber(carForm.iucAnual)
      if (carForm.selo) productData.selo = parseFormattedNumber(carForm.selo)
      if (carForm.taxaModeradora) productData.taxaModeradora = parseFormattedNumber(carForm.taxaModeradora)

      setSubmitStatus('Salvando dados...')
      await updateDoc(docRef, productData)

      setSubmitStatus('Finalizando...')

      // Reset e fechar
      resetCarForm()
      onClose()

      // Notificar Dashboard
      if (onProductCreated) {
        onProductCreated()
      }
    } catch (error) {
      console.error('Erro ao adicionar carro:', error)
      alert('Erro ao adicionar carro. Tente novamente.')
    } finally {
      setIsSubmitting(false)
      setSubmitStatus('')
    }
  }

  if (!isOpen) return null

  const currencyConfig = getCurrencyInputConfig()

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
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
        className="modal-content modal-wizard"
        ref={modalRef}
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
          <h3>Adicionar Novo Carro</h3>
          <button
            className="modal-close-btn"
            onClick={() => {
              onClose()
              resetCarForm()
            }}
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

        <form onSubmit={handleAddCar}>
          <div className="modal-body">
            {/* Step 1: Informações Básicas */}
            {currentStep === 1 && (
              <div className="wizard-step-content">
                <div className="form-group">
                  <label htmlFor="name">Nome do Anúncio *</label>
                  <input
                    id="name"
                    type="text"
                    value={carForm.name}
                    onChange={e => handleCarFormChange('name', e.target.value)}
                    placeholder="Ex: BMW X5 2024 Sport"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="brand">Marca *</label>
                    <SearchableSelect
                      options={marcasOptions}
                      value={carForm.brand}
                      onChange={(value) => handleCarFormChange('brand', value)}
                      placeholder="Selecione a marca"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="model">Modelo *</label>
                    <input
                      id="model"
                      type="text"
                      value={carForm.model}
                      onChange={e => handleCarFormChange('model', e.target.value)}
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
                      value={carForm.year}
                      onChange={e => handleCarFormChange('year', e.target.value)}
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
                      value={carForm.mileage}
                      onChange={e => handleCarFormChange('mileage', e.target.value)}
                      placeholder="Ex: 50000"
                      min="0"
                    />
                  </div>
                </div>

                {/* Seção de Preço - Movida do Step 2 */}
                <div className="price-section">
                  <div className="price-header">
                    <label>Preço do Veículo</label>
                    <div className="promotional-checkbox">
                      <input
                        type="checkbox"
                        id="isPromotional"
                        checked={Boolean(carForm.originalPrice)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Quando marca, define um valor inicial para aparecer o campo
                            handleCarFormChange('originalPrice', carForm.price || '0')
                          } else {
                            // Quando desmarca, limpa
                            handleCarFormChange('originalPrice', '')
                          }
                        }}
                      />
                      <label htmlFor="isPromotional" className="promo-label">
                        <span>Preço promocional</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-row">
                    {carForm.originalPrice && (
                      <div className="form-col">
                        <label className="price-label original">
                          Preço Original
                        </label>
                        <CurrencyInput
                          value={carForm.originalPrice}
                          onValueChange={(value) => handleCurrencyChange(value, 'originalPrice')}
                          prefix={`${getCurrencySymbol()} `}
                          decimalsLimit={2}
                          decimalSeparator={currencyConfig.locale.includes('pt') ? ',' : '.'}
                          groupSeparator={currencyConfig.locale.includes('pt') ? '.' : ','}
                          placeholder={`${getCurrencySymbol()} 0,00`}
                        />
                      </div>
                    )}

                    <div className={`form-col ${!carForm.originalPrice ? 'full-width' : ''}`}>
                      <label className={`price-label ${carForm.originalPrice ? 'promotional' : ''}`}>
                        {carForm.originalPrice ? 'Preço Promocional' : 'Preço'}
                      </label>
                      <CurrencyInput
                        value={carForm.price}
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
                      value={carForm.fuel}
                      onChange={(value) => handleCarFormChange('fuel', value)}
                      placeholder="Selecione o tipo"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="color">Cor</label>
                    <input
                      id="color"
                      type="text"
                      value={carForm.color}
                      onChange={e => handleCarFormChange('color', e.target.value)}
                      placeholder="Ex: Preto"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="transmission">Transmissão</label>
                    <select
                      id="transmission"
                      value={carForm.transmission}
                      onChange={e => handleCarFormChange('transmission', e.target.value)}
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
                      value={carForm.doors}
                      onChange={e => handleCarFormChange('doors', e.target.value)}
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
                    value={carForm.description}
                    onChange={e => handleCarFormChange('description', e.target.value)}
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
                          value={carForm.dataMatricula}
                          onChange={e => handleCarFormChange('dataMatricula', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="stockNumber">Nº de Stock</label>
                        <input
                          id="stockNumber"
                          type="text"
                          value={carForm.stockNumber}
                          onChange={e => handleCarFormChange('stockNumber', e.target.value)}
                          placeholder="Ex: ST-2024-001"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="iucMensal">IUC Mensal</label>
                        <CurrencyInput
                          id="iucMensal"
                          value={carForm.iucMensal}
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
                          value={carForm.iucAnual}
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
                      {carForm.profilePhoto ? (
                        <div className="photo-preview-container">
                          <img
                            src={carForm.profilePhoto.preview}
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
                    {carForm.gallery.map(photo => (
                      <div key={photo.id} className="gallery-item">
                        <img src={photo.preview} alt={photo.name} />
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
                    <strong>Nome:</strong> {carForm.name}
                  </div>
                  <div className="review-item">
                    <strong>Marca/Modelo:</strong> {carForm.brand} {carForm.model}
                  </div>
                  <div className="review-item">
                    <strong>Ano:</strong> {carForm.year}
                  </div>
                  <div className="review-item">
                    <strong>Preço:</strong> {formatCurrency(parseFormattedNumber(carForm.price))}
                  </div>
                  {carForm.originalPrice && (
                    <div className="review-item">
                      <strong>Preço Original:</strong> {formatCurrency(parseFormattedNumber(carForm.originalPrice))}
                    </div>
                  )}
                  <div className="review-item">
                    <strong>Quilometragem:</strong> {carForm.mileage} km
                  </div>
                  {carForm.fuel && (
                    <div className="review-item">
                      <strong>Combustível:</strong> {carForm.fuel}
                    </div>
                  )}
                  {carForm.color && (
                    <div className="review-item">
                      <strong>Cor:</strong> {carForm.color}
                    </div>
                  )}
                  {carForm.profilePhoto && (
                    <div className="review-item">
                      <strong>Foto de Perfil:</strong> ✓ Adicionada
                    </div>
                  )}
                  {carForm.gallery.length > 0 && (
                    <div className="review-item">
                      <strong>Galeria:</strong> {carForm.gallery.length} foto(s)
                    </div>
                  )}
                </div>

                {submitStatus && (
                  <div className="submit-status">
                    {submitStatus}
                  </div>
                )}
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
                    <span>Criando...</span>
                  </>
                ) : (
                  'Criar Produto'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
