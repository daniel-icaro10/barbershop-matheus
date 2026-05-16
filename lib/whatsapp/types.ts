export type WhatsAppEvent =
  | "booking_confirmed"
  | "booking_reminder"
  | "booking_cancelled"
  | "review_request"
  | "pix_pending"
  | "pix_approved"
  | "birthday"

export interface SendMessageParams {
  to: string
  event: WhatsAppEvent
  data: Record<string, string | number>
}

export interface IWhatsAppProvider {
  sendMessage(params: SendMessageParams): Promise<void>
}

// Concrete providers (to be implemented when needed):
// - EvolutionApiProvider
// - ZApiProvider
// - MetaCloudApiProvider
