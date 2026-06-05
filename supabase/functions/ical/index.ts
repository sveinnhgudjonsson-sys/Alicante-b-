import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ICAL_TOKEN = Deno.env.get('ICAL_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const LABEL_IS: Record<string, string> = {
  svenni_inga:  'Svenni & Inga',
  freyr_soley:  'Freyr & Sóley',
  saman:        'Saman',
  adrir_gestir: 'Aðrir gestir',
}

function icalDate(iso: string): string {
  return iso.replace(/-/g, '')
}

function icalEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  if (!token || token !== ICAL_TOKEN) {
    return new Response('Forbidden', { status: 403 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .order('start_date')

  if (error) return new Response('Database error', { status: 500 })

  const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'

  const events = (bookings ?? []).map((b: Record<string, string>) => {
    const summary     = icalEscape(LABEL_IS[b.label] ?? b.label)
    const description = b.notes ? icalEscape(b.notes) : ''
    const lines = [
      'BEGIN:VEVENT',
      `UID:${b.id}@alicante-ibud.vercel.app`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${icalDate(b.start_date)}`,
      `DTEND;VALUE=DATE:${icalDate(b.end_date)}`,
      `SUMMARY:${summary}`,
    ]
    if (description) lines.push(`DESCRIPTION:${description}`)
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
  ].filter(Boolean).join('\r\n')

  return new Response(cal, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="alicante-ibud.ics"',
      'Cache-Control': 'no-cache',
    },
  })
})
