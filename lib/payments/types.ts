export interface CreatePixPaymentParams {
  orderId: string
  amountInCents: number
  description: string
  payerEmail: string
  payerName: string
  externalReference?: string
  notificationUrl: string
}

export interface PixPaymentResult {
  externalPaymentId: string
  qrCode: string
  qrCodeBase64: string
  pixCopyPaste: string
  status: "pending" | "approved" | "rejected"
}

export interface PaymentStatusResult {
  externalPaymentId: string
  status: "pending" | "approved" | "rejected" | "refunded" | "canceled"
  paidAmountInCents?: number
  paidAt?: Date
}

export interface IPaymentProvider {
  createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResult>
  getPaymentStatus(externalPaymentId: string): Promise<PaymentStatusResult>
  cancelPayment(externalPaymentId: string): Promise<void>
}
