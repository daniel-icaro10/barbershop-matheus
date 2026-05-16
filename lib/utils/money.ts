const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

export function formatCurrency(cents: number): string {
  return BRL.format(cents / 100)
}

export function parseCurrencyInput(value: string): number {
  const normalized = value.replace(/[^\d,]/g, "").replace(",", ".")
  const parsed = parseFloat(normalized)
  return isNaN(parsed) ? 0 : Math.round(parsed * 100)
}

export function formatCurrencyInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",")
}
