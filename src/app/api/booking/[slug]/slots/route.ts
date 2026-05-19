/**
 * GET /api/booking/[slug]/slots?date=YYYY-MM-DD&seanceTypeId=xxx&praticienId=xxx
 *
 * Returns all time slots for a given date, marking which are available.
 * Public — no auth required.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Context = { params: Promise<{ slug: string }> }

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
}

export async function GET(req: NextRequest, { params }: Context) {
  const { slug } = await params
  const { searchParams } = new URL(req.url)
  const date         = searchParams.get('date')            // YYYY-MM-DD
  const seanceTypeId = searchParams.get('seanceTypeId')
  const praticienId  = searchParams.get('praticienId')     // optional

  if (!date || !seanceTypeId) {
    return NextResponse.json({ error: 'date et seanceTypeId requis' }, { status: 400 })
  }

  try {
    // Cabinet config
    const cabinet = await prisma.cabinet.findUnique({
      where: { slug },
      select: {
        id: true,
        bookingEnabled: true,
        workStartTime: true,
        workEndTime: true,
        lunchStartTime: true,
        lunchEndTime: true,
        workingDays: true,
      },
    })
    if (!cabinet || !cabinet.bookingEnabled) {
      return NextResponse.json({ error: 'Cabinet introuvable ou réservation désactivée' }, { status: 404 })
    }

    // SeanceType duration
    const seanceType = await prisma.seanceType.findFirst({
      where: { id: seanceTypeId, cabinetId: cabinet.id },
      select: { dureeDefaut: true },
    })
    if (!seanceType) return NextResponse.json({ error: 'Type invalide' }, { status: 400 })

    const slotDuration = seanceType.dureeDefaut

    // Generate all theoretical slots (work hours, minus lunch)
    const workStart   = timeToMinutes(cabinet.workStartTime   || '08:00')
    const workEnd     = timeToMinutes(cabinet.workEndTime     || '18:00')
    const lunchStart  = timeToMinutes(cabinet.lunchStartTime  || '12:00')
    const lunchEnd    = timeToMinutes(cabinet.lunchEndTime    || '14:00')

    const allSlots: string[] = []
    for (let t = workStart; t + slotDuration <= workEnd; t += slotDuration) {
      // Skip slots that overlap lunch
      if (t < lunchEnd && t + slotDuration > lunchStart) continue
      allSlots.push(minutesToTime(t))
    }

    // Fetch already booked RDVs for this date
    const dayStart = new Date(`${date}T00:00:00`)
    const dayEnd   = new Date(`${date}T23:59:59`)

    const bookedQuery: any = {
      cabinetId: cabinet.id,
      date: { gte: dayStart, lte: dayEnd },
    }
    if (praticienId) bookedQuery.praticienId = praticienId

    const booked = await prisma.rendezVous.findMany({
      where: bookedQuery,
      select: { date: true, duree: true },
    })

    // Build set of busy minute ranges
    const busyRanges = booked.map(r => ({
      start: r.date.getHours() * 60 + r.date.getMinutes(),
      end:   r.date.getHours() * 60 + r.date.getMinutes() + r.duree,
    }))

    // Mark each slot
    const slots = allSlots.map(time => {
      const slotStart = timeToMinutes(time)
      const slotEnd   = slotStart + slotDuration
      const busy = busyRanges.some(b => slotStart < b.end && slotEnd > b.start)
      return { time, available: !busy }
    })

    // Also disable past slots if date is today
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
    const nowMinutes = now.getHours() * 60 + now.getMinutes()

    const result = slots.map(s => ({
      ...s,
      available: s.available && (date > today || (date === today && timeToMinutes(s.time) > nowMinutes + 30)),
    }))

    return NextResponse.json(result)
  } catch (err) {
    console.error('[GET /api/booking/[slug]/slots]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
