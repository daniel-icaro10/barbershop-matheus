import {
  Html, Head, Body, Container, Section, Text, Heading, Hr, Link, Preview,
} from "@react-email/components"

interface Props {
  clientName: string
  serviceName: string
  servicePrice: number
  dateLabel: string    // "terça-feira, 20 de maio de 2026 às 09:00"
  calendarUrl: string
  whatsappUrl: string
}

const gold = "#c9a227"
const bg = "#0c0b09"
const cardBg = "#131210"
const border = "#2a2720"
const textMuted = "#6b6558"
const textBody = "#c4bfb4"

export function BookingConfirmationEmail({
  clientName,
  serviceName,
  servicePrice,
  dateLabel,
  calendarUrl,
  whatsappUrl,
}: Props) {
  const firstName = clientName.split(" ")[0]
  const priceLabel = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(servicePrice / 100)

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Agendamento confirmado — {serviceName} · {dateLabel}</Preview>
      <Body style={{ backgroundColor: bg, fontFamily: "'Helvetica Neue', Arial, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 520, margin: "0 auto", padding: "32px 16px" }}>

          {/* Header */}
          <Section style={{ textAlign: "center", marginBottom: 32 }}>
            <Text style={{ color: gold, fontSize: 11, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", margin: "0 0 6px" }}>
              MATHEUS BARBEIRO
            </Text>
            <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${gold}, transparent)`, margin: "0 auto", maxWidth: 120 }} />
          </Section>

          {/* Checkmark icon */}
          <Section style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ display: "inline-block", width: 64, height: 64, border: `1px solid ${gold}40`, backgroundColor: `${gold}14`, textAlign: "center", lineHeight: "64px" }}>
              <Text style={{ fontSize: 28, margin: 0, lineHeight: "64px" }}>✂️</Text>
            </div>
          </Section>

          {/* Title */}
          <Section style={{ textAlign: "center", marginBottom: 32 }}>
            <Heading style={{ color: "#ffffff", fontSize: 28, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
              TUDO CONFIRMADO!
            </Heading>
            <Text style={{ color: textBody, fontSize: 14, margin: 0 }}>
              Até logo, {firstName}! Te esperamos na hora certa.
            </Text>
          </Section>

          {/* Booking card */}
          <Section style={{ backgroundColor: cardBg, border: `1px solid ${border}`, marginBottom: 24, padding: "0 0 4px" }}>
            <div style={{ height: 2, background: `linear-gradient(to right, transparent, ${gold}, transparent)` }} />
            <div style={{ padding: "20px 24px" }}>
              <Text style={{ color: textMuted, fontSize: 9, fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", margin: "0 0 16px" }}>
                DETALHES DO AGENDAMENTO
              </Text>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "6px 0", verticalAlign: "top", width: "50%" }}>
                      <Text style={{ color: textMuted, fontSize: 9, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", margin: "0 0 3px" }}>SERVIÇO</Text>
                      <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: 600, margin: 0 }}>{serviceName}</Text>
                    </td>
                    <td style={{ padding: "6px 0", verticalAlign: "top" }}>
                      <Text style={{ color: textMuted, fontSize: 9, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", margin: "0 0 3px" }}>VALOR</Text>
                      <Text style={{ color: gold, fontSize: 14, fontWeight: 700, margin: 0 }}>{priceLabel}</Text>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ padding: "10px 0 0" }}>
                      <Text style={{ color: textMuted, fontSize: 9, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", margin: "0 0 3px" }}>DATA E HORÁRIO</Text>
                      <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: 600, margin: 0 }}>{dateLabel}</Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* Buttons */}
          <Section style={{ marginBottom: 24 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "0 6px 0 0" }}>
                    <Link
                      href={calendarUrl}
                      style={{ display: "block", textAlign: "center", padding: "12px", border: `1px solid ${border}`, backgroundColor: cardBg, color: textBody, fontSize: 12, fontWeight: 600, textDecoration: "none" }}
                    >
                      📅 Adicionar ao calendário
                    </Link>
                  </td>
                  <td style={{ padding: "0 0 0 6px" }}>
                    <Link
                      href={whatsappUrl}
                      style={{ display: "block", textAlign: "center", padding: "12px", border: "1px solid #16a34a33", backgroundColor: "#16a34a0f", color: "#4ade80", fontSize: 12, fontWeight: 600, textDecoration: "none" }}
                    >
                      💬 Falar no WhatsApp
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Warning */}
          <Section style={{ backgroundColor: `${gold}0d`, border: `1px solid ${gold}25`, padding: "12px 16px", marginBottom: 32 }}>
            <Text style={{ color: `${gold}cc`, fontSize: 12, margin: 0, lineHeight: "1.6" }}>
              ⚠️ <strong>Atenção:</strong> Não atrase o seu horário. Devido à alta demanda, atrasos podem comprometer o atendimento dos próximos clientes.
            </Text>
          </Section>

          <Hr style={{ borderColor: border, margin: "0 0 24px" }} />

          {/* Footer */}
          <Section style={{ textAlign: "center" }}>
            <Text style={{ color: textMuted, fontSize: 11, margin: 0 }}>
              Matheus Barbeiro · Recife, PE
            </Text>
            <Text style={{ color: `${textMuted}80`, fontSize: 10, margin: "4px 0 0" }}>
              Este email foi enviado automaticamente após o agendamento.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
