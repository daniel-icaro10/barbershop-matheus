"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { fromZonedTime } from "date-fns-tz"
import { authClient } from "@/lib/auth-client"
import { useBookingStore } from "@/lib/store/booking-store"
import { createBooking } from "@/app/_actions/create-booking"
import { APP_TIMEZONE } from "@/lib/constants/timezone"
import { toast } from "sonner"
import type { BookingService } from "@/lib/store/booking-store"

import BookingProgress from "./booking-progress"
import StepService from "./step-service"
import StepDateTime from "./step-date-time"
import StepPersonalData from "./step-personal-data"
import StepAuth from "./step-auth"
import StepConfirmation from "./step-confirmation"

const DRAFT_KEY = "booking-draft-pending"

interface LocationData {
  address: string
  latitude: number | null
  longitude: number | null
  googleMapsUrl: string | null
}

export default function BookingFlow({
  services,
  initialService = null,
  location = null,
}: {
  services: BookingService[]
  initialService?: BookingService | null
  location?: LocationData | null
}) {
  const store = useBookingStore()
  const { data: session } = authClient.useSession()
  const isLoggedIn = !!session?.user
  const isCreatingRef = useRef(false)

  // Pre-select service from URL param and skip to date/time step
  useEffect(() => {
    if (!initialService) return
    store.setService(initialService)
    store.setStep(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateBooking = useCallback(async (): Promise<boolean> => {
    if (isCreatingRef.current) return false
    isCreatingRef.current = true

    const { service, time, date } = useBookingStore.getState()
    if (!service || !time || !date) {
      toast.error("Dados incompletos. Recomeça o agendamento.")
      useBookingStore.getState().setStep(0)
      isCreatingRef.current = false
      return false
    }
    const [h, m] = time.split(":").map(Number)
    // Construct the booking time as São Paulo local time, regardless of the browser's timezone.
    // date.getFullYear/Month/Date() gives the calendar day the user selected (browser local values
    // always match the visible calendar day). new Date(Date.UTC(...)) avoids browser-TZ contamination
    // before fromZonedTime interprets those values as SP time and converts to UTC.
    const bookingDate = fromZonedTime(
      new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0, 0)),
      APP_TIMEZONE,
    )

    const { personalData } = useBookingStore.getState()
    const phone = personalData?.phone?.replace(/\D/g, "") ?? undefined
    const result = await createBooking({ serviceId: service.id, date: bookingDate, phone })

    if (result?.validationErrors || result?.serverError) {
      const msg =
        result?.validationErrors?._errors?.[0] ?? "Erro ao criar agendamento"
      toast.error(msg)
      isCreatingRef.current = false
      return false
    }
    if (result?.data?.id) {
      useBookingStore.getState().setBookingId(result.data.id)
    }
    useBookingStore.getState().setStep(4)
    return true
  }, [])

  // Recover booking state after OAuth redirect
  useEffect(() => {
    if (!session?.user) return
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return

    try {
      const draft = JSON.parse(raw) as {
        serviceId: string
        time: string
        date: string
        personalData: { name: string; phone: string; notes: string }
      }
      sessionStorage.removeItem(DRAFT_KEY)

      const foundService = services.find((s) => s.id === draft.serviceId)
      if (foundService) store.setService(foundService)
      store.setDate(new Date(draft.date))
      store.setTime(draft.time)
      if (draft.personalData) store.setPersonalData(draft.personalData)
      handleCreateBooking()
    } catch {
      sessionStorage.removeItem(DRAFT_KEY)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user])

  const handleGoogleLogin = useCallback(async () => {
    const { service, time, date, personalData } = useBookingStore.getState()
    if (!service || !time || !date) return

    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        serviceId: service.id,
        time,
        date: date instanceof Date ? date.toISOString() : date,
        personalData,
      })
    )
    await authClient.signIn.social({ provider: "google" })
  }, [])

  const steps = useMemo(
    () => [
      <StepService key="service" services={services} />,
      <StepDateTime key="datetime" />,
      <StepPersonalData key="personal" />,
      <StepAuth
        key="auth"
        isLoggedIn={isLoggedIn}
        onGoogleLogin={handleGoogleLogin}
        onBookingCreate={handleCreateBooking}
      />,
      <StepConfirmation key="confirmation" location={location} />,
    ],
    [services, isLoggedIn, handleGoogleLogin, handleCreateBooking, location],
  )

  const pageVariants = {
    initial: { opacity: 0, x: 32, filter: "blur(4px)" },
    animate: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: { opacity: 0, x: -32, filter: "blur(4px)" },
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {store.step < 4 && <BookingProgress currentStep={store.step} />}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={store.step}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.26, ease: [0.32, 0, 0.08, 1] }}
          className="flex flex-1 flex-col"
        >
          {steps[store.step]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
