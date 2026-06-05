import { Booking, Couple } from '../types'

type Action = 'created' | 'updated' | 'deleted'

export async function notify(action: Action, booking: Booking, actingCouple: Couple) {
  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, booking, actingCouple }),
    })
  } catch {
    // Notification failure is non-blocking
  }
}
