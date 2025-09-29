import { useState, useEffect, useRef } from 'react'
import { FaSearch, FaChevronDown } from 'react-icons/fa'
import './SearchableSelect.css'

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Selecione",
  searchable = true,
  label,
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  // Fechar dropdown ao clicar fora e reposicionar em scroll/resize
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleScroll = () => {
      if (isOpen) {
        updateDropdownPosition()
      }
    }

    const handleResize = () => {
      if (isOpen) {
        updateDropdownPosition()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleResize)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen])

  // Filtrar opções baseado na busca
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pegar label da opção selecionada
  const selectedOption = options.find(opt => opt.value === value)

  // Calcular posição do dropdown
  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }

  const handleSelect = (selectedValue) => {
    onChange(selectedValue)
    setIsOpen(false)
    setSearchTerm('')
  }

  const toggleDropdown = () => {
    if (!isOpen) {
      updateDropdownPosition()
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="searchable-select" ref={dropdownRef}>
      {label && (
        <label>
          {label} {required && '*'}
        </label>
      )}

      {/* Campo principal */}
      <div
        ref={inputRef}
        className={`select-input ${isOpen ? 'open' : ''}`}
        onClick={toggleDropdown}
      >
        <span className={`select-value ${!value ? 'placeholder' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <FaChevronDown className={`select-arrow ${isOpen ? 'open' : ''}`} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="select-dropdown"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width
          }}
        >
          {searchable && (
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          )}

          <div className="options-list">
            {/* Opção vazia */}
            <div
              className={`option ${!value ? 'selected' : ''}`}
              onClick={() => handleSelect('')}
            >
              {placeholder}
            </div>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`option ${value === option.value ? 'selected' : ''}`}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="no-results">Nenhum resultado encontrado</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}