/**
 * Utilitários para formatação de moeda
 */

export const getCurrencySymbol = (currency = 'EUR') => {
  const symbols = {
    'EUR': '€',
    'USD': '$',
    'GBP': '£',
    'BRL': 'R$'
  }
  return symbols[currency] || '€'
}

export const formatCurrency = (value, currency = 'EUR', country = 'PT') => {
  if (!value && value !== 0) return '-'

  // Mapear país para locale
  const localeMap = {
    'PT': 'pt-PT',
    'BR': 'pt-BR',
    'US': 'en-US',
    'UK': 'en-GB',
    'ES': 'es-ES',
    'FR': 'fr-FR'
  }

  const locale = localeMap[country] || 'pt-PT'

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  } catch (error) {
    // Fallback se Intl.NumberFormat falhar
    const symbols = {
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'BRL': 'R$'
    }
    return `${symbols[currency] || '€'}${Number(value).toLocaleString()}`
  }
}