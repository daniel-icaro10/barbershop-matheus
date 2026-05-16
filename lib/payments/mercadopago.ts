import { MercadoPagoConfig, Payment } from "mercadopago"
import type {
  IPaymentProvider,
  CreatePixPaymentParams,
  PixPaymentResult,
  PaymentStatusResult,
} from "./types"

function getClient(): MercadoPagoConfig {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN
  if (!token) throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured")
  return new MercadoPagoConfig({ accessToken: token, options: { timeout: 10_000 } })
}

function mapStatus(
  status: string | undefined | null,
): PaymentStatusResult["status"] {
  switch (status) {
    case "approved": return "approved"
    case "rejected": return "rejected"
    case "refunded": return "refunded"
    case "cancelled": return "canceled"
    default: return "pending"
  }
}

export class MercadoPagoProvider implements IPaymentProvider {
  async createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResult> {
    const client = getClient()
    const paymentApi = new Payment(client)

    const [firstName, ...rest] = params.payerName.trim().split(" ")
    const lastName = rest.join(" ") || firstName

    const response = await paymentApi.create({
      body: {
        transaction_amount: params.amountInCents / 100,
        description: params.description,
        payment_method_id: "pix",
        external_reference: params.externalReference ?? params.orderId,
        notification_url: params.notificationUrl,
        payer: {
          email: params.payerEmail,
          first_name: firstName,
          last_name: lastName,
        },
      },
    })

    const txData = response.point_of_interaction?.transaction_data
    if (!txData?.qr_code || !txData.qr_code_base64) {
      throw new Error("Mercado Pago did not return PIX QR code data")
    }

    return {
      externalPaymentId: String(response.id),
      qrCode: txData.qr_code,
      qrCodeBase64: txData.qr_code_base64,
      pixCopyPaste: txData.qr_code,
      status: "pending" as const,
    }
  }

  async getPaymentStatus(externalPaymentId: string): Promise<PaymentStatusResult> {
    const client = getClient()
    const paymentApi = new Payment(client)
    const response = await paymentApi.get({ id: externalPaymentId })

    return {
      externalPaymentId: String(response.id),
      status: mapStatus(response.status),
      paidAmountInCents: response.transaction_amount
        ? Math.round(response.transaction_amount * 100)
        : undefined,
      paidAt: response.date_approved
        ? new Date(response.date_approved)
        : undefined,
    }
  }

  async cancelPayment(externalPaymentId: string): Promise<void> {
    const client = getClient()
    const paymentApi = new Payment(client)
    await paymentApi.cancel({ id: externalPaymentId })
  }
}
