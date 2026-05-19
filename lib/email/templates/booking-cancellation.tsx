import {
  Html, Head, Body, Container, Section, Text, Heading, Hr, Link, Preview,
} from "@react-email/components"

interface Props {
  clientName: string
  serviceName: string
  dateLabel: string
  rebookUrl: string
}

const gold = "#c9a227"
const bg = "#0c0b09"
const cardBg = "#131210"
const border = "#2a2720"
const textMuted = "#6b6558"
const textBody = "#c4bfb4"

export function BookingCancellationEmail({ clientName, serviceName, dateLabel, rebookUrl }: Props) {
  const firstName = clientName.split(" ")[0]

  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Agendamento cancelado — {serviceName} · {dateLabel}</Preview>
      <Body style={{ backgroundColor: bg, fontFamily: "'Helvetica Neue', Arial, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 520, margin: "0 auto", padding: "32px 16px" }}>

          {/* Header */}
          <Section style={{ textAlign: "center", marginBottom: 32 }}>
            <Text style={{ color: gold, fontSize: 11, fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", margin: "0 0 6px" }}>
              MATHEUS BARBEIRO
            </Text>
            <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${gold}, transparent)`, margin: "0 auto", maxWidth: 120 }} />
          </Section>

          {/* Icon */}
          <Section style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ display: "inline-block", width: 64, height: 64, border: "1px solid #ef444440", backgroundColor: "#ef44440d", textAlign: "center", lineHeight: "64px" }}>
              <Text style={{ fontSize: 28, margin: 0, lineHeight: "64px" }}>✕</Text>
            </div>
          </Section>

          {/* Title */}
          <Section style={{ textAlign: "center", marginBottom: 32 }}>
            <Heading style={{ color: "#ffffff", fontSize: 28, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
              AGENDAMENTO CANCELADO
            </Heading>
            <Text style={{ color: textBody, fontSize: 14, margin: 0 }}>
              Olá, {firstName}. Seu agendamento foi cancelado com sucesso.
            </Text>
          </Section>

          {/* Booking card */}
          <Section style={{ backgroundColor: cardBg, border: `1px solid ${border}`, marginBottom: 24, padding: "0 0 4px" }}>
            <div style={{ height: 2, background: "linear-gradient(to right, transparent, #ef4444, transparent)" }} />
            <div style={{ padding: "20px 24px" }}>
              <Text style={{ color: textMuted, fontSize: 9, fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", margin: "0 0 16px" }}>
                AGENDAMENTO CANCELADO
              </Text>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "6px 0", verticalAlign: "top", width: "50%" }}>
                      <Text style={{ color: textMuted, fontSize: 9, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", margin: "0 0 3px" }}>SERVIÇO</Text>
                      <Text style={{ color: "#ffffff80", fontSize: 14, fontWeight: 600, margin: 0, textDecoration: "line-through" }}>{serviceName}</Text>
                    </td>
                    <td style={{ padding: "6px 0", verticalAlign: "top" }}>
                      <Text style={{ color: textMuted, fontSize: 9, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", margin: "0 0 3px" }}>DATA E HORÁRIO</Text>
                      <Text style={{ color: "#ffffff80", fontSize: 14, fontWeight: 600, margin: 0, textDecoration: "line-through" }}>{dateLabel}</Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* Rebook CTA */}
          <Section style={{ marginBottom: 32 }}>
            <Link
              href={rebookUrl}
              style={{ display: "block", textAlign: "center", padding: "14px", backgroundColor: gold, color: "#000000", fontSize: 13, fontWeight: 700, textDecoration: "none", letterSpacing: "0.05em" }}
            >
              FAZER NOVO AGENDAMENTO
            </Link>
          </Section>

          <Hr style={{ borderColor: border, margin: "0 0 24px" }} />

          {/* Footer */}
          <Section style={{ textAlign: "center" }}>
            <Text style={{ color: textMuted, fontSize: 11, margin: 0 }}>
              Matheus Barbeiro · Recife, PE
            </Text>
            <Text style={{ color: `${textMuted}80`, fontSize: 10, margin: "4px 0 0" }}>
              Este email foi enviado automaticamente após o cancelamento.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
