'use client'

import { useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction'
import luxonPlugin from '@fullcalendar/luxon3'
import frLocale from '@fullcalendar/core/locales/fr'
import type { EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core'

// Statuts "figés" : un RDV dans cet état ne peut pas être déplacé.
const FROZEN_STATUTS = ['annule', 'annulee', 'realisee', 'termine', 'honore', 'absent', 'no_show']

export interface AgendaCalendarProps {
  rdvList: any[]
  couleurMap: Record<string, string>
  /** Clic sur un créneau vide → ouvre la création de RDV pré-remplie.
   *  Reçoit `arg.dateStr` (ISO local au fuseau du calendrier, ex.
   *  "2026-05-25T09:00:00+01:00") pour un prefill sans calcul de fuseau. */
  onSlotClick: (dateStr: string) => void
  /** Clic sur un RDV existant → ouvre le panneau d'actions (rappel WhatsApp…). */
  onEventClick: (rdv: any) => void
  /** Déplacement validé en base → déclenche un refetch côté parent. */
  onMoved: () => void
  /** Appelle la server action moveAppointment(id, isoUTC). */
  moveAppointment: (id: string, newStartISO: string) => Promise<{ ok: boolean; error?: string }>
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export default function AgendaCalendar({
  rdvList,
  couleurMap,
  onSlotClick,
  onEventClick,
  onMoved,
  moveAppointment,
  onSuccess,
  onError,
}: AgendaCalendarProps) {
  const events: EventInput[] = useMemo(
    () =>
      rdvList.map((rdv) => {
        const start = new Date(rdv.date)
        const dureeMin = typeof rdv.duree === 'number' ? rdv.duree : 45
        const end = new Date(start.getTime() + dureeMin * 60_000)
        const frozen = !!rdv.statut && FROZEN_STATUTS.includes(String(rdv.statut).toLowerCase())
        const color =
          rdv.source === 'online' ? '#0D9488' : couleurMap[rdv.typeSeance] || '#2563EB'
        const name = `${rdv.patient?.prenom ?? ''} ${rdv.patient?.nom ?? ''}`.trim()

        return {
          id: rdv.id,
          title: `${rdv.source === 'online' ? '🌐 ' : ''}${name || 'RDV'}`,
          start,
          end,
          backgroundColor: color,
          borderColor: color,
          editable: !frozen, // RDV figés non déplaçables (en plus du garde serveur)
          extendedProps: { rdv },
        }
      }),
    [rdvList, couleurMap]
  )

  async function handleEventDrop(info: EventDropArg) {
    const id = info.event.id
    const startDate = info.event.start
    if (!startDate) {
      info.revert()
      return
    }
    // start.toISOString() = instant UTC correct (aucune conversion manuelle).
    const res = await moveAppointment(id, startDate.toISOString())
    if (!res.ok) {
      info.revert() // remet le RDV à sa place d'origine
      onError(res.error || 'Échec du déplacement')
      return
    }
    onSuccess('RDV déplacé')
    onMoved()
  }

  return (
    <div className="agenda-fullcalendar">
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin, luxonPlugin]}
        initialView="timeGridWeek"
        locale={frLocale}
        timeZone="Africa/Casablanca"
        firstDay={1}
        nowIndicator
        allDaySlot={false}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        slotDuration="00:30:00"
        expandRows
        height="auto"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay',
        }}
        // Déplacement uniquement (pas de redimension de durée, pas de resource/praticien)
        editable
        eventStartEditable
        eventDurationEditable={false}
        eventResizableFromStart={false}
        events={events}
        eventDrop={handleEventDrop}
        eventClick={(arg: EventClickArg) => onEventClick(arg.event.extendedProps.rdv)}
        dateClick={(arg: DateClickArg) => onSlotClick(arg.dateStr)}
        eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
      />
    </div>
  )
}
