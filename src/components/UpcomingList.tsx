import { useState } from 'react'
import { Booking, LABEL_META } from '../types'
import { fmtDate, fmtNights, nights } from '../lib/dates'
import { toISO } from '../lib/dates'

interface Props {
  bookings: Booking[]
  onEdit: (b: Booking) => void
  onDelete: (b: Booking) => void
}

export default function UpcomingList({ bookings, onEdit, onDelete }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const today = toISO(new Date())
  const upcoming = bookings.filter(b => b.end_date > today)

  if (upcoming.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-gray-400 text-sm">
        Engar komandi bókanir
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {upcoming.map(b => {
        const meta = LABEL_META[b.label]
        const n = nights(b.start_date, b.end_date)
        const isExpanded = expandedId === b.id
        const isConfirming = confirmId === b.id

        return (
          <div key={b.id} className="px-4 py-3">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : b.id)}
            >
              {/* Colour dot */}
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${meta.dot}`} />

              {/* Label + dates */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{meta.display}</p>
                <p className="text-xs text-gray-500">
                  {fmtDate(b.start_date)} – {fmtDate(b.end_date)} · {fmtNights(n)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => onEdit(b)}
                  className="text-gray-400 hover:text-blue-600 px-2 py-1 text-sm"
                  aria-label="Breyta"
                >
                  ✎
                </button>
                {isConfirming ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { onDelete(b); setConfirmId(null) }}
                      className="text-xs text-red-600 font-semibold px-2 py-1 rounded bg-red-50"
                    >
                      Eyða
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="text-xs text-gray-500 px-2 py-1"
                    >
                      Hætta við
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(b.id)}
                    className="text-gray-400 hover:text-red-500 px-2 py-1 text-base leading-none"
                    aria-label="Eyða bókun"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Expanded note */}
            {isExpanded && b.notes && (
              <p className="mt-2 ml-6 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                {b.notes}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
