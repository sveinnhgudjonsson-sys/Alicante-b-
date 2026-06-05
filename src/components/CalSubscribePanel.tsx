import { useState } from 'react'

const TOKEN   = import.meta.env.VITE_ICAL_TOKEN as string
const BASE    = 'https://hbswleiwpiycnznzpyee.supabase.co/functions/v1'
const FEED    = `${BASE}/ical?token=${TOKEN}`
const WEBCAL  = FEED.replace('https://', 'webcal://')
const GOOGLE  = `https://calendar.google.com/calendar/r/settings/addbyurl?url=${encodeURIComponent(FEED)}`

interface Props { onClose: () => void }

export default function CalSubscribePanel({ onClose }: Props) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(FEED).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel — drops down from header */}
      <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
        <h3 className="font-semibold text-gray-800 mb-1">Áskrift að dagatali</h3>
        <p className="text-xs text-gray-500 mb-3">
          Bættu við í dagatalsforriti þínu til að sjá bókanir sjálfkrafa.
        </p>

        {/* Feed URL + copy */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 mb-3">
          <span className="text-xs text-gray-500 truncate flex-1 font-mono">{FEED}</span>
          <button
            onClick={copy}
            className="flex-shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition"
          >
            {copied ? '✓ Afritað' : 'Afrita'}
          </button>
        </div>

        {/* Shortcuts */}
        <div className="space-y-2">
          <a
            href={GOOGLE}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-sm text-gray-700"
          >
            <span className="text-lg">📅</span>
            <span>Bæta við Google dagatal</span>
          </a>
          <a
            href={WEBCAL}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-sm text-gray-700"
          >
            <span className="text-lg">🍎</span>
            <span>Bæta við Apple dagatal</span>
          </a>
        </div>

        <p className="text-xs text-gray-400 mt-3 text-center">
          Hlekkurinn er einkamál — deila ekki opinberlega.
        </p>
      </div>
    </>
  )
}
