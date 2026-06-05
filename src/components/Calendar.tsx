import { useState } from 'react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, parseISO
} from 'date-fns'
import { Booking, LABEL_META } from '../types'
import { WEEKDAYS, toISO } from '../lib/dates'

const MONTH_IS = [
  'Janúar','Febrúar','Mars','Apríl','Maí','Júní',
  'Júlí','Ágúst','September','Október','Nóvember','Desember'
]

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
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setBase(m => subMonths(m, 1))}
          className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-600"
          aria-label="Fyrri mánuður"
        >
          ‹
        </button>
        <span className="text-sm text-gray-500">
          {MONTH_IS[months[0].getMonth()]} – {MONTH_IS[months[1].getMonth()]} {months[1].getFullYear()}
        </span>
        <button
          onClick={() => setBase(m => addMonths(m, 1))}
          className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-600"
          aria-label="Næsti mánuður"
        >
          ›
        </button>
      </div>

      {/* Two month grids */}
      <div className="space-y-6 px-2 pb-4">
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

  // Which bookings are visible this month?
  const monthStart = startOfMonth(month)
  const monthEnd   = endOfMonth(month)

  const visible = bookings.filter(b => {
    const bs = parseISO(b.start_date)
    const be = parseISO(b.end_date)
    // half-open: booking covers [start, end), so it overlaps the month if start < monthEnd+1 and end > monthStart
    return bs <= monthEnd && be > monthStart
  })

  return (
    <div>
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
        {/* Day number grid */}
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

        {/* Booking bars — rendered on top */}
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

  // Clamp to the visible month
  const visStart = bs < monthStart ? monthStart : bs
  // end_date is exclusive, last visible day is be - 1; but we don't draw on end_date cell
  const lastDay  = new Date(be.getTime() - 86400000) // be - 1 day
  const visEnd   = lastDay > monthEnd ? monthEnd : lastDay

  const startDay = visStart.getDate()
  const endDay   = visEnd.getDate()

  // Cell index (0-based) in the grid
  const startCell = blanks + startDay - 1
  const endCell   = blanks + endDay - 1

  const COLS = 7
  const meta = LABEL_META[booking.label]

  // We may need to split the bar across rows
  const bars: { startCol: number; endCol: number; row: number }[] = []
  let cursor = startCell
  while (cursor <= endCell) {
    const row = Math.floor(cursor / COLS)
    const rowEnd = Math.min(endCell, (row + 1) * COLS - 1)
    bars.push({ startCol: cursor % COLS, endCol: rowEnd % COLS, row })
    cursor = rowEnd + 1
  }

  return (
    <>
      {bars.map((bar, i) => {
        const isFirst = i === 0
        const isLast  = i === bars.length - 1
        const left   = `${(bar.startCol / 7) * 100}%`
        const width  = `${((bar.endCol - bar.startCol + 1) / 7) * 100}%`
        const top    = `${bar.row * 40 + 22}px` // 40px row height, 22px down from top

        return (
          <button
            key={i}
            onClick={() => onBookingClick(booking)}
            className={`absolute h-5 pointer-events-auto flex items-center overflow-hidden z-20
              ${meta.bg} opacity-90
              ${isFirst ? 'rounded-l-full pl-2' : 'pl-1'}
              ${isLast  ? 'rounded-r-full pr-2' : 'pr-1'}
            `}
            style={{ left, width, top }}
            title={LABEL_META[booking.label].display}
          >
            {isFirst && (
              <span className="text-white text-xs font-medium truncate leading-none">
                {LABEL_META[booking.label].display}
              </span>
            )}
          </button>
        )
      })}
    </>
  )
}
