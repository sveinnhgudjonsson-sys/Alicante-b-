import type { VercelRequest, VercelResponse } from '@vercel/node'

const RESEND_API_KEY = process.env.RESEND_API_KEY!
const FROM_EMAIL    = process.env.RESEND_FROM_EMAIL!

// Couple B emails get notified when couple A acts, and vice versa
const COUPLE_EMAILS: Record<string, string[]> = {
  A: ['sveinn@hamrar.com', 'ingahardar67@gmail.com'],
  B: ['soley.kristjansdottir@olgerdin.is', 'freyr@thg.is'],
}

const COUPLE_NAME: Record<string, string> = {
  A: 'Svenni & Inga',
  B: 'Freyr & Sóley',
}

const LABEL_IS: Record<string, string> = {
  svenni_inga:  'Svenni & Inga',
  freyr_soley:  'Freyr & Sóley',
  saman:        'Saman',
  adrir_gestir: 'Aðrir gestir',
}

const MONTHS = [
  'janúar','febrúar','mars','apríl','maí','júní',
  'júlí','ágúst','september','október','nóvember','desember'
]

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getUTCDate()}. ${MONTHS[d.getUTCMonth()]}`
}

function nights(start: string, end: string) {
  return (new Date(end).getTime() - new Date(start).getTime()) / 86400000
}

function fmtNights(n: number) {
  return n === 1 ? '1 nótt' : `${n} nætur`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { action, booking, actingCouple } = req.body as {
    action: 'created' | 'updated' | 'deleted'
    booking: {
      start_date: string
      end_date: string
      label: string
      notes?: string | null
    }
    actingCouple: 'A' | 'B'
  }

  const otherCouple = actingCouple === 'A' ? 'B' : 'A'
  const to = COUPLE_EMAILS[otherCouple]
  const actor = COUPLE_NAME[actingCouple]

  const n = nights(booking.start_date, booking.end_date)
  const dateRange = `${fmtDate(booking.start_date)} – ${fmtDate(booking.end_date)} (${fmtNights(n)})`
  const labelIs = LABEL_IS[booking.label] ?? booking.label

  let subject: string
  let body: string

  if (action === 'created') {
    subject = `Ný bókun: ${labelIs} · ${dateRange}`
    body = `${actor} bókaði Alicante íbúðina.\n\nMerking: ${labelIs}\nDagsetningar: ${dateRange}`
  } else if (action === 'deleted') {
    subject = `Bókun aflýst: ${labelIs} · ${dateRange}`
    body = `${actor} aflysti bókun á Alicante íbúðinni.\n\nMerking: ${labelIs}\nDagsetningar: ${dateRange}`
  } else {
    subject = `Bókun breytt: ${labelIs} · ${dateRange}`
    body = `${actor} breytti bókun á Alicante íbúðinni.\n\nMerking: ${labelIs}\nNýjar dagsetningar: ${dateRange}`
  }

  if (booking.notes) body += `\n\nAthugasemd: ${booking.notes}`

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, text: body }),
    })

    if (!resp.ok) {
      const txt = await resp.text()
      return res.status(500).json({ error: txt })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
