import { useEffect, useState } from 'react'
import { Booking } from '../types'
import { fetchBookings, deleteBooking } from '../lib/bookings'
import { notify } from '../lib/notify'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import Calendar from '../components/Calendar'
import UpcomingList from '../components/UpcomingList'
import BookingForm from '../components/BookingForm'

export default function HomeScreen() {
  const { member } = useAuth()
  const [bookings, setBookings]       = useState<Booking[]>([])
  const [showForm, setShowForm]       = useState(false)
  const [editingBooking, setEditing]  = useState<Booking | undefined>()
  const [prefillDate, setPrefillDate] = useState<string | undefined>()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const data = await fetchBookings()
    setBookings(data)
  }

  function openNew(date?: string) {
    setEditing(undefined)
    setPrefillDate(date)
    setShowForm(true)
  }

  function openEdit(b: Booking) {
    setEditing(b)
    setPrefillDate(undefined)
    setShowForm(true)
  }

  async function handleSaved(b: Booking, isNew: boolean) {
    setShowForm(false)
    await load()
    if (member) notify(isNew ? 'created' : 'updated', b, member.couple)
  }

  async function handleDelete(b: Booking) {
    await deleteBooking(b.id)
    setBookings(prev => prev.filter(x => x.id !== b.id))
    if (member) notify('deleted', b, member.couple)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 safe-top">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">Alicante íbúð</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{member?.display_name}</span>
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded border border-gray-200"
            >
              Útskrá
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto pb-24">
        {/* Calendar */}
        <div className="bg-white mt-3 rounded-2xl shadow-sm mx-2">
          <Calendar
            bookings={bookings}
            onDayClick={iso => openNew(iso)}
            onBookingClick={b => openEdit(b)}
          />
        </div>

        {/* Upcoming bookings */}
        <div className="bg-white mt-3 rounded-2xl shadow-sm mx-2">
          <div className="px-4 pt-4 pb-2">
            <h2 className="font-semibold text-gray-700">Komandi bókanir</h2>
          </div>
          <UpcomingList
            bookings={bookings}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </div>
      </main>

      {/* FAB */}
      <button
        onClick={() => openNew()}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg text-3xl flex items-center justify-center active:scale-95 transition safe-bottom"
        aria-label="Ný bókun"
      >
        +
      </button>

      {/* Booking form modal */}
      {showForm && (
        <BookingForm
          initialDate={prefillDate}
          editing={editingBooking}
          bookings={bookings}
          onSaved={handleSaved}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
