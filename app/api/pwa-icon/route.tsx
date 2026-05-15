import { ImageResponse } from "next/og"

export const runtime = "edge"

export function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const size = Math.min(512, Math.max(32, Number(searchParams.get("size")) || 192))

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0d0d0d 0%, #1a1407 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: size * 0.04,
          }}
        >
          {/* Scissors icon approximation */}
          <div
            style={{
              fontSize: size * 0.42,
              color: "#c9a227",
              fontWeight: 900,
              letterSpacing: -2,
              lineHeight: 1,
              fontFamily: "serif",
            }}
          >
            M
          </div>
          <div
            style={{
              width: size * 0.28,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, #c9a227, transparent)",
            }}
          />
        </div>
      </div>
    ),
    { width: size, height: size }
  )
}
