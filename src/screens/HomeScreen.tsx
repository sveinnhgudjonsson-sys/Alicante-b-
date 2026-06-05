import { useEffect, useState } from 'react'
import { Booking } from '../types'
import { fetchBookings, deleteBooking } from '../lib/bookings'
import { notify } from '../lib/notify'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import Calendar from '../components/Calendar'
import UpcomingList from '../components/UpcomingList'
import BookingForm from '../components/BookingForm'
import CalSubscribePanel from '../components/CalSubscribePanel'

export default function HomeScreen() {
  const { member } = useAuth()
  const [bookings, setBookings]       = useState<Booking[]>([])
  const [showForm, setShowForm]       = useState(false)
  const [editingBooking, setEditing]  = useState<Booking | undefined>()
  const [prefillDate, setPrefillDate] = useState<string | undefined>()
  const [prefillEnd,  setPrefillEnd]  = useState<string | undefined>()
  const [showSubscribe, setShowSubscribe] = useState(false)

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
    setPrefillEnd(undefined)
    setShowForm(true)
  }

  function openNewRange(start: string, end: string) {
    setEditing(undefined)
    setPrefillDate(start)
    setPrefillEnd(end)
    setShowForm(true)
  }

  function openEdit(b: Booking) {
    setEditing(b)
    setPrefillDate(undefined)
    setPrefillEnd(undefined)
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
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <h1 className="text-lg font-bold text-gray-800 flex-shrink-0">Alicante íbúð</h1>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => openNew()}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition"
            >
              + Ný bókun
            </button>
            <span className="text-sm text-gray-400 hidden sm:inline">{member?.display_name}</span>
            {/* Calendar subscribe button */}
            <div className="relative">
              <button
                onClick={() => setShowSubscribe(v => !v)}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded border border-gray-200 whitespace-nowrap"
                title="Áskrift að dagatali"
              >
                📅
              </button>
              {showSubscribe && (
                <CalSubscribePanel onClose={() => setShowSubscribe(false)} />
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded border border-gray-200"
            >
              Útskrá
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto pb-24">
        {/* Calendar */}
        <div className="bg-white mt-3 rounded-2xl shadow-sm mx-2 md:mx-0">
          <Calendar
            bookings={bookings}
            onRangeSelect={(start, end) => openNewRange(start, end)}
            onBookingClick={b => openEdit(b)}
          />
        </div>

        {/* Upcoming bookings */}
        <div className="bg-white mt-3 rounded-2xl shadow-sm mx-2 md:mx-0">
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
          initialEndDate={prefillEnd}
          editing={editingBooking}
          bookings={bookings}
          onSaved={handleSaved}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
