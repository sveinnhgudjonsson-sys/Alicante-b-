import { supabase } from './supabase'
import { Booking, Label, Couple } from '../types'

export async function fetchBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('start_date')
  if (error) throw error
  return data as Booking[]
}

export async function createBooking(payload: {
  start_date: string
  end_date: string
  label: Label
  booked_by_couple: Couple
  notes: string | null
  created_by_email: string
}): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data as Booking
}

export async function updateBooking(id: string, payload: {
  start_date?: string
  end_date?: string
  label?: Label
  notes?: string | null
}): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Booking
}

export async function deleteBooking(id: string): Promise<void> {
  const { error } = await supabase.from('bookings').delete().eq('id', id)
  if (error) throw error
}
