"use client"

import { useState, useTransition } from "react"
import { updateLocation } from "@/app/_actions/admin/barbershop/update-location"
import { toast } from "sonner"
import { Loader2, MapPin, Navigation, ExternalLink } from "lucide-react"

const inputClass = "w-full border border-border/60 bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
const labelClass = "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"

interface Props {
  barbershop: {
    address: string
    latitude: number | null
    longitude: number | null
    googleMapsUrl: string | null
  }
}

export function LocationForm({ barbershop }: Props) {
  const [address, setAddress] = useState(barbershop.address)
  const [lat, setLat] = useState(barbershop.latitude?.toString() ?? "")
  const [lng, setLng] = useState(barbershop.longitude?.toString() ?? "")
  const [mapsUrl, setMapsUrl] = useState(barbershop.googleMapsUrl ?? "")
  const [pending, startTransition] = useTransition()

  const handleSave = () => {
    if (!address.trim()) return toast.error("Endereço é obrigatório.")

    startTransition(async () => {
      const result = await updateLocation({
        address: address.trim(),
        latitude: lat ? parseFloat(lat) : undefined,
        longitude: lng ? parseFloat(lng) : undefined,
        googleMapsUrl: mapsUrl.trim() || undefined,
      })
      if (result?.serverError) { toast.error("Erro ao salvar localização."); return }
      toast.success("Localização atualizada!")
    })
  }

  const previewUrl =
    lat && lng
      ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`
      : null

  return (
    <div className="max-w-lg">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Endereço completo</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro, cidade" maxLength={500} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Latitude</label>
            <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-23.5505" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Longitude</label>
            <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-46.6333" className={inputClass} />
          </div>
        </div>

        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border border-blue-400/20 bg-blue-400/[0.06] px-4 py-2.5 text-xs font-semibold text-blue-400 transition-all hover:bg-blue-400/10"
          >
            <Navigation className="size-3.5" />
            Visualizar no mapa
            <ExternalLink className="size-3 ml-auto" />
          </a>
        )}

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>URL Google Maps (opcional)</label>
          <input type="url" value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} placeholder="https://maps.google.com/..." className={inputClass} />
          <p className="text-[10px] text-muted-foreground">
            Link de compartilhamento do Google Maps para botão &quot;Como chegar&quot;
          </p>
        </div>

        {(barbershop.latitude || barbershop.googleMapsUrl) && (
          <div className="border border-white/[0.07] bg-white/[0.03] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30 mb-3">Prévia no site</p>
            <div className="flex gap-3">
              {barbershop.googleMapsUrl && (
                <a
                  href={barbershop.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 border border-[#c9a227]/20 bg-[#c9a227]/[0.06] px-3 py-2 text-xs font-bold text-[#c9a227]"
                >
                  <Navigation className="size-3.5" />
                  Como chegar
                </a>
              )}
              {barbershop.latitude && barbershop.longitude && (
                <a
                  href={`https://waze.com/ul?ll=${barbershop.latitude},${barbershop.longitude}&navigate=yes`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 border border-blue-400/20 bg-blue-400/[0.06] px-3 py-2 text-xs font-bold text-blue-400"
                >
                  <MapPin className="size-3.5" />
                  Waze
                </a>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={pending}
          className="flex items-center justify-center gap-2 bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
          Salvar localização
        </button>
      </div>
    </div>
  )
}
