import { format, parseISO, differenceInDays } from 'date-fns'
import { is } from 'date-fns/locale'

const MONTHS_IS = [
  'janúar','febrúar','mars','apríl','maí','júní',
  'júlí','ágúst','september','október','nóvember','desember'
]

/** "5. júní" */
export function fmtDate(iso: string): string {
  const d = parseISO(iso)
  return `${d.getDate()}. ${MONTHS_IS[d.getMonth()]}`
}

/** "5. júní 2025" */
export function fmtDateLong(iso: string): string {
  const d = parseISO(iso)
  return `${d.getDate()}. ${MONTHS_IS[d.getMonth()]} ${d.getFullYear()}`
}

/** Nights between two ISO date strings (end − start) */
export function nights(start: string, end: string): number {
  return differenceInDays(parseISO(end), parseISO(start))
}

/** "2 nætur" / "1 nótt" */
export function fmtNights(n: number): string {
  return n === 1 ? '1 nótt' : `${n} nætur`
}

/** "Mán Þri Mið Fim Fös Lau Sun" */
export const WEEKDAYS = ['Mán','Þri','Mið','Fim','Fös','Lau','Sun']

/** ISO date string from a Date */
export function toISO(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

/** Date from ISO string */
export const fromISO = parseISO

export { is as icelandicLocale }
