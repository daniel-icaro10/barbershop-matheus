export const motionTokens = {
  duration: { fast: 0.15, normal: 0.3, slow: 0.5 },
  ease: {
    smooth: [0.16, 1, 0.3, 1] as [number, number, number, number],
    snappy: [0.4, 0, 0.2, 1] as [number, number, number, number],
    out: [0, 0, 0.2, 1] as [number, number, number, number],
  },
  spring: {
    soft: { type: "spring" as const, stiffness: 200, damping: 30 },
    snappy: { type: "spring" as const, stiffness: 400, damping: 40 },
  },
} as const
