export const currencyRegistry = {
  UAH: { name: 'hryvnia', label: 'Ukrainian hryvnia', symbol: '₴', numericCode: 980, base: true },
  USD: { name: 'dollar', label: 'US dollar', symbol: '$', numericCode: 840, base: false },
  EUR: { name: 'euro', label: 'Euro', symbol: '€', numericCode: 978, base: false },
} as const;

export type SupportedCurrencyCode = keyof typeof currencyRegistry;

export const supportedCurrencyCodes = Object.keys(currencyRegistry) as [SupportedCurrencyCode, ...SupportedCurrencyCode[]];
export const supportedCurrencies = supportedCurrencyCodes.map((code) => ({ code, ...currencyRegistry[code] }));
export const baseCurrencyCode = supportedCurrencies.find((currency) => currency.base)?.code ?? supportedCurrencyCodes[0];

export function getCurrency(code: string) {
  if (!Object.hasOwn(currencyRegistry, code)) return undefined;
  const supportedCode = code as SupportedCurrencyCode;
  return { code: supportedCode, ...currencyRegistry[supportedCode] };
}
