import { baseCurrencyCode, getCurrency, type SupportedCurrencyCode } from '@/constants/currencies'

const displayCurrencyKey = 'finlo.display-currency'

export function getDisplayCurrencyPreference(): SupportedCurrencyCode {
  try {
    const storedCurrency = localStorage.getItem(displayCurrencyKey)
    return storedCurrency ? (getCurrency(storedCurrency)?.code ?? baseCurrencyCode) : baseCurrencyCode
  } catch {
    return baseCurrencyCode
  }
}

export function setDisplayCurrencyPreference(currency: SupportedCurrencyCode) {
  try {
    localStorage.setItem(displayCurrencyKey, currency)
  } catch {
    // The in-memory preference still works when browser storage is unavailable.
  }
}
