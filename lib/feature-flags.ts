export const featureFlags = {
  pixEnabled: true,
  creditCardEnabled: false,
  whatsappEnabled: false,
  reviewsEnabled: true,
  cashRegisterEnabled: true,
} as const

export type FeatureFlags = typeof featureFlags
