import { MercadoPagoProvider } from "./mercadopago"
import type { IPaymentProvider } from "./types"

export type { IPaymentProvider, CreatePixPaymentParams, PixPaymentResult, PaymentStatusResult } from "./types"

let _provider: IPaymentProvider | null = null

export function getPaymentProvider(): IPaymentProvider {
  if (!_provider) _provider = new MercadoPagoProvider()
  return _provider
}
