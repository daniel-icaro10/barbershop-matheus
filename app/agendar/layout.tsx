import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Agendar",
}

export default function AgendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto min-h-dvh max-w-[430px] bg-[#080808] safe-bottom">
      {children}
    </div>
  )
}
