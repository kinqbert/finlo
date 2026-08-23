export const supportedCurrencies = [
  { code: 'UAH', name: 'hryvnia' },
  { code: 'USD', name: 'dollar' },
  { code: 'EUR', name: 'euro' },
] as const

export type SupportedCurrencyCode = (typeof supportedCurrencies)[number]['code']
