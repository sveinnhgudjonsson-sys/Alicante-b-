export type Couple = 'A' | 'B'

export type Label = 'svenni_inga' | 'freyr_soley' | 'saman' | 'adrir_gestir'

export interface Member {
  email: string
  couple: Couple
  display_name: string
}

export interface Booking {
  id: string
  start_date: string   // ISO date, e.g. "2024-06-05"
  end_date: string
  label: Label
  booked_by_couple: Couple
  notes: string | null
  created_by_email: string
  created_at: string
  updated_at: string
}

export const LABEL_META: Record<Label, { display: string; color: string; bg: string; dot: string }> = {
  svenni_inga:  { display: 'Svenni & Inga',  color: 'text-blue-700',   bg: 'bg-blue-500',   dot: 'bg-blue-500' },
  freyr_soley:  { display: 'Freyr & Sóley',  color: 'text-green-700',  bg: 'bg-green-500',  dot: 'bg-green-500' },
  saman:        { display: 'Saman',           color: 'text-red-700',    bg: 'bg-red-500',    dot: 'bg-red-500' },
  adrir_gestir: { display: 'Aðrir gestir',    color: 'text-amber-700',  bg: 'bg-amber-400',  dot: 'bg-amber-400' },
}

export const COUPLE_DEFAULT_LABEL: Record<Couple, Label> = {
  A: 'svenni_inga',
  B: 'freyr_soley',
}
