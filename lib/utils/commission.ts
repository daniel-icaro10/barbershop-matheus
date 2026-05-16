import type { CommissionType } from "@/generated/prisma/client"

export function calculateCommission(
  priceInCents: number,
  commissionType: CommissionType | null | undefined,
  commissionValue: number | null | undefined,
): number {
  if (!commissionType || commissionValue == null) return 0
  if (commissionType === "PERCENTAGE") {
    return Math.round((priceInCents * commissionValue) / 10000)
  }
  return commissionValue
}

export function calculateProfit(
  priceInCents: number,
  costInCents: number | null | undefined,
): number {
  if (costInCents == null) return 0
  return priceInCents - costInCents
}

export function calculateMarginPercent(
  priceInCents: number,
  costInCents: number | null | undefined,
): number {
  if (!costInCents || costInCents <= 0) return 0
  return Math.round(((priceInCents - costInCents) / priceInCents) * 100)
}
