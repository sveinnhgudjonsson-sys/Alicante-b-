import { useState } from 'react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, parseISO, isSameDay
} from 'date-fns'
import { Booking, LABEL_META, Label } from '../types'
import { WEEKDAYS, toISO } from '../lib/dates'

const MONTH_IS = [
  'Janúar','Febrúar','Mars','Apríl','Maí','Júní',
  'Júlí','Ágúst','September','Október','Nóvember','Desember'
]

const LEGEND_LABELS: Label[] = ['svenni_inga', 'freyr_soley', 'saman', 'adrir_gestir']

interface Props {
  bookings: Booking[]
  onDayClick: (iso: string) => void
  onBookingClick: (b: Booking) => void
}

export default function Calendar({ bookings, onDayClick, onBookingClick }: Props) {
  const [base, setBase] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })

  const months = [base, addMonths(base, 1)]

  return (
    <div>
      {/* Navigation */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <button
          onClick={() => setBase(m => subMonths(m, 1))}
          className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-600 text-xl leading-none"
          aria-label="Fyrri mánuður"
        >
          ‹
        </button>
        <span className="text-sm text-gray-500">
          {MONTH_IS[months[0].getMonth()]} – {MONTH_IS[months[1].getMonth()]} {months[1].getFullYear()}
        </span>
        <button
          onClick={() => setBase(m => addMonths(m, 1))}
          className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-600 text-xl leading-none"
          aria-label="Næsti mánuður"
        >
          ›
        </button>
      </div>

      {/* Colour legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 pb-3">
        {LEGEND_LABELS.map(l => (
          <div key={l} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm flex-shrink-0 ${LABEL_META[l].bg}`} />
            <span className="text-xs text-gray-500">{LABEL_META[l].display}</span>
          </div>
        ))}
      </div>

      {/* Two month grids — stacked on mobile, side-by-side on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-4 px-2 pb-4">
        {months.map((month, mi) => (
          <MonthGrid
            key={mi}
            month={month}
            bookings={bookings}
            onDayClick={onDayClick}
            onBookingClick={onBookingClick}
          />
        ))}
      </div>
    </div>
  )
}

function MonthGrid({ month, bookings, onDayClick, onBookingClick }: {
  month: Date
  bookings: Booking[]
  onDayClick: (iso: string) => void
  onBookingClick: (b: Booking) => void
}) {
  const days      = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const firstDow  = (getDay(days[0]) + 6) % 7
  const blanks    = Array(firstDow).fill(null)
  const monthStart = startOfMonth(month)
  const monthEnd   = endOfMonth(month)

  // Build a per-day coverage map: iso → { booking, isBookingStart, isBookingEnd }
  type CoverInfo = { booking: Booking; isBookingStart: boolean; isBookingEnd: boolean }
  const coverage = new Map<string, CoverInfo>()

  const visible = bookings.filter(b => {
    const bs = parseISO(b.start_date)
    const be = parseISO(b.end_date)
    return bs <= monthEnd && be > monthStart
  })

  for (const b of visible) {
    const bs      = parseISO(b.start_date)
    const be      = parseISO(b.end_date)
    const bLastDay = new Date(be.getTime() - 86400000) // last occupied day

    const coverStart = bs < monthStart ? monthStart : bs
    const coverEnd   = bLastDay > monthEnd ? monthEnd : bLastDay

    eachDayOfInterval({ start: coverStart, end: coverEnd }).forEach(day => {
      coverage.set(toISO(day), {
        booking: b,
        isBookingStart: isSameDay(day, bs),
        isBookingEnd:   isSameDay(day, bLastDay),
      })
    })
  }

  return (
    <div className="md:border md:border-gray-100 md:rounded-xl md:p-2">
      <h2 className="text-center font-semibold text-gray-700 mb-2">
        {MONTH_IS[month.getMonth()]} {month.getFullYear()}
      </h2>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {blanks.map((_, i) => <div key={`b${i}`} className="h-10" />)}
        {days.map(day => {
          const iso   = toISO(day)
          const today = toISO(new Date()) === iso
          const cover = coverage.get(iso)
          const meta  = cover ? LABEL_META[cover.booking.label] : null

          // Day-of-week: Mon=0 … Sun=6
          const dow = (day.getDay() + 6) % 7

          // Visual segment edges: round at true booking start/end AND at week row boundaries
          const visualFirst = !cover ? false : (cover.isBookingStart || dow === 0)
          const visualLast  = !cover ? false : (cover.isBookingEnd   || dow === 6)

          // Build border-radius string: only round the outer edges of the segment
          let borderRadius = '0'
          if (cover) {
            const r = '9999px'
            const tl = visualFirst ? r : '0'
            const tr = visualLast  ? r : '0'
            const br = visualLast  ? r : '0'
            const bl = visualFirst ? r : '0'
            borderRadius = `${tl} ${tr} ${br} ${bl}`
          }

          // Small horizontal margin at segment edges so bars don't touch card border
          const ml = cover && visualFirst ? '2px' : '0'
          const mr = cover && visualLast  ? '2px' : '0'

          return (
            <button
              key={iso}
              onClick={() => cover ? onBookingClick(cover.booking) : onDayClick(iso)}
              className={`h-10 flex items-center justify-center text-sm font-medium transition-colors
                ${cover
                  ? `${meta!.bg} opacity-90 ${today ? 'ring-2 ring-white ring-inset' : ''}`
                  : `hover:bg-gray-100 active:bg-gray-200 ${today ? 'text-blue-600 font-bold' : 'text-gray-700'}`
                }
              `}
              style={{ borderRadius, marginLeft: ml, marginRight: mr, width: cover ? `calc(100% - ${ml} - ${mr})` : undefined }}
              title={cover ? meta!.display : undefined}
            >
              <span className={cover ? 'text-white' : ''}>
                {day.getDate()}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
