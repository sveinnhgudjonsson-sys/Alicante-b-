import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const ICAL_TOKEN          = process.env.ICAL_TOKEN!
const SUPABASE_URL        = process.env.VITE_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const LABEL_IS: Record<string, string> = {
  svenni_inga:  'Svenni & Inga',
  freyr_soley:  'Freyr & Sóley',
  saman:        'Saman',
  adrir_gestir: 'Aðrir gestir',
}

function icalDate(iso: string): string {
  // YYYYMMDD from "YYYY-MM-DD"
  return iso.replace(/-/g, '')
}

function icalEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function foldLine(line: string): string {
  // iCal lines must be ≤75 octets; fold longer lines
  const bytes: string[] = []
  let len = 0
  for (const ch of line) {
    const enc = new TextEncoder().encode(ch).length
    if (len + enc > 75) { bytes.push('\r\n '); len = 1 }
    bytes.push(ch); len += enc
  }
  return bytes.join('')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Validate token
  const token = req.query.token as string
  if (!token || token !== ICAL_TOKEN) {
    return res.status(403).send('Forbidden')
  }

  // Fetch bookings using service role key (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .order('start_date')

  if (error) return res.status(500).send('Database error')

  const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'

  const events = (bookings ?? []).map(b => {
    const summary     = icalEscape(LABEL_IS[b.label] ?? b.label)
    const description = b.notes ? icalEscape(b.notes) : ''
    const lines = [
      'BEGIN:VEVENT',
      `UID:${b.id}@alicante-ibud.vercel.app`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${icalDate(b.start_date)}`,
      `DTEND;VALUE=DATE:${icalDate(b.end_date)}`,
      foldLine(`SUMMARY:${summary}`),
    ]
    if (description) lines.push(foldLine(`DESCRIPTION:${description}`))
    lines.push('END:VEVENT')
    return lines.join('\r\n')
  }).join('\r\n')

  const cal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Alicante íbúð//Booking Calendar//IS',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Alicante íbúð',
    'X-WR-TIMEZONE:Atlantic/Reykjavik',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
    events,
    'END:VCALENDAR',
  ].join('\r\n')

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', 'inline; filename="alicante-ibud.ics"')
  res.setHeader('Cache-Control', 'no-cache, no-store')
  return res.status(200).send(cal)
}
