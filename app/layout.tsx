import type { Metadata, Viewport } from "next"
import { Geist, Bebas_Neue, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Toaster } from "./_components/ui/sonner"
import QueryProvider from "./_providers/query-provider"
import { ThemeProvider } from "./_providers/theme-provider"
import { SwRegister } from "./_components/sw-register"

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
})

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
})

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Matheus Barbeiro",
    template: "%s · Matheus Barbeiro",
  },
  description: "Agende seu horário com Matheus Barbeiro. Experiência premium, profissionais especializados.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Matheus",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#c9a227",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geist.variable} ${bebasNeue.variable} ${playfair.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            <SwRegister />
            {children}
            <Toaster
              richColors
              position="top-center"
              expand={false}
              closeButton
              duration={4000}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
