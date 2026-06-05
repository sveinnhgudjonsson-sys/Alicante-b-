import { useState } from 'react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, parseISO
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
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })

  // Monday=0 offset: getDay() returns Sun=0..Sat=6, convert to Mon=0..Sun=6
  const firstDow = (getDay(days[0]) + 6) % 7
  const blanks = Array(firstDow).fill(null)

  const monthStart = startOfMonth(month)
  const monthEnd   = endOfMonth(month)

  const visible = bookings.filter(b => {
    const bs = parseISO(b.start_date)
    const be = parseISO(b.end_date)
    return bs <= monthEnd && be > monthStart
  })

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

      {/* Day cells + booking bars overlay */}
      <div className="relative">
        <div className="grid grid-cols-7">
          {blanks.map((_, i) => <div key={`b${i}`} className="h-10" />)}
          {days.map(day => {
            const iso = toISO(day)
            const today = toISO(new Date()) === iso
            return (
              <button
                key={iso}
                onClick={() => onDayClick(iso)}
                className={`h-10 flex items-start justify-center pt-1 text-sm relative z-10
                  ${today ? 'font-bold text-blue-600' : 'text-gray-700'}
                  hover:bg-gray-100 rounded active:bg-gray-200`}
              >
                {day.getDate()}
              </button>
            )
          })}
        </div>

        {/* Booking bars */}
        <div className="absolute inset-0 pointer-events-none">
          {visible.map(b => (
            <BookingBar
              key={b.id}
              booking={b}
              month={month}
              blanks={firstDow}
              onBookingClick={onBookingClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function BookingBar({ booking, month, blanks, onBookingClick }: {
  booking: Booking
  month: Date
  blanks: number
  onBookingClick: (b: Booking) => void
}) {
  const monthStart = startOfMonth(month)
  const monthEnd   = endOfMonth(month)

  const bs = parseISO(booking.start_date)
  const be = parseISO(booking.end_date) // exclusive

  // True start/end relative to this month
  const isRealStart = bs >= monthStart
  const isRealEnd   = new Date(be.getTime() - 86400000) <= monthEnd

  const visStart = bs < monthStart ? monthStart : bs
  const lastDay  = new Date(be.getTime() - 86400000)
  const visEnd   = lastDay > monthEnd ? monthEnd : lastDay

  const startDay = visStart.getDate()
  const endDay   = visEnd.getDate()

  const startCell = blanks + startDay - 1
  const endCell   = blanks + endDay - 1

  const COLS = 7
  const meta = LABEL_META[booking.label]

  // Split across rows
  const bars: { startCol: number; endCol: number; row: number; segIndex: number }[] = []
  let cursor = startCell
  let segIndex = 0
  while (cursor <= endCell) {
    const row    = Math.floor(cursor / COLS)
    const rowEnd = Math.min(endCell, (row + 1) * COLS - 1)
    bars.push({ startCol: cursor % COLS, endCol: rowEnd % COLS, row, segIndex })
    cursor = rowEnd + 1
    segIndex++
  }

  const totalSegs = bars.length

  return (
    <>
      {bars.map((bar) => {
        const isFirstSeg = bar.segIndex === 0
        const isLastSeg  = bar.segIndex === totalSegs - 1

        // Round only the true start/end edges of the booking
        const roundLeft  = isFirstSeg && isRealStart
        const roundRight = isLastSeg  && isRealEnd

        // Inset the bar slightly from cell edges so it doesn't bleed to card border
        // Left inset: only on first col of a row if not rounded; right inset: only on last col of row if not rounded
        const leftInset  = bar.startCol === 0 && !roundLeft  ? '2px' : '0px'
        const rightInset = bar.endCol   === 6 && !roundRight ? '2px' : '0px'

        const leftPct  = `calc(${(bar.startCol / 7) * 100}% + ${leftInset})`
        const widthPct = `calc(${((bar.endCol - bar.startCol + 1) / 7) * 100}% - ${leftInset} - ${rightInset})`
        const top      = `${bar.row * 40 + 22}px`

        return (
          <button
            key={bar.segIndex}
            onClick={() => onBookingClick(booking)}
            className={`absolute h-5 pointer-events-auto flex items-center overflow-hidden z-20 ${meta.bg} opacity-90`}
            style={{
              left: leftPct,
              width: widthPct,
              top,
              borderRadius: `${roundLeft ? '9999px' : '2px'} ${roundRight ? '9999px' : '2px'} ${roundRight ? '9999px' : '2px'} ${roundLeft ? '9999px' : '2px'}`,
              paddingLeft:  roundLeft  ? '8px' : '4px',
              paddingRight: roundRight ? '8px' : '4px',
            }}
            title={meta.display}
          >
            {isFirstSeg && (
              <span className="text-white text-xs font-medium truncate leading-none">
                {meta.display}
              </span>
            )}
          </button>
        )
      })}
    </>
  )
}
