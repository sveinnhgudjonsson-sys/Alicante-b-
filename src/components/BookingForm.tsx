import { useState, useEffect } from 'react'
import { Booking, Label, LABEL_META, COUPLE_DEFAULT_LABEL } from '../types'
import { fmtDate } from '../lib/dates'
import { useAuth } from '../lib/auth'
import { createBooking, updateBooking } from '../lib/bookings'

interface Props {
  initialDate?: string       // pre-fill start date
  initialEndDate?: string    // pre-fill end date (from two-tap calendar selection)
  editing?: Booking          // if set, we're editing an existing booking
  bookings: Booking[]
  onSaved: (b: Booking, isNew: boolean) => void
  onClose: () => void
}

const LABELS: Label[] = ['svenni_inga', 'freyr_soley', 'saman', 'adrir_gestir']

export default function BookingForm({ initialDate, initialEndDate, editing, bookings, onSaved, onClose }: Props) {
  const { member } = useAuth()

  const defaultLabel = member ? COUPLE_DEFAULT_LABEL[member.couple] : 'svenni_inga'

  const [startDate, setStartDate] = useState(editing?.start_date ?? initialDate ?? '')
  const [endDate,   setEndDate]   = useState(editing?.end_date   ?? initialEndDate ?? '')
  const [label,     setLabel]     = useState<Label>(editing?.label ?? defaultLabel)
  const [notes,     setNotes]     = useState(editing?.notes ?? '')
  const [error,     setError]     = useState('')
  const [saving,    setSaving]    = useState(false)

  // When start changes, clear end if it's now <= start
  useEffect(() => {
    if (endDate && endDate <= startDate) setEndDate('')
  }, [startDate])

  function checkOverlap(start: string, end: string, excludeId?: string): Booking | null {
    for (const b of bookings) {
      if (b.id === excludeId) continue
      // half-open [start,end) overlap: b.start < end && b.end > start
      if (b.start_date < end && b.end_date > start) return b
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!startDate || !endDate) {
      setError('Vinsamlegast veldu inn- og útskráningardagsetningu.')
      return
    }
    if (endDate <= startDate) {
      setError('Útskráning verður að vera eftir innskráningu.')
      return
    }

    const conflict = checkOverlap(startDate, endDate, editing?.id)
    if (conflict) {
      setError(
        `Dagsetningar skarast við bókun: ${LABEL_META[conflict.label].display} ` +
        `(${fmtDate(conflict.start_date)} – ${fmtDate(conflict.end_date)}). ` +
        `Vinsamlegast veldu aðrar dagsetningar.`
      )
      return
    }

    setSaving(true)
    try {
      let saved: Booking
      if (editing) {
        saved = await updateBooking(editing.id, { start_date: startDate, end_date: endDate, label, notes: notes || null })
      } else {
        saved = await createBooking({
          start_date: startDate,
          end_date: endDate,
          label,
          booked_by_couple: member!.couple,
          notes: notes || null,
          created_by_email: member!.email,
        })
      }
      onSaved(saved, !editing)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      // Postgres exclusion constraint violation
      if (msg.includes('conflicting') || msg.includes('exclusion') || msg.includes('overlap')) {
        setError('Dagsetningar skarast við aðra bókun. Vinsamlegast veldu aðrar dagsetningar.')
      } else {
        setError('Villa kom upp. Reyndu aftur.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 pb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">
            {editing ? 'Breyta bókun' : 'Ný bókun'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Merking</label>
            <div className="grid grid-cols-2 gap-2">
              {LABELS.map(l => {
                const m = LABEL_META[l]
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLabel(l)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border-2 transition
                      ${label === l
                        ? `${m.bg} text-white border-transparent`
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                  >
                    {m.display}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Innskráning</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Útskráning</label>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={e => setEndDate(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Athugasemd <span className="font-normal text-gray-400">(valfrjálst)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="T.d. taka auka lykla, mæta kl. 23…"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition"
          >
            {saving ? 'Vista…' : editing ? 'Vista breytingar' : 'Búa til bókun'}
          </button>
        </form>
      </div>
    </div>
  )
}
