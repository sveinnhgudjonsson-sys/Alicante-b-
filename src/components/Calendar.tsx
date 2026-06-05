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
  onRangeSelect: (start: string, end: string) => void
  onBookingClick: (b: Booking) => void
}

export default function Calendar({ bookings, onRangeSelect, onBookingClick }: Props) {
  const [base, setBase] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })

  // Two-tap selection state (shared across both month grids)
  const [selStart, setSelStart] = useState<string | null>(null)
  const [hovered,  setHovered]  = useState<string | null>(null)

  const months = [base, addMonths(base, 1)]

  function handleDayClick(iso: string, isCovered: boolean, booking?: Booking) {
    if (isCovered && booking) {
      // Clicking a booked day → edit that booking, cancel any selection
      setSelStart(null)
      setHovered(null)
      onBookingClick(booking)
      return
    }

    if (!selStart) {
      // First tap — set start
      setSelStart(iso)
      setHovered(iso)
    } else {
      // Second tap — confirm range
      const a = selStart < iso ? selStart : iso
      const b = selStart < iso ? iso      : selStart
      if (a === b) {
        // Tapped same day twice — reset
        setSelStart(null)
        setHovered(null)
        return
      }
      setSelStart(null)
      setHovered(null)
      // end date is the checkout day — add 1 day so the last clicked night is included
      const endDate = new Date(b)
      endDate.setDate(endDate.getDate() + 1)
      onRangeSelect(a, toISO(endDate))
    }
  }

  function handleDayHover(iso: string) {
    if (selStart) setHovered(iso)
  }

  function handleMouseLeave() {
    if (selStart) setHovered(selStart)
  }

  // Compute the visual preview range
  const previewStart = selStart && hovered ? (selStart < hovered ? selStart : hovered) : null
  const previewEnd   = selStart && hovered ? (selStart < hovered ? hovered  : selStart) : null

  return (
    <div onMouseLeave={handleMouseLeave}>
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
          {selStart
            ? <span className="text-blue-600 font-medium">Veldu síðasta dag…</span>
            : <>{MONTH_IS[months[0].getMonth()]} – {MONTH_IS[months[1].getMonth()]} {months[1].getFullYear()}</>
          }
        </span>
        <button
          onClick={() => setBase(m => addMonths(m, 1))}
          className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-600 text-xl leading-none"
          aria-label="Næsti mánuður"
        >
          ›
        </button>
      </div>

      {/* Hint text when selection is in progress */}
      {selStart && (
        <p className="text-center text-xs text-blue-500 pb-2 -mt-1">
          Smelltu á síðasta dag dvalarinnar
        </p>
      )}

      {/* Colour legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 pb-3">
        {LEGEND_LABELS.map(l => (
          <div key={l} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm flex-shrink-0 ${LABEL_META[l].bg}`} />
            <span className="text-xs text-gray-500">{LABEL_META[l].display}</span>
          </div>
        ))}
      </div>

      {/* Two month grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-4 px-2 pb-4">
        {months.map((month, mi) => (
          <MonthGrid
            key={mi}
            month={month}
            bookings={bookings}
            selStart={selStart}
            previewStart={previewStart}
            previewEnd={previewEnd}
            onDayClick={handleDayClick}
            onDayHover={handleDayHover}
          />
        ))}
      </div>
    </div>
  )
}

function MonthGrid({ month, bookings, selStart, previewStart, previewEnd, onDayClick, onDayHover }: {
  month: Date
  bookings: Booking[]
  selStart: string | null
  previewStart: string | null
  previewEnd: string | null
  onDayClick: (iso: string, isCovered: boolean, booking?: Booking) => void
  onDayHover: (iso: string) => void
}) {
  const days       = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const firstDow   = (getDay(days[0]) + 6) % 7
  const blanks     = Array(firstDow).fill(null)
  const monthStart = startOfMonth(month)
  const monthEnd   = endOfMonth(month)

  // Build per-day booking coverage map
  type CoverInfo = { booking: Booking; isBookingStart: boolean; isBookingEnd: boolean }
  const coverage = new Map<string, CoverInfo>()

  const visible = bookings.filter(b => {
    const bs = parseISO(b.start_date)
    const be = parseISO(b.end_date)
    return bs <= monthEnd && be > monthStart
  })

  for (const b of visible) {
    const bs       = parseISO(b.start_date)
    const be       = parseISO(b.end_date)
    const bLastDay = new Date(be.getTime() - 86400000)
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

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {blanks.map((_, i) => <div key={`b${i}`} className="h-10" />)}
        {days.map(day => {
          const iso   = toISO(day)
          const today = toISO(new Date()) === iso
          const cover = coverage.get(iso)
          const meta  = cover ? LABEL_META[cover.booking.label] : null

          const dow = (day.getDay() + 6) % 7 // Mon=0 … Sun=6

          // Booking colour block
          const visualFirst = cover ? (cover.isBookingStart || dow === 0) : false
          const visualLast  = cover ? (cover.isBookingEnd   || dow === 6) : false

          // Selection / preview highlight
          const isSelStart  = iso === selStart
          const inPreview   = previewStart && previewEnd && iso >= previewStart && iso <= previewEnd
          const isPreviewFirst = inPreview && (iso === previewStart || dow === 0)
          const isPreviewLast  = inPreview && (iso === previewEnd   || dow === 6)

          // Decide what to render
          const showBooking  = !!cover && !inPreview
          const showPreview  = !!inPreview && !cover
          const showSelStart = isSelStart && !cover

          // Border radius helpers
          function radius(left: boolean, right: boolean) {
            const r = '9999px', s = '2px'
            return `${left ? r : s} ${right ? r : s} ${right ? r : s} ${left ? r : s}`
          }

          let bgClass = ''
          let borderRadius = '0'
          let ml = '0', mr = '0'

          if (showBooking) {
            bgClass = `${meta!.bg} opacity-90`
            borderRadius = radius(visualFirst, visualLast)
            if (visualFirst) ml = '2px'
            if (visualLast)  mr = '2px'
          } else if (showPreview || showSelStart) {
            bgClass = 'bg-blue-200'
            borderRadius = radius(!!isPreviewFirst || isSelStart, !!isPreviewLast || isSelStart)
            if (isPreviewFirst || isSelStart) ml = '2px'
            if (isPreviewLast  || isSelStart) mr = '2px'
          }

          const textColor = showBooking
            ? 'text-white'
            : showPreview || showSelStart
              ? 'text-blue-800 font-semibold'
              : today
                ? 'text-blue-600 font-bold'
                : 'text-gray-700'

          return (
            <button
              key={iso}
              onClick={() => onDayClick(iso, !!cover, cover?.booking)}
              onMouseEnter={() => onDayHover(iso)}
              className={`h-10 flex items-center justify-center text-sm transition-colors
                ${bgClass}
                ${!showBooking && !showPreview && !showSelStart ? 'hover:bg-gray-100 active:bg-gray-200' : ''}
                ${today && showBooking ? 'ring-2 ring-white ring-inset' : ''}
              `}
              style={{
                borderRadius,
                marginLeft:  ml,
                marginRight: mr,
                width: (showBooking || showPreview || showSelStart) ? `calc(100% - ${ml} - ${mr})` : undefined,
              }}
              title={cover ? meta!.display : undefined}
            >
              <span className={textColor}>{day.getDate()}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
